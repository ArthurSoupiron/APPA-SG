import { sql } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import {
  actionPlanAction,
  actionPlanActionPole,
  actionPlanAxis,
  actionPlanSmart,
  actionPlanSubAction,
  actionPlanSubActionPole,
  actionPlanSubAxis,
  type ActionPlanCampus,
  type ActionPlanPole,
  type ActionPlanStatus,
} from "../../db/schema";
import { canManageActionPlan } from "../../lib/action-plan/access";
import { getActionPlanTree } from "../../lib/action-plan/tree";
import type { AppVariables } from "../../types/app";
import { denyUnlessAuthenticated, parseOptionalString, readJsonBody } from "./helpers";

type ImportSubAction = {
  title: string;
  description?: string;
  owner?: string;
  status?: ActionPlanStatus;
  progress?: number;
  priority?: number;
  sortOrder?: number;
  startDate?: string | null;
  dueDate?: string | null;
  campus?: ActionPlanCampus | null;
  poles?: ActionPlanPole[];
};

type ImportAction = ImportSubAction & {
  subActions?: ImportSubAction[];
};

type ImportSmart = {
  title: string;
  description?: string;
  sortOrder?: number;
  actions?: ImportAction[];
};

type ImportSubAxis = {
  title: string;
  description?: string;
  sortOrder?: number;
  smarts?: ImportSmart[];
};

type ImportAxis = {
  title: string;
  description?: string;
  sortOrder?: number;
  subAxes?: ImportSubAxis[];
};

type ImportPayload = {
  tree?: ImportAxis[];
};

async function clearActionPlanData() {
  await db.execute(sql`TRUNCATE TABLE
    "action_plan"."sub_action_pole",
    "action_plan"."action_pole",
    "action_plan"."sub_action",
    "action_plan"."action",
    "action_plan"."smart",
    "action_plan"."sub_axis",
    "action_plan"."axis"
    CASCADE`);
}

async function importTree(tree: ImportAxis[]) {
  for (const axis of tree) {
    const axisId = crypto.randomUUID();
    await db.insert(actionPlanAxis).values({
      id: axisId,
      title: axis.title,
      description: axis.description ?? "",
      sortOrder: axis.sortOrder ?? 0,
    });

    for (const subAxis of axis.subAxes ?? []) {
      const subAxisId = crypto.randomUUID();
      await db.insert(actionPlanSubAxis).values({
        id: subAxisId,
        axisId,
        title: subAxis.title,
        description: subAxis.description ?? "",
        sortOrder: subAxis.sortOrder ?? 0,
      });

      for (const smart of subAxis.smarts ?? []) {
        const smartId = crypto.randomUUID();
        await db.insert(actionPlanSmart).values({
          id: smartId,
          subAxisId,
          title: smart.title,
          description: smart.description ?? "",
          sortOrder: smart.sortOrder ?? 0,
        });

        for (const action of smart.actions ?? []) {
          const actionId = crypto.randomUUID();
          await db.insert(actionPlanAction).values({
            id: actionId,
            smartId,
            title: action.title,
            description: action.description ?? "",
            owner: action.owner ?? null,
            status: action.status ?? "not_started",
            progress: Math.min(100, Math.max(0, action.progress ?? 0)),
            priority: action.priority ?? null,
            sortOrder: action.sortOrder ?? 0,
            startDate: action.startDate ? new Date(action.startDate) : null,
            dueDate: action.dueDate ? new Date(action.dueDate) : null,
            campus: action.campus ?? null,
          });

          const actionPoles = action.poles ?? [];
          if (actionPoles.length > 0) {
            await db.insert(actionPlanActionPole).values(
              actionPoles.map((pole) => ({ actionId, pole })),
            );
          }

          for (const subAction of action.subActions ?? []) {
            const subActionId = crypto.randomUUID();
            await db.insert(actionPlanSubAction).values({
              id: subActionId,
              actionId,
              title: subAction.title,
              description: subAction.description ?? "",
              owner: subAction.owner ?? null,
              status: subAction.status ?? "not_started",
              progress: Math.min(100, Math.max(0, subAction.progress ?? 0)),
              priority: subAction.priority ?? null,
              sortOrder: subAction.sortOrder ?? 0,
              startDate: subAction.startDate ? new Date(subAction.startDate) : null,
              dueDate: subAction.dueDate ? new Date(subAction.dueDate) : null,
              campus: subAction.campus ?? null,
            });

            const subPoles = subAction.poles ?? [];
            if (subPoles.length > 0) {
              await db.insert(actionPlanSubActionPole).values(
                subPoles.map((pole) => ({ subActionId, pole })),
              );
            }
          }
        }
      }
    }
  }
}

function parseImportTree(raw: unknown): ImportAxis[] | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as ImportPayload;
  if (!Array.isArray(payload.tree)) return null;

  const tree: ImportAxis[] = [];
  for (const axisRaw of payload.tree) {
    if (!axisRaw || typeof axisRaw !== "object") continue;
    const axis = axisRaw as ImportAxis;
    const title = parseOptionalString(axis.title);
    if (!title) continue;
    tree.push({ ...axis, title });
  }
  return tree;
}

export function registerActionPlanImportExportRoutes(
  app: HonoType<{ Variables: AppVariables }>,
) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get("/export", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canManageActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.manage" }, 403);
    }

    const result = await getActionPlanTree();
    return c.json({ exportedAt: new Date().toISOString(), ...result });
  });

  router.post("/import", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canManageActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.manage" }, 403);
    }

    const body = await readJsonBody(c);
    const tree = parseImportTree(body);
    if (!tree) {
      return c.json({ error: "bad_request", message: "tree invalide" }, 400);
    }

    await clearActionPlanData();
    await importTree(tree);
    const result = await getActionPlanTree();

    return c.json({ success: true, ...result });
  });

  app.route("/api/app/action-plan", router);
}

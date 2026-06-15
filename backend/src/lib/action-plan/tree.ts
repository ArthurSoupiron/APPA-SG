import { db } from "../../db";
import {
  actionPlanActionPole,
  actionPlanSubActionPole,
} from "../../db/schema";
import {
  serializeAction,
  serializeAxis,
  serializeSmart,
  serializeSubAction,
  serializeSubAxis,
  type ActionPlanTreeResponse,
  type SerializedActionNode,
  type SerializedAxisNode,
  type SerializedSmartNode,
  type SerializedSubActionNode,
  type SerializedSubAxisNode,
} from "./serialize";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function buildSubActionNode(
  subAction: SerializedSubActionNode["subAction"] & { poles: string[] },
): SerializedSubActionNode {
  return { subAction };
}

function buildActionNode(
  action: ReturnType<typeof serializeAction>,
  subActions: SerializedSubActionNode[],
): SerializedActionNode {
  const progress =
    subActions.length > 0
      ? average(subActions.map((s) => s.subAction.progress))
      : action.progress;
  return {
    action: { ...action, progress },
    subActions,
  };
}

function buildSmartNode(
  smart: ReturnType<typeof serializeSmart>,
  actions: SerializedActionNode[],
): SerializedSmartNode {
  return {
    smart,
    progress: average(actions.map((a) => a.action.progress)),
    actions,
  };
}

function buildSubAxisNode(
  subAxis: ReturnType<typeof serializeSubAxis>,
  smarts: SerializedSmartNode[],
): SerializedSubAxisNode {
  return {
    subAxis,
    progress: average(smarts.map((s) => s.progress)),
    smarts,
  };
}

function buildAxisNode(
  axis: ReturnType<typeof serializeAxis>,
  subAxes: SerializedSubAxisNode[],
): SerializedAxisNode {
  return {
    axis,
    progress: average(subAxes.map((s) => s.progress)),
    subAxes,
  };
}

export async function getActionPlanTree(): Promise<ActionPlanTreeResponse> {
  const [actionPoles, subActionPoles] = await Promise.all([
    db.select().from(actionPlanActionPole),
    db.select().from(actionPlanSubActionPole),
  ]);

  const actionPoleMap = new Map<string, string[]>();
  for (const row of actionPoles) {
    const list = actionPoleMap.get(row.actionId) ?? [];
    list.push(row.pole);
    actionPoleMap.set(row.actionId, list);
  }

  const subActionPoleMap = new Map<string, string[]>();
  for (const row of subActionPoles) {
    const list = subActionPoleMap.get(row.subActionId) ?? [];
    list.push(row.pole);
    subActionPoleMap.set(row.subActionId, list);
  }

  const axes = await db.query.actionPlanAxis.findMany({
    orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.title)],
    with: {
      subAxes: {
        orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.title)],
        with: {
          smarts: {
            orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.title)],
            with: {
              actions: {
                orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.title)],
                with: {
                  subActions: {
                    orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.title)],
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const tree: SerializedAxisNode[] = axes.map((axisRow) => {
    const subAxes = axisRow.subAxes.map((subAxisRow) => {
      const smarts = subAxisRow.smarts.map((smartRow) => {
        const actions = smartRow.actions.map((actionRow) => {
          const poles = actionPoleMap.get(actionRow.id) ?? [];
          const serializedAction = serializeAction(actionRow, poles);
          const subActions = actionRow.subActions.map((subActionRow) => {
            const subPoles = subActionPoleMap.get(subActionRow.id) ?? [];
            return buildSubActionNode(serializeSubAction(subActionRow, subPoles));
          });
          return buildActionNode(serializedAction, subActions);
        });
        return buildSmartNode(serializeSmart(smartRow), actions);
      });
      return buildSubAxisNode(serializeSubAxis(subAxisRow), smarts);
    });
    return buildAxisNode(serializeAxis(axisRow), subAxes);
  });

  return {
    tree,
    globalProgress: average(tree.map((a) => a.progress)),
  };
}

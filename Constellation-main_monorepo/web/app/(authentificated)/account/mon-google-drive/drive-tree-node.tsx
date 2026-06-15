"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  File01Icon,
  Folder01Icon,
  LinkSquare02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { memo, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { descendantIds } from "./drive-graph-descendants";
import { driveFolderBrowseUrl, isDriveFolderMime, openDriveItemInNewTab } from "./drive-open-url";
import { drivePermissionBadgeClass } from "./drive-permission-role";
import { layoutDriveTree } from "./drive-tree-dagre-layout";
import { type DriveTreeNodeData, driveNodeId, driveRootNodeId } from "./drive-tree-types";
import { attachBadgesInChunks, fetchChildrenPage, type SharedDrive } from "./mon-google-drive-api";

const SHORTCUT_MIME = "application/vnd.google-apps.shortcut";

function RowIcon({ mimeType }: { mimeType: string }) {
  if (isDriveFolderMime(mimeType)) {
    return (
      <HugeiconsIcon
        icon={Folder01Icon}
        strokeWidth={2}
        className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
      />
    );
  }
  if (mimeType === SHORTCUT_MIME) {
    return (
      <HugeiconsIcon
        icon={File01Icon}
        strokeWidth={2}
        className="size-4 shrink-0 text-violet-600 dark:text-violet-400"
      />
    );
  }
  return (
    <HugeiconsIcon
      icon={File01Icon}
      strokeWidth={2}
      className="size-4 shrink-0 text-muted-foreground"
    />
  );
}

function browseUrlForNode(d: DriveTreeNodeData): string | null {
  if (d.kind === "drive") return driveFolderBrowseUrl(d.driveId);
  if (d.kind === "folder") return driveFolderBrowseUrl(d.fileId ?? d.driveId);
  if (d.webViewLink) return d.webViewLink;
  if (d.fileId) return `https://drive.google.com/file/d/${encodeURIComponent(d.fileId)}/view`;
  return null;
}

function DriveTreeNodeInner({ id, data }: NodeProps) {
  const d = data as DriveTreeNodeData;
  const { getNode, getNodes, getEdges, setNodes, setEdges } = useReactFlow();

  const collapse = useCallback(() => {
    const edgesNow = getEdges();
    const desc = descendantIds(id, edgesNow);
    const nextEdges = edgesNow.filter((e) => !desc.has(e.source) && !desc.has(e.target));
    const filteredNodes = getNodes()
      .filter((n) => n.id === id || !desc.has(n.id))
      .map((n) =>
        n.id === id ? { ...n, data: { ...(n.data as DriveTreeNodeData), expanded: false } } : n,
      );
    const laidOut = layoutDriveTree(filteredNodes, nextEdges);
    setEdges(nextEdges);
    setNodes(laidOut);
  }, [getEdges, getNodes, id, setEdges, setNodes]);

  const expandFirstPage = useCallback(async () => {
    const me = getNode(id);
    if (!me) return;
    const driveId = d.driveId;
    const parentId = d.kind === "drive" ? driveId : (d.fileId ?? driveId);
    const edgesSnapshot = getEdges();
    const desc = descendantIds(id, edgesSnapshot);

    setNodes((ns) =>
      ns.map((n) =>
        n.id === id
          ? { ...n, data: { ...(n.data as DriveTreeNodeData), loadingChildren: true } }
          : n,
      ),
    );

    try {
      const { files } = await fetchChildrenPage(driveId, parentId, null);

      const newChildNodes = files.map((f) => {
        const nodeId = driveNodeId(driveId, f.id);
        const isFolder = isDriveFolderMime(f.mimeType);
        return {
          id: nodeId,
          type: "driveItem" as const,
          position: { x: 0, y: 0 },
          data: {
            kind: isFolder ? ("folder" as const) : ("file" as const),
            driveId,
            name: f.name,
            mimeType: f.mimeType,
            badges: [],
            fileId: f.id,
            webViewLink: f.webViewLink,
            expanded: false,
            loadingChildren: false,
          } satisfies DriveTreeNodeData,
        };
      });

      const newEdges = files.map((f) => ({
        id: `e-${id}-${driveNodeId(driveId, f.id)}`,
        source: id,
        target: driveNodeId(driveId, f.id),
        type: "smoothstep" as const,
      }));

      const edgesFiltered = edgesSnapshot.filter((e) => !desc.has(e.source) && !desc.has(e.target));
      const nextEdges = [...edgesFiltered, ...newEdges];

      const base = getNodes().filter((node) => node.id === id || !desc.has(node.id));
      const mapped = base.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...(node.data as DriveTreeNodeData),
                expanded: true,
                loadingChildren: false,
              },
            }
          : node,
      );
      const merged = [...mapped, ...newChildNodes];
      const laidOut = layoutDriveTree(merged, nextEdges);
      setEdges(nextEdges);
      setNodes(laidOut);

      void attachBadgesInChunks(driveId, files, (fid, badges) => {
        const nid = driveNodeId(driveId, fid);
        setNodes((ns) =>
          ns.map((node) => {
            if (node.id !== nid) return node;
            const cur = node.data as DriveTreeNodeData;
            return { ...node, data: { ...cur, badges } };
          }),
        );
      });
    } catch {
      setNodes((ns) =>
        ns.map((node) =>
          node.id === id
            ? { ...node, data: { ...(node.data as DriveTreeNodeData), loadingChildren: false } }
            : node,
        ),
      );
    }
  }, [d.driveId, d.fileId, d.kind, getEdges, getNode, getNodes, id, setEdges, setNodes]);

  const onToggle = () => {
    if (d.kind === "file") {
      openDriveItemInNewTab({
        id: d.fileId ?? "",
        name: d.name,
        mimeType: d.mimeType,
        webViewLink: d.webViewLink ?? null,
        shortcutDetails: null,
      });
      return;
    }
    if (d.expanded) {
      collapse();
      return;
    }
    void expandFirstPage();
  };

  const showExpand = d.kind === "drive" || d.kind === "folder";
  const isFolderish = d.kind === "drive" || d.kind === "folder";
  const driveBrowseHref = browseUrlForNode(d);

  return (
    <>
      {d.kind !== "drive" ? (
        <Handle
          type="target"
          position={Position.Left}
          className="!size-2 !border-border !bg-muted"
        />
      ) : null}
      <div
        className={cn(
          "min-w-[180px] max-w-[min(92vw,440px)] rounded-lg border bg-card px-2 py-2 shadow-md",
          d.searchHighlight
            ? "border-primary ring-2 ring-primary/70 ring-offset-2 ring-offset-background"
            : d.expanded
              ? "border-primary/60"
              : "border-border",
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1.5">
          {showExpand ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 self-center"
              aria-expanded={d.expanded}
              aria-label={d.expanded ? "Replier la branche" : "Déplier la branche"}
              disabled={d.loadingChildren}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {d.loadingChildren ? (
                <Spinner className="size-4" />
              ) : d.expanded ? (
                <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-4" />
              ) : (
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4" />
              )}
            </Button>
          ) : null}
          {driveBrowseHref ? (
            <a
              href={driveBrowseHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center self-center rounded-md text-muted-foreground",
                "hover:bg-muted hover:text-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              )}
              aria-label="Ouvrir dans Google Drive"
              title="Ouvrir dans Google Drive"
              onClick={(e) => e.stopPropagation()}
            >
              <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} className="size-4" />
            </a>
          ) : null}
          <button
            type="button"
            className={cn(
              "inline-flex min-h-7 min-w-0 max-w-full shrink items-center gap-2 rounded-sm text-left text-sm",
              "basis-[min(100%,12rem)] sm:basis-[min(100%,14rem)]",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              "self-center py-0.5",
              !showExpand && !driveBrowseHref ? "pl-1" : "",
            )}
            onClick={() => {
              if (!isFolderish) {
                onToggle();
              }
            }}
          >
            <RowIcon
              mimeType={d.kind === "drive" ? "application/vnd.google-apps.folder" : d.mimeType}
            />
            <span className="min-w-0 flex-1 whitespace-normal font-medium [overflow-wrap:anywhere]">
              {d.name}
            </span>
          </button>
          {d.badges.length > 0
            ? d.badges.map((b, i) => (
                <Badge
                  key={`${i}-${b.text}`}
                  variant="outline"
                  className={cn(
                    "max-w-full shrink-0 self-center whitespace-normal font-normal text-[10px] leading-tight [overflow-wrap:anywhere]",
                    drivePermissionBadgeClass(b.role),
                  )}
                >
                  {b.text}
                </Badge>
              ))
            : null}
        </div>
        {d.kind === "file" ? (
          <div role="paragraph" className="mt-1.5 text-[10px] text-muted-foreground">
            Clic sur le nom : ouvrir dans Drive
          </div>
        ) : null}
      </div>
      {isFolderish ? (
        <Handle
          type="source"
          position={Position.Right}
          className="!size-2 !border-border !bg-muted"
        />
      ) : null}
    </>
  );
}

export const DriveTreeNode = memo(DriveTreeNodeInner);

export const driveTreeNodeTypes = { driveItem: DriveTreeNode };

export function buildInitialDriveNodes(drives: SharedDrive[]) {
  const y0 = 40;
  const gap = 140;
  return drives.map((dr, i) => ({
    id: driveRootNodeId(dr.id),
    type: "driveItem" as const,
    position: { x: 40, y: y0 + i * gap },
    data: {
      kind: "drive" as const,
      driveId: dr.id,
      name: dr.name,
      mimeType: "application/vnd.google-apps.folder",
      badges: [],
      expanded: false,
      loadingChildren: false,
    } satisfies DriveTreeNodeData,
  }));
}

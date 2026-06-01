import type { Edge, Node, Rect } from "@xyflow/react";
import type { Dispatch, SetStateAction } from "react";

import { descendantIds } from "./drive-graph-descendants";
import { type DriveChildRow, isDriveFolderMime } from "./drive-open-url";
import {
  DRIVE_TREE_LAYOUT_NODE_H,
  DRIVE_TREE_LAYOUT_NODE_W,
  layoutDriveTree,
} from "./drive-tree-dagre-layout";
import {
  type DriveTreeNodeData,
  driveGoogleFileIdFromRfNodeId,
  driveNodeId,
  driveRootNodeId,
} from "./drive-tree-types";
import { attachBadgesInChunks, fetchChildrenPage } from "./mon-google-drive-api";

/** Cadrage après révélation : mesures DOM à jour + `fitBounds` plus fiable que `fitView({ nodes })`. */
export type DriveRevealViewport = {
  getNode: (id: string) => Node | undefined;
  getNodesBounds: (nodeIds: (Node | string)[]) => Rect;
  fitBounds: (bounds: Rect, options?: { padding?: number; duration?: number }) => Promise<boolean>;
  setCenter: (
    x: number,
    y: number,
    options?: { zoom?: number; duration?: number },
  ) => Promise<boolean>;
};

function afterNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

async function focusPathInViewport(
  vp: DriveRevealViewport,
  pathNodeIds: string[],
  targetId: string,
): Promise<void> {
  await afterNextPaint();
  const bounds = vp.getNodesBounds(pathNodeIds);
  const minSize = 8;
  if (bounds.width >= minSize && bounds.height >= minSize) {
    await vp.fitBounds(bounds, { padding: 0.28, duration: 420 });
    return;
  }
  const n = vp.getNode(targetId);
  if (n) {
    const cx = n.position.x + DRIVE_TREE_LAYOUT_NODE_W / 2;
    const cy = n.position.y + DRIVE_TREE_LAYOUT_NODE_H / 2;
    await vp.setCenter(cx, cy, { zoom: 1.08, duration: 420 });
  }
}

export type DriveFlowStore = {
  getNode: (id: string) => Node | undefined;
  getNodes: () => Node[];
  getEdges: () => Edge[];
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
};

export type ExpandParentOptions = {
  /**
   * Si le parent a déjà des enfants en graphe mais pas d’arête vers ce nœud enfant,
   * on recharge quand même (ex. fichier absent d’un état partiel / 1ʳᵉ page).
   */
  requireEdgeToChildId?: string;
};

/**
 * Déplie un nœud drive/dossier (charge les enfants) si ce n’est pas déjà fait.
 * Avec `requireEdgeToChildId`, enchaîne les pages API jusqu’à voir cet enfant (plafond 30 pages).
 */
export async function expandParentIfCollapsed(
  store: DriveFlowStore,
  parentRfId: string,
  opts?: ExpandParentOptions,
): Promise<void> {
  const { getNode, getNodes, getEdges, setNodes, setEdges } = store;
  const me = getNode(parentRfId);
  if (!me) return;
  const d = me.data as DriveTreeNodeData;
  if (d.kind === "file") return;

  const driveId = d.driveId;
  const parentId = d.kind === "drive" ? driveId : (d.fileId ?? driveId);
  const edgesNow = getEdges();
  const hasChildren = edgesNow.some((e) => e.source === parentRfId);
  if (d.expanded && hasChildren) {
    const need = opts?.requireEdgeToChildId;
    if (!need) return;
    const hasEdge = edgesNow.some((e) => e.source === parentRfId && e.target === need);
    if (hasEdge) return;
  }

  const desc = descendantIds(parentRfId, edgesNow);
  setNodes((ns) =>
    ns.map((n) =>
      n.id === parentRfId
        ? { ...n, data: { ...(n.data as DriveTreeNodeData), loadingChildren: true } }
        : n,
    ),
  );

  try {
    const chaseRfId = opts?.requireEdgeToChildId;
    const chaseGoogleId =
      chaseRfId != null ? driveGoogleFileIdFromRfNodeId(chaseRfId, driveId) : null;
    const maxPages = chaseGoogleId ? 30 : 1;
    const allFiles: DriveChildRow[] = [];
    let pageToken: string | null = null;
    for (let p = 0; p < maxPages; p++) {
      const { files, nextPageToken } = await fetchChildrenPage(driveId, parentId, pageToken);
      allFiles.push(...files);
      if (!chaseGoogleId) break;
      if (files.some((f) => f.id === chaseGoogleId)) break;
      pageToken = nextPageToken;
      if (!pageToken) break;
    }

    const newChildNodes = allFiles.map((f) => {
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

    const newEdges = allFiles.map((f) => ({
      id: `e-${parentRfId}-${driveNodeId(driveId, f.id)}`,
      source: parentRfId,
      target: driveNodeId(driveId, f.id),
      type: "smoothstep" as const,
    }));

    const edgesFiltered = edgesNow.filter((e) => !desc.has(e.source) && !desc.has(e.target));
    const nextEdges = [...edgesFiltered, ...newEdges];

    const base = getNodes().filter((node) => node.id === parentRfId || !desc.has(node.id));
    const mapped = base.map((node) =>
      node.id === parentRfId
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

    void attachBadgesInChunks(driveId, allFiles, (fid, badges) => {
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
        node.id === parentRfId
          ? { ...node, data: { ...(node.data as DriveTreeNodeData), loadingChildren: false } }
          : node,
      ),
    );
  }
}

/** Retire `searchHighlight` sur tous les nœuds (ex. clic sur le fond, champ vidé). */
export function stripSearchHighlights(setNodes: Dispatch<SetStateAction<Node[]>>): void {
  setNodes((ns) =>
    ns.map((n) => {
      const d = n.data as DriveTreeNodeData;
      if (!d.searchHighlight) return n;
      return { ...n, data: { ...d, searchHighlight: false } };
    }),
  );
}

export function clearSearchHighlight(store: DriveFlowStore): void {
  stripSearchHighlights(store.setNodes);
}

export async function revealDriveSearchResult(
  store: DriveFlowStore,
  hit: { driveId: string; id: string; folderIdsFromRoot: string[]; mimeType?: string },
  vp: DriveRevealViewport,
): Promise<void> {
  clearSearchHighlight(store);

  const { driveId, id: itemId, folderIdsFromRoot } = hit;
  const rootId = driveRootNodeId(driveId);

  let parentRfId = rootId;
  for (const folderId of folderIdsFromRoot) {
    const nextRfId = driveNodeId(driveId, folderId);
    await expandParentIfCollapsed(store, parentRfId, { requireEdgeToChildId: nextRfId });
    await afterNextPaint();
    parentRfId = nextRfId;
  }
  await expandParentIfCollapsed(store, parentRfId);
  await afterNextPaint();

  const targetId = driveNodeId(driveId, itemId);
  const isFileHit = !isDriveFolderMime(hit.mimeType ?? "");
  if (isFileHit) {
    const immediateParentGoogleId =
      folderIdsFromRoot.length > 0 ? folderIdsFromRoot[folderIdsFromRoot.length - 1]! : driveId;
    const immediateParentRfId =
      immediateParentGoogleId === driveId ? rootId : driveNodeId(driveId, immediateParentGoogleId);
    await expandParentIfCollapsed(store, immediateParentRfId, {
      requireEdgeToChildId: targetId,
    });
    await afterNextPaint();
  }
  store.setNodes((ns) =>
    ns.map((n) => {
      const d = n.data as DriveTreeNodeData;
      const onPath =
        n.id === rootId ||
        folderIdsFromRoot.some((fid) => driveNodeId(driveId, fid) === n.id) ||
        n.id === targetId;
      return { ...n, data: { ...d, searchHighlight: Boolean(onPath) } };
    }),
  );

  const pathNodeIds = [
    rootId,
    ...folderIdsFromRoot.map((fid) => driveNodeId(driveId, fid)),
    targetId,
  ];
  await focusPathInViewport(vp, pathNodeIds, targetId);
}

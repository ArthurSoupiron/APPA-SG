import { Graph, layout } from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";

/** Dimensions « boîte » pour le layout (carte élargie + badges sur une ligne / retour). */
export const DRIVE_TREE_LAYOUT_NODE_W = 408;
export const DRIVE_TREE_LAYOUT_NODE_H = 132;

const NODE_W = DRIVE_TREE_LAYOUT_NODE_W;
const NODE_H = DRIVE_TREE_LAYOUT_NODE_H;

const ROOT_GAP_Y = 152;

/**
 * Recalcule les positions (graphe dirigé, gauche → droite) pour éviter les superpositions.
 * Sans arêtes : empile les racines verticalement (drives seuls).
 */
export function layoutDriveTree(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  if (edges.length === 0) {
    return nodes.map((n, i) => ({
      ...n,
      position: { x: 48, y: 48 + i * ROOT_GAP_Y },
    }));
  }

  const g = new Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    ranksep: 96,
    nodesep: 48,
    edgesep: 36,
    marginx: 48,
    marginy: 48,
  });

  for (const n of nodes) {
    g.setNode(n.id, { width: NODE_W, height: NODE_H });
  }
  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.setEdge(e.source, e.target);
    }
  }

  layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id) as { x?: number; y?: number } | undefined;
    if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
      return n;
    }
    return {
      ...n,
      position: {
        x: pos.x - NODE_W / 2,
        y: pos.y - NODE_H / 2,
      },
    };
  });
}

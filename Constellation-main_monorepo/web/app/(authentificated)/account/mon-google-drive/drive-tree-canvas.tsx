"use client";

import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { DriveTreeSearch } from "./drive-tree-search";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";
import { stripSearchHighlights } from "./drive-graph-expand";
import { layoutDriveTree } from "./drive-tree-dagre-layout";
import { buildInitialDriveNodes, driveTreeNodeTypes } from "./drive-tree-node";
import { type DriveTreeNodeData, driveRootNodeId } from "./drive-tree-types";
import { fetchPermissionBadges, type SharedDrive } from "./mon-google-drive-api";

const defaultEdgeOptions = { type: "smoothstep" as const };

const MIN_ZOOM = 0.12;
const MAX_ZOOM = 1.6;

export function DriveTreeCanvas({
  drives,
  className,
}: {
  drives: SharedDrive[];
  className?: string;
}) {
  const initialNodes = useMemo(() => layoutDriveTree(buildInitialDriveNodes(drives), []), [drives]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(layoutDriveTree(buildInitialDriveNodes(drives), []));
    setEdges([]);

    if (drives.length === 0) return;

    let cancelled = false;
    const chunk = 4;
    void (async () => {
      for (let i = 0; i < drives.length; i += chunk) {
        const slice = drives.slice(i, i + chunk);
        const results = await Promise.all(
          slice.map(async (dr) => ({
            nodeId: driveRootNodeId(dr.id),
            badges: await fetchPermissionBadges(dr.id, dr.id),
          })),
        );
        if (cancelled) return;
        for (const { nodeId, badges } of results) {
          setNodes((ns) =>
            ns.map((n) =>
              n.id === nodeId ? { ...n, data: { ...(n.data as DriveTreeNodeData), badges } } : n,
            ),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [drives, setEdges, setNodes]);

  const onPaneClick = useCallback(() => {
    stripSearchHighlights(setNodes);
  }, [setNodes]);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-muted/15",
        className,
      )}
    >
      <ReactFlow
        className="jm-drive-tree-flow min-h-0 flex-1"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={onPaneClick}
        nodeTypes={driveTreeNodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        zoomOnScroll
        panOnDrag
        selectionOnDrag={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        elevateEdgesOnSelect
      >
        <DriveTreeSearch drives={drives} />
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          className="!bg-card/90"
          maskColor="rgb(0,0,0,0.35)"
          nodeStrokeWidth={2}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}

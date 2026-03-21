// src/components/canvas/FlowCanvas.tsx
"use client";
import { useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  NodeTypes,
  SelectionMode,
  useReactFlow,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";

import { useWorkflowStore } from "@/store/workflow-store";
import { TextNode } from "@/components/nodes/TextNode";
import { UploadImageNode } from "@/components/nodes/UploadImageNode";
import { UploadVideoNode } from "@/components/nodes/UploadVideoNode";
import { LLMNode } from "@/components/nodes/LLMNode";
import { CropImageNode } from "@/components/nodes/CropImageNode";
import { ExtractFrameNode } from "@/components/nodes/ExtractFrameNode";
import { hasCycle } from "@/lib/dag";
import { Play, Loader2 } from "lucide-react";

const nodeTypes: NodeTypes = {
  textNode: TextNode,
  uploadImage: UploadImageNode,
  uploadVideo: UploadVideoNode,
  llmNode: LLMNode,
  cropImage: CropImageNode,
  extractFrame: ExtractFrameNode,
};

export function FlowCanvas() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    isExecuting,
  } = useWorkflowStore();

  const { fitView } = useReactFlow();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        // Undo is handled by zundo via store
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        selectionMode={SelectionMode.Partial}
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode="Shift"
        panOnDrag={[1, 2]}
        zoomOnScroll
        minZoom={0.1}
        maxZoom={2}
        snapToGrid
        snapGrid={[8, 8]}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { stroke: "#7c3aed", strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#2a2a2a"
        />

        <Controls
          style={{
            bottom: 80,
            left: 16,
          }}
        />

        <MiniMap
          style={{
            bottom: 16,
            right: 16,
            width: 160,
            height: 100,
          }}
          nodeColor={(node) => {
            const status = (node.data as any)?.status;
            if (status === "running") return "#7c3aed";
            if (status === "success") return "#22c55e";
            if (status === "error") return "#ef4444";
            return "#333333";
          }}
          maskColor="rgba(10,10,10,0.7)"
        />

        {/* Empty state */}
        {nodes.length === 0 && (
          <Panel position="top-center" style={{ marginTop: "20%" }}>
            <div className="flex flex-col items-center gap-4 pointer-events-none select-none">
              <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" stroke="#525252" strokeWidth="1.5" fill="none" />
                  <circle cx="8" cy="8" r="2" fill="#525252" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#737373]">Your canvas is empty</p>
                <p className="text-xs text-[#525252] mt-1">Add nodes from the left sidebar to get started</p>
              </div>
            </div>
          </Panel>
        )}

        {/* Running indicator */}
        {isExecuting && (
          <Panel position="bottom-center" style={{ bottom: 16 }}>
            <div className="flex items-center gap-2 bg-[#111111] border border-[#7c3aed]/50 rounded-full px-4 py-2 text-xs text-purple-300 shadow-lg">
              <Loader2 size={12} className="animate-spin" />
              Workflow executing…
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

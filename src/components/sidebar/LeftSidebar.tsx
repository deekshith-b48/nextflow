// src/components/sidebar/LeftSidebar.tsx
"use client";
import { useCallback, useState } from "react";
import {
  Type, ImageIcon, Video, Cpu, Crop, Film,
  Search, ChevronLeft, ChevronRight, Zap,
} from "lucide-react";
import { useWorkflowStore } from "@/store/workflow-store";
import { FlowNode, NodeData } from "@/types";
import { cn } from "@/lib/utils";

const NODE_TYPES = [
  {
    type: "textNode",
    label: "Text",
    description: "Text input with output",
    icon: Type,
    color: "#6366f1",
    defaultData: { label: "Text", status: "idle", text: "" },
  },
  {
    type: "uploadImage",
    label: "Upload Image",
    description: "Upload image file",
    icon: ImageIcon,
    color: "#06b6d4",
    defaultData: { label: "Upload Image", status: "idle" },
  },
  {
    type: "uploadVideo",
    label: "Upload Video",
    description: "Upload video file",
    icon: Video,
    color: "#f59e0b",
    defaultData: { label: "Upload Video", status: "idle" },
  },
  {
    type: "llmNode",
    label: "Run LLM",
    description: "Execute Gemini model",
    icon: Cpu,
    color: "#7c3aed",
    defaultData: { label: "Run LLM", status: "idle", model: "gemini-1.5-flash" },
  },
  {
    type: "cropImage",
    label: "Crop Image",
    description: "Crop image with FFmpeg",
    icon: Crop,
    color: "#10b981",
    defaultData: { label: "Crop Image", status: "idle", xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100 },
  },
  {
    type: "extractFrame",
    label: "Extract Frame",
    description: "Extract video frame",
    icon: Film,
    color: "#f43f5e",
    defaultData: { label: "Extract Frame", status: "idle", timestamp: "0" },
  },
];

export function LeftSidebar() {
  const { leftSidebarOpen, toggleLeftSidebar, addNode, nodes } = useWorkflowStore();
  const [search, setSearch] = useState("");

  const filtered = NODE_TYPES.filter(
    (n) =>
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddNode = useCallback(
    (nodeType: (typeof NODE_TYPES)[number]) => {
      // Place new nodes slightly offset from center to avoid stacking
      const offset = nodes.length * 30;
      const newNode: FlowNode = {
        id: `${nodeType.type}-${Date.now()}`,
        type: nodeType.type,
        position: { x: 200 + offset, y: 200 + offset },
        data: { ...nodeType.defaultData } as NodeData,
      };
      addNode(newNode);
    },
    [nodes.length, addNode]
  );

  return (
    <div
      className={cn(
        "relative flex h-full shrink-0 flex-col border-r border-[#2a2a2a] bg-[#111111] transition-all duration-300",
        leftSidebarOpen ? "w-56" : "w-0 overflow-hidden"
      )}
    >
      {/* Toggle button */}
      <button
        onClick={toggleLeftSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#2a2a2a] border border-[#333] flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#333] transition-colors"
      >
        {leftSidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-[#7c3aed]" />
            <span className="text-xs font-semibold text-[#e5e5e5]">Nodes</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#525252]" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-7 pr-3 py-1.5 text-xs text-[#e5e5e5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>
        </div>

        {/* Quick Access */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-[9px] font-semibold text-[#525252] uppercase tracking-wider mb-2">
            Quick Access
          </p>

          <div className="space-y-1">
            {filtered.map((nodeType) => {
              const Icon = nodeType.icon;
              return (
                <button
                  key={nodeType.type}
                  onClick={() => handleAddNode(nodeType)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left group"
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${nodeType.color}22`, border: `1px solid ${nodeType.color}44` }}
                  >
                    <Icon size={12} style={{ color: nodeType.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#e5e5e5] truncate group-hover:text-white">
                      {nodeType.label}
                    </p>
                    <p className="text-[9px] text-[#525252] truncate">{nodeType.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

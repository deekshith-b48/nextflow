// src/components/nodes/BaseNode.tsx
"use client";
import { ReactNode, memo } from "react";
import { NodeStatus } from "@/types";
import { X, GripVertical } from "lucide-react";
import { useWorkflowStore } from "@/store/workflow-store";
import { cn } from "@/lib/utils";

interface BaseNodeProps {
  id: string;
  title: string;
  icon: ReactNode;
  status: NodeStatus;
  children: ReactNode;
  className?: string;
  minWidth?: number;
}

export const BaseNode = memo(function BaseNode({
  id, title, icon, status, children, className, minWidth = 280,
}: BaseNodeProps) {
  const deleteNode = useWorkflowStore((s) => s.deleteNode);

  return (
    <div
      className={cn(
        "relative rounded-xl border border-[#2a2a2a] bg-[#111111] shadow-xl",
        "transition-all duration-200",
        status === "running" && "node-running border-purple-500/60",
        status === "success" && "border-green-500/40",
        status === "error" && "border-red-500/40",
        className
      )}
      style={{ minWidth }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical size={14} className="text-[#525252] shrink-0 cursor-grab" />
          <span className="text-[#7c3aed]">{icon}</span>
          <span className="text-xs font-medium text-[#e5e5e5] truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status indicator */}
          {status === "running" && (
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          )}
          {status === "success" && (
            <div className="w-2 h-2 rounded-full bg-green-400" />
          )}
          {status === "error" && (
            <div className="w-2 h-2 rounded-full bg-red-400" />
          )}
          <button
            onClick={() => deleteNode(id)}
            className="w-5 h-5 rounded flex items-center justify-center text-[#525252] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">{children}</div>
    </div>
  );
});

// src/components/nodes/TextNode.tsx
"use client";
import { memo, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Type } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { TextNodeData } from "@/types";
import { useWorkflowStore } from "@/store/workflow-store";

export const TextNode = memo(function TextNode({ id, data }: NodeProps<TextNodeData>) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { text: e.target.value });
    },
    [id, updateNodeData]
  );

  return (
    <BaseNode id={id} title="Text" icon={<Type size={13} />} status={data.status} minWidth={260}>
      <textarea
        value={data.text ?? ""}
        onChange={handleChange}
        placeholder="Enter text..."
        rows={4}
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#e5e5e5] placeholder-[#525252] resize-none focus:outline-none focus:border-[#7c3aed] transition-colors nodrag"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: "50%", right: -5 }}
        title="Text output"
      />
    </BaseNode>
  );
});

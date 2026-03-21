// src/components/nodes/CropImageNode.tsx
"use client";
import { memo, useMemo } from "react";
import { Handle, Position, NodeProps, useEdges } from "reactflow";
import { Crop } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { CropImageNodeData } from "@/types";
import { useWorkflowStore } from "@/store/workflow-store";
import { cn } from "@/lib/utils";

export const CropImageNode = memo(function CropImageNode({ id, data }: NodeProps<CropImageNodeData>) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const edges = useEdges();

  const connectedHandles = useMemo(() => {
    const connected = new Set<string>();
    edges.forEach((e) => { if (e.target === id && e.targetHandle) connected.add(e.targetHandle); });
    return connected;
  }, [edges, id]);

  const field = (
    handleId: string,
    label: string,
    key: keyof CropImageNodeData,
    defaultVal: number | string,
    placeholder?: string
  ) => (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-1.5 h-1.5 rounded-full border border-[#7c3aed]" />
        <label className="text-[10px] text-[#737373]">{label}</label>
        {connectedHandles.has(handleId) && (
          <span className="text-[9px] bg-[#7c3aed]/20 text-[#a78bfa] px-1.5 py-0.5 rounded">connected</span>
        )}
      </div>
      <input
        type={handleId === "image_url" ? "text" : "number"}
        min={handleId !== "image_url" ? 0 : undefined}
        max={handleId !== "image_url" ? 100 : undefined}
        value={(data[key] as any) ?? defaultVal}
        onChange={(e) => updateNodeData(id, { [key]: handleId === "image_url" ? e.target.value : Number(e.target.value) } as any)}
        disabled={connectedHandles.has(handleId)}
        placeholder={connectedHandles.has(handleId) ? "From connected node" : placeholder}
        className={cn(
          "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-[#e5e5e5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed] transition-colors nodrag",
          connectedHandles.has(handleId) && "opacity-50 cursor-not-allowed bg-[#151515]"
        )}
      />
    </div>
  );

  return (
    <BaseNode id={id} title="Crop Image" icon={<Crop size={13} />} status={data.status} minWidth={280}>
      {/* Input handles */}
      <Handle type="target" position={Position.Left} id="image_url" style={{ top: "20%", left: -5 }} title="Image URL" />
      <Handle type="target" position={Position.Left} id="x_percent" style={{ top: "38%", left: -5 }} title="X %" />
      <Handle type="target" position={Position.Left} id="y_percent" style={{ top: "53%", left: -5 }} title="Y %" />
      <Handle type="target" position={Position.Left} id="width_percent" style={{ top: "68%", left: -5 }} title="Width %" />
      <Handle type="target" position={Position.Left} id="height_percent" style={{ top: "83%", left: -5 }} title="Height %" />

      <div className="space-y-2">
        {field("image_url", "Image URL", "imageUrl" as any, "", "https://...")}
        <div className="grid grid-cols-2 gap-2">
          {field("x_percent", "X %", "xPercent", 0, "0")}
          {field("y_percent", "Y %", "yPercent", 0, "0")}
          {field("width_percent", "Width %", "widthPercent", 100, "100")}
          {field("height_percent", "Height %", "heightPercent", 100, "100")}
        </div>
      </div>

      {data.outputUrl && (
        <div className="mt-2">
          <p className="text-[9px] text-[#737373] mb-1">Output</p>
          <img src={data.outputUrl} alt="Cropped" className="w-full h-24 object-cover rounded-lg border border-[#2a2a2a]" />
        </div>
      )}

      {data.error && (
        <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/30">
          <p className="text-[10px] text-red-400">{data.error}</p>
        </div>
      )}

      <Handle type="source" position={Position.Right} id="output" style={{ top: "50%", right: -5 }} />
    </BaseNode>
  );
});

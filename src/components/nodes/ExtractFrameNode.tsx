// src/components/nodes/ExtractFrameNode.tsx
"use client";
import { memo, useMemo } from "react";
import { Handle, Position, NodeProps, useEdges } from "reactflow";
import { Film } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { ExtractFrameNodeData } from "@/types";
import { useWorkflowStore } from "@/store/workflow-store";
import { cn } from "@/lib/utils";

export const ExtractFrameNode = memo(function ExtractFrameNode({ id, data }: NodeProps<ExtractFrameNodeData>) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const edges = useEdges();

  const connectedHandles = useMemo(() => {
    const connected = new Set<string>();
    edges.forEach((e) => { if (e.target === id && e.targetHandle) connected.add(e.targetHandle); });
    return connected;
  }, [edges, id]);

  return (
    <BaseNode id={id} title="Extract Frame" icon={<Film size={13} />} status={data.status} minWidth={280}>
      <Handle type="target" position={Position.Left} id="video_url" style={{ top: "35%", left: -5 }} title="Video URL" />
      <Handle type="target" position={Position.Left} id="timestamp" style={{ top: "65%", left: -5 }} title="Timestamp" />

      <div className="space-y-2.5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full border border-[#7c3aed]" />
            <label className="text-[10px] text-[#737373]">Video URL <span className="text-red-400">*</span></label>
            {connectedHandles.has("video_url") && (
              <span className="text-[9px] bg-[#7c3aed]/20 text-[#a78bfa] px-1.5 py-0.5 rounded">connected</span>
            )}
          </div>
          <input
            type="text"
            value={data.videoUrl ?? ""}
            onChange={(e) => updateNodeData(id, { videoUrl: e.target.value })}
            disabled={connectedHandles.has("video_url")}
            placeholder={connectedHandles.has("video_url") ? "From connected node" : "https://..."}
            className={cn(
              "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-[#e5e5e5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed] transition-colors nodrag",
              connectedHandles.has("video_url") && "opacity-50 cursor-not-allowed bg-[#151515]"
            )}
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full border border-[#7c3aed]" />
            <label className="text-[10px] text-[#737373]">Timestamp</label>
            {connectedHandles.has("timestamp") && (
              <span className="text-[9px] bg-[#7c3aed]/20 text-[#a78bfa] px-1.5 py-0.5 rounded">connected</span>
            )}
          </div>
          <input
            type="text"
            value={data.timestamp ?? "0"}
            onChange={(e) => updateNodeData(id, { timestamp: e.target.value })}
            disabled={connectedHandles.has("timestamp")}
            placeholder="e.g. 5 or 50%"
            className={cn(
              "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-[#e5e5e5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed] transition-colors nodrag",
              connectedHandles.has("timestamp") && "opacity-50 cursor-not-allowed bg-[#151515]"
            )}
          />
          <p className="text-[9px] text-[#525252] mt-1">Seconds (e.g. 5) or percentage (e.g. 50%)</p>
        </div>
      </div>

      {data.outputUrl && (
        <div className="mt-2">
          <p className="text-[9px] text-[#737373] mb-1">Extracted Frame</p>
          <img src={data.outputUrl} alt="Frame" className="w-full h-24 object-cover rounded-lg border border-[#2a2a2a]" />
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

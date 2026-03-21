// src/components/nodes/LLMNode.tsx
"use client";
import { memo, useCallback, useEffect, useMemo } from "react";
import { Handle, Position, NodeProps, useEdges } from "reactflow";
import { Cpu, ChevronDown, Play, Loader2 } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { LLMNodeData, GEMINI_MODELS } from "@/types";
import { useWorkflowStore } from "@/store/workflow-store";
import { cn } from "@/lib/utils";

export const LLMNode = memo(function LLMNode({ id, data }: NodeProps<LLMNodeData>) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const updateNodeStatus = useWorkflowStore((s) => s.updateNodeStatus);
  const workflowId = useWorkflowStore((s) => s.workflowId);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useEdges();

  // Which handles are connected?
  const connectedHandles = useMemo(() => {
    const connected = new Set<string>();
    edges.forEach((e) => {
      if (e.target === id && e.targetHandle) connected.add(e.targetHandle);
    });
    return connected;
  }, [edges, id]);

  const handleRun = useCallback(async () => {
    if (!workflowId) return;
    updateNodeStatus(id, "running");

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          nodeIds: [id],
          nodes,
          edges,
        }),
      });
      const { runId } = await res.json();

      // Poll for result
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`/api/history/${runId}`);
        const run = await statusRes.json();
        const nodeRun = run.nodeRuns?.find((nr: any) => nr.nodeId === id);

        if (nodeRun?.status === "SUCCESS") {
          clearInterval(pollInterval);
          const output = nodeRun.outputs?.output;
          updateNodeData(id, { outputText: output, status: "success" });
        } else if (nodeRun?.status === "FAILED") {
          clearInterval(pollInterval);
          updateNodeData(id, { status: "error", error: nodeRun.error });
        }
      }, 1500);
    } catch (err) {
      updateNodeStatus(id, "error", undefined, String(err));
    }
  }, [id, workflowId, nodes, edges, updateNodeData, updateNodeStatus]);

  return (
    <BaseNode id={id} title="Run LLM" icon={<Cpu size={13} />} status={data.status} minWidth={300}>
      {/* Input handles */}
      <Handle type="target" position={Position.Left} id="system_prompt" style={{ top: "32%", left: -5 }} title="System Prompt" />
      <Handle type="target" position={Position.Left} id="user_message" style={{ top: "55%", left: -5 }} title="User Message" />
      <Handle type="target" position={Position.Left} id="images" style={{ top: "78%", left: -5 }} title="Images (multiple)" />

      <div className="space-y-2.5">
        {/* Model selector */}
        <div>
          <label className="text-[10px] text-[#737373] mb-1 block">Model</label>
          <div className="relative">
            <select
              value={data.model ?? "gemini-1.5-flash"}
              onChange={(e) => updateNodeData(id, { model: e.target.value as any })}
              className="w-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors pr-7 nodrag cursor-pointer"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#525252] pointer-events-none" />
          </div>
        </div>

        {/* System prompt */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full border border-[#7c3aed]" />
            <label className="text-[10px] text-[#737373]">System Prompt</label>
            {connectedHandles.has("system_prompt") && (
              <span className="text-[9px] bg-[#7c3aed]/20 text-[#a78bfa] px-1.5 py-0.5 rounded">connected</span>
            )}
          </div>
          <textarea
            value={data.systemPrompt ?? ""}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
            disabled={connectedHandles.has("system_prompt")}
            placeholder={connectedHandles.has("system_prompt") ? "Value from connected node" : "Optional system instructions..."}
            rows={2}
            className={cn(
              "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#e5e5e5] placeholder-[#525252] resize-none focus:outline-none focus:border-[#7c3aed] transition-colors nodrag",
              connectedHandles.has("system_prompt") && "opacity-50 cursor-not-allowed bg-[#151515]"
            )}
          />
        </div>

        {/* User message */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full border border-[#7c3aed]" />
            <label className="text-[10px] text-[#737373]">User Message <span className="text-red-400">*</span></label>
            {connectedHandles.has("user_message") && (
              <span className="text-[9px] bg-[#7c3aed]/20 text-[#a78bfa] px-1.5 py-0.5 rounded">connected</span>
            )}
          </div>
          <textarea
            value={data.userMessage ?? ""}
            onChange={(e) => updateNodeData(id, { userMessage: e.target.value })}
            disabled={connectedHandles.has("user_message")}
            placeholder={connectedHandles.has("user_message") ? "Value from connected node" : "Enter your message..."}
            rows={3}
            className={cn(
              "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#e5e5e5] placeholder-[#525252] resize-none focus:outline-none focus:border-[#7c3aed] transition-colors nodrag",
              connectedHandles.has("user_message") && "opacity-50 cursor-not-allowed bg-[#151515]"
            )}
          />
        </div>

        {/* Images label */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full border border-[#7c3aed]" />
          <span className="text-[10px] text-[#737373]">Images</span>
          {connectedHandles.has("images") && (
            <span className="text-[9px] bg-[#7c3aed]/20 text-[#a78bfa] px-1.5 py-0.5 rounded">connected</span>
          )}
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={data.status === "running"}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all nodrag",
            data.status === "running"
              ? "bg-[#2a2a2a] text-[#737373] cursor-not-allowed"
              : "bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
          )}
        >
          {data.status === "running" ? (
            <><Loader2 size={12} className="animate-spin" /> Running...</>
          ) : (
            <><Play size={12} /> Run Node</>
          )}
        </button>

        {/* Output */}
        {data.outputText && (
          <div className="mt-2 p-2.5 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
            <p className="text-[9px] text-[#737373] mb-1.5 font-medium uppercase tracking-wide">Output</p>
            <p className="text-xs text-[#e5e5e5] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {data.outputText}
            </p>
          </div>
        )}

        {data.error && (
          <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-500/30">
            <p className="text-xs text-red-400">{data.error}</p>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="output" style={{ top: "50%", right: -5 }} />
    </BaseNode>
  );
});

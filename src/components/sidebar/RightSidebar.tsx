// src/components/sidebar/RightSidebar.tsx
"use client";
import { useState } from "react";
import { History, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, XCircle, Loader2, Clock, AlertCircle } from "lucide-react";
import { useWorkflowStore } from "@/store/workflow-store";
import { WorkflowRunRecord, NodeRunRecord, RunStatus } from "@/types";
import { cn } from "@/lib/utils";

function formatDuration(ms?: number) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function StatusIcon({ status }: { status: RunStatus }) {
  if (status === "SUCCESS") return <CheckCircle2 size={11} className="text-green-400 shrink-0" />;
  if (status === "FAILED") return <XCircle size={11} className="text-red-400 shrink-0" />;
  if (status === "RUNNING") return <Loader2 size={11} className="text-purple-400 animate-spin shrink-0" />;
  if (status === "PARTIAL") return <AlertCircle size={11} className="text-yellow-400 shrink-0" />;
  return null;
}

function StatusBadge({ status }: { status: RunStatus }) {
  return (
    <span className={cn(
      "text-[9px] px-1.5 py-0.5 rounded font-medium",
      status === "SUCCESS" && "bg-green-500/20 text-green-400",
      status === "FAILED" && "bg-red-500/20 text-red-400",
      status === "RUNNING" && "bg-purple-500/20 text-purple-400",
      status === "PARTIAL" && "bg-yellow-500/20 text-yellow-400",
    )}>
      {status}
    </span>
  );
}

function NodeRunItem({ nodeRun }: { nodeRun: NodeRunRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-3 border-l border-[#2a2a2a] pl-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 py-1 w-full text-left hover:opacity-80 transition-opacity"
      >
        <StatusIcon status={nodeRun.status} />
        <span className="text-[10px] text-[#e5e5e5] flex-1 truncate">
          {nodeRun.nodeLabel ?? nodeRun.nodeType}
        </span>
        <span className="text-[9px] text-[#525252]">{formatDuration(nodeRun.durationMs)}</span>
        <ChevronDown size={10} className={cn("text-[#525252] transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="pb-2 space-y-1.5">
          {nodeRun.outputs && (
            <div>
              <p className="text-[9px] text-[#525252] uppercase tracking-wide mb-0.5">Output</p>
              <p className="text-[9px] text-[#a78bfa] break-all line-clamp-3">
                {typeof nodeRun.outputs === "object"
                  ? JSON.stringify(Object.values(nodeRun.outputs)[0])
                  : String(nodeRun.outputs)}
              </p>
            </div>
          )}
          {nodeRun.error && (
            <div>
              <p className="text-[9px] text-[#525252] uppercase tracking-wide mb-0.5">Error</p>
              <p className="text-[9px] text-red-400 break-all">{nodeRun.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunItem({ run }: { run: WorkflowRunRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#1a1a1a] transition-colors text-left"
      >
        <StatusIcon status={run.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[#e5e5e5] font-medium">
              {run.scope === "FULL" ? "Full Run" : run.scope === "SINGLE" ? "Single Node" : `${run.nodeRuns.length} Nodes`}
            </span>
            <StatusBadge status={run.status} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] text-[#525252]">{formatDate(run.startedAt)}</span>
            {run.durationMs && (
              <span className="text-[9px] text-[#525252]">• {formatDuration(run.durationMs)}</span>
            )}
          </div>
        </div>
        <ChevronDown size={12} className={cn("text-[#525252] shrink-0 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="border-t border-[#2a2a2a] px-2 py-2 bg-[#0a0a0a] space-y-0.5">
          {run.nodeRuns.map((nr) => (
            <NodeRunItem key={nr.id} nodeRun={nr} />
          ))}
          {run.nodeRuns.length === 0 && (
            <p className="text-[9px] text-[#525252] pl-3">No node details</p>
          )}
        </div>
      )}
    </div>
  );
}

export function RightSidebar() {
  const { rightSidebarOpen, toggleRightSidebar, runHistory } = useWorkflowStore();

  return (
    <div
      className={cn(
        "relative flex h-full shrink-0 flex-col border-l border-[#2a2a2a] bg-[#111111] transition-all duration-300",
        rightSidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}
    >
      {/* Toggle */}
      <button
        onClick={toggleRightSidebar}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#2a2a2a] border border-[#333] flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#333] transition-colors"
      >
        {rightSidebarOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <History size={14} className="text-[#7c3aed]" />
            <span className="text-xs font-semibold text-[#e5e5e5]">History</span>
            {runHistory.length > 0 && (
              <span className="ml-auto text-[9px] bg-[#2a2a2a] text-[#737373] px-1.5 py-0.5 rounded-full">
                {runHistory.length}
              </span>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {runHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 pb-16">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                <Clock size={18} className="text-[#525252]" />
              </div>
              <p className="text-xs text-[#525252] text-center">
                No runs yet. Execute a workflow to see history.
              </p>
            </div>
          ) : (
            runHistory.map((run) => <RunItem key={run.id} run={run} />)
          )}
        </div>
      </div>
    </div>
  );
}

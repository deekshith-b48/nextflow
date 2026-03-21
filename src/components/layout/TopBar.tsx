// src/components/layout/TopBar.tsx
"use client";
import { useState, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  Play, Save, Download, Upload, Undo2, Redo2,
  Loader2, Check, ChevronDown, Trash2, Plus,
} from "lucide-react";
import { useWorkflowStore } from "@/store/workflow-store";
import { useTemporalStore } from "@/store/workflow-store";
import { cn } from "@/lib/utils";
import { hasCycle } from "@/lib/dag";

interface TopBarProps {
  workflowId: string;
}

export function TopBar({ workflowId }: TopBarProps) {
  const {
    workflowName, setWorkflowName, nodes, edges,
    isExecuting, setIsExecuting, isSaving, setIsSaving,
    addRunRecord, updateRunRecord, setRunHistory,
  } = useWorkflowStore();

  const { undo, redo, pastStates, futureStates } = useTemporalStore(
    (s) => ({ undo: s.undo, redo: s.redo, pastStates: s.pastStates, futureStates: s.futureStates })
  );

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(workflowName);

  // Save workflow
  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    setIsSaving(true);
    try {
      await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: workflowId, name: workflowName, nodes, edges }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    } finally {
      setIsSaving(false);
    }
  }, [workflowId, workflowName, nodes, edges, setIsSaving]);

  // Run full workflow
  const handleRun = useCallback(async () => {
    if (isExecuting) return;
    if (hasCycle(nodes, edges)) {
      alert("Workflow has a circular dependency. Please remove cycles before running.");
      return;
    }
    setIsExecuting(true);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, nodes, edges }),
      });
      const { runId } = await res.json();

      // Add optimistic run to history
      addRunRecord({
        id: runId,
        workflowId,
        scope: "FULL",
        status: "RUNNING",
        startedAt: new Date().toISOString(),
        nodeRuns: [],
      });

      // Poll for completion
      const poll = setInterval(async () => {
        const statusRes = await fetch(`/api/history/${runId}`);
        const run = await statusRes.json();

        if (run.status !== "RUNNING") {
          clearInterval(poll);
          updateRunRecord(runId, {
            status: run.status,
            completedAt: run.completedAt,
            durationMs: run.durationMs,
            nodeRuns: run.nodeRuns ?? [],
          });
          setIsExecuting(false);

          // Update node statuses and outputs from results
          const { updateNodeData, updateNodeStatus, nodes: currentNodes } = useWorkflowStore.getState();
          for (const nr of run.nodeRuns ?? []) {
            const output = (nr.outputs as any)?.output;
            if (nr.status === "SUCCESS") {
              const node = currentNodes.find((n) => n.id === nr.nodeId);
              if (node?.type === "llmNode" && output) {
                updateNodeData(nr.nodeId, { status: "success", outputText: String(output) });
              } else if ((node?.type === "cropImage" || node?.type === "extractFrame") && output) {
                updateNodeData(nr.nodeId, { status: "success", outputUrl: String(output) });
              } else {
                updateNodeStatus(nr.nodeId, "success");
              }
            } else {
              updateNodeStatus(nr.nodeId, "error", undefined, nr.error ?? "Execution failed");
            }
          }
        }
      }, 2000);
    } catch (err) {
      setIsExecuting(false);
      alert("Execution failed: " + String(err));
    }
  }, [workflowId, nodes, edges, isExecuting, setIsExecuting, addRunRecord, updateRunRecord]);

  // Export JSON
  const handleExport = useCallback(() => {
    const data = JSON.stringify({ name: workflowName, nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [workflowName, nodes, edges]);

  // Import JSON
  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        const { setNodes, setEdges, setWorkflowName } = useWorkflowStore.getState();
        if (data.nodes) setNodes(data.nodes);
        if (data.edges) setEdges(data.edges);
        if (data.name) setWorkflowName(data.name);
      } catch {
        alert("Invalid workflow JSON file");
      }
    };
    input.click();
  }, []);

  return (
    <div className="flex items-center h-12 px-4 border-b border-[#2a2a2a] bg-[#111111] shrink-0 gap-3">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-6 h-6 rounded-md bg-[#7c3aed] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-white hidden sm:block">NextFlow</span>
      </div>

      <div className="h-4 w-px bg-[#2a2a2a]" />

      {/* Workflow name */}
      {editingName ? (
        <input
          autoFocus
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          onBlur={() => { setWorkflowName(nameVal); setEditingName(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { setWorkflowName(nameVal); setEditingName(false); } }}
          className="bg-[#1a1a1a] border border-[#7c3aed] rounded px-2 py-0.5 text-sm text-white focus:outline-none w-48"
        />
      ) : (
        <button
          onClick={() => { setNameVal(workflowName); setEditingName(true); }}
          className="text-sm text-[#e5e5e5] hover:text-white transition-colors truncate max-w-[180px]"
          title="Click to rename"
        >
          {workflowName}
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => undo()}
          disabled={pastStates.length === 0}
          className="w-7 h-7 flex items-center justify-center rounded text-[#737373] hover:text-white hover:bg-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={() => redo()}
          disabled={futureStates.length === 0}
          className="w-7 h-7 flex items-center justify-center rounded text-[#737373] hover:text-white hover:bg-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={14} />
        </button>
      </div>

      <div className="h-4 w-px bg-[#2a2a2a]" />

      {/* Import / Export */}
      <button
        onClick={handleImport}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors"
        title="Import JSON"
      >
        <Upload size={13} />
        <span className="hidden md:block">Import</span>
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors"
        title="Export JSON"
      >
        <Download size={13} />
        <span className="hidden md:block">Export</span>
      </button>

      <div className="h-4 w-px bg-[#2a2a2a]" />

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saveStatus === "saving"}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          saveStatus === "saved"
            ? "bg-green-500/20 text-green-400"
            : "bg-[#1a1a1a] border border-[#2a2a2a] text-[#e5e5e5] hover:bg-[#2a2a2a]"
        )}
      >
        {saveStatus === "saving" ? (
          <Loader2 size={13} className="animate-spin" />
        ) : saveStatus === "saved" ? (
          <Check size={13} />
        ) : (
          <Save size={13} />
        )}
        {saveStatus === "saved" ? "Saved" : "Save"}
      </button>

      {/* Run */}
      <button
        onClick={handleRun}
        disabled={isExecuting || nodes.length === 0}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          isExecuting
            ? "bg-purple-500/20 text-purple-400 cursor-not-allowed"
            : "bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
        )}
      >
        {isExecuting ? (
          <><Loader2 size={13} className="animate-spin" /> Running…</>
        ) : (
          <><Play size={13} fill="currentColor" /> Run All</>
        )}
      </button>

      <div className="h-4 w-px bg-[#2a2a2a]" />

      <UserButton
        appearance={{
          variables: { colorBackground: "#111111", colorText: "#e5e5e5" },
        }}
      />
    </div>
  );
}

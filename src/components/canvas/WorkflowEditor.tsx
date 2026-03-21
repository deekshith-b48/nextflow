// src/components/canvas/WorkflowEditor.tsx
"use client";
import { useEffect } from "react";
import { ReactFlowProvider } from "reactflow";
import { useWorkflowStore } from "@/store/workflow-store";
import { Workflow, WorkflowRunRecord } from "@/types";
import { TopBar } from "@/components/layout/TopBar";
import { LeftSidebar } from "@/components/sidebar/LeftSidebar";
import { RightSidebar } from "@/components/sidebar/RightSidebar";
import { FlowCanvas } from "./FlowCanvas";

interface WorkflowEditorProps {
  workflow: Workflow;
  initialRuns: WorkflowRunRecord[];
}

export function WorkflowEditor({ workflow, initialRuns }: WorkflowEditorProps) {
  const { loadWorkflow, setRunHistory } = useWorkflowStore();

  useEffect(() => {
    loadWorkflow(workflow);
    setRunHistory(initialRuns);
  }, [workflow.id]); // only on mount / workflow change

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0a]">
        <TopBar workflowId={workflow.id} />
        <div className="flex flex-1 min-h-0">
          <LeftSidebar />
          <FlowCanvas />
          <RightSidebar />
        </div>
      </div>
    </ReactFlowProvider>
  );
}

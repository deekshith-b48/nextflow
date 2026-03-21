// src/store/workflow-store.ts
import { create } from "zustand";
import { temporal } from "zundo";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
} from "reactflow";
import { FlowNode, FlowEdge, NodeData, Workflow, WorkflowRunRecord } from "@/types";

interface WorkflowState {
  workflowId: string | null;
  workflowName: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  isSaving: boolean;
  isExecuting: boolean;
  runHistory: WorkflowRunRecord[];
  selectedRun: WorkflowRunRecord | null;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: FlowNode) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  updateNodeStatus: (nodeId: string, status: "idle" | "running" | "success" | "error", result?: unknown, error?: string) => void;
  deleteNode: (nodeId: string) => void;
  loadWorkflow: (workflow: Workflow) => void;
  clearWorkflow: () => void;
  setRunHistory: (history: WorkflowRunRecord[]) => void;
  addRunRecord: (run: WorkflowRunRecord) => void;
  updateRunRecord: (runId: string, updates: Partial<WorkflowRunRecord>) => void;
  setSelectedRun: (run: WorkflowRunRecord | null) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setIsSaving: (v: boolean) => void;
  setIsExecuting: (v: boolean) => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  temporal(
    (set, get) => ({
      workflowId: null,
      workflowName: "Untitled Workflow",
      nodes: [],
      edges: [],
      isSaving: false,
      isExecuting: false,
      runHistory: [],
      selectedRun: null,
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      setWorkflowId: (id) => set({ workflowId: id }),
      setWorkflowName: (name) => set({ workflowName: name }),
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      onNodesChange: (changes) =>
        set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) as FlowNode[] })),
      onEdgesChange: (changes) =>
        set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
      onConnect: (connection) => {
        const { nodes } = get();
        const sourceNode = nodes.find((n) => n.id === connection.source);
        const targetNode = nodes.find((n) => n.id === connection.target);
        if (!sourceNode || !targetNode) return;
        const sourceType = sourceNode.type ?? "";
        const targetHandle = connection.targetHandle ?? "";
        const isImageSource = ["uploadImage", "cropImage", "extractFrame"].includes(sourceType);
        const isVideoSource = sourceType === "uploadVideo";
        const isTextOnlyTarget = ["system_prompt", "user_message"].includes(targetHandle);
        const isImageTarget = ["images", "image_url"].includes(targetHandle);
        const isVideoTarget = targetHandle === "video_url";
        if ((isImageSource || isVideoSource) && isTextOnlyTarget) return;
        if (isVideoSource && isImageTarget) return;
        if (!isImageSource && !isVideoSource && isVideoTarget) return;
        if (sourceType === "textNode" && isImageTarget) return;
        set((state) => ({
          edges: addEdge({ ...connection, type: "smoothstep", animated: true, style: { stroke: "#7c3aed", strokeWidth: 2 } }, state.edges),
        }));
      },
      addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
      updateNodeData: (nodeId, data) =>
        set((state) => ({
          nodes: state.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n) as FlowNode[],
        })),
      updateNodeStatus: (nodeId, status, result, error) =>
        set((state) => ({
          nodes: state.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status, result, error } } : n) as FlowNode[],
        })),
      deleteNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        })),
      loadWorkflow: (workflow) =>
        set({ workflowId: workflow.id, workflowName: workflow.name, nodes: workflow.nodes, edges: workflow.edges }),
      clearWorkflow: () => set({ workflowId: null, workflowName: "Untitled Workflow", nodes: [], edges: [] }),
      setRunHistory: (history) => set({ runHistory: history }),
      addRunRecord: (run) => set((state) => ({ runHistory: [run, ...state.runHistory] })),
      updateRunRecord: (runId, updates) =>
        set((state) => ({ runHistory: state.runHistory.map((r) => r.id === runId ? { ...r, ...updates } : r) })),
      setSelectedRun: (run) => set({ selectedRun: run }),
      toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      setIsSaving: (v) => set({ isSaving: v }),
      setIsExecuting: (v) => set({ isExecuting: v }),
    }),
    { partialize: (state) => ({ nodes: state.nodes, edges: state.edges }), limit: 50 }
  )
);

import { useStore } from "zustand";
export const useTemporalStore = <T,>(selector: (state: any) => T) => useStore((useWorkflowStore as any).temporal, selector);

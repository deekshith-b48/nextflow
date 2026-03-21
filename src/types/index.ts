// src/types/index.ts
import { Node, Edge } from "reactflow";

// ─── Node Data Types ────────────────────────────────────────────────────────

export type NodeStatus = "idle" | "running" | "success" | "error";

export interface BaseNodeData {
  label: string;
  status: NodeStatus;
  result?: unknown;
  error?: string;
}

export interface TextNodeData extends BaseNodeData {
  type: "text";
  text: string;
}

export interface UploadImageNodeData extends BaseNodeData {
  type: "upload_image";
  imageUrl?: string;
  fileName?: string;
}

export interface UploadVideoNodeData extends BaseNodeData {
  type: "upload_video";
  videoUrl?: string;
  fileName?: string;
}

export interface LLMNodeData extends BaseNodeData {
  type: "llm";
  model: string;
  systemPrompt?: string;
  userMessage?: string;
  outputText?: string;
  // Connected values (from handles)
  connectedSystemPrompt?: string;
  connectedUserMessage?: string;
  connectedImages?: string[];
}

export interface CropImageNodeData extends BaseNodeData {
  type: "crop_image";
  imageUrl?: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  outputUrl?: string;
  // Connected values
  connectedImageUrl?: string;
  connectedX?: number;
  connectedY?: number;
  connectedWidth?: number;
  connectedHeight?: number;
}

export interface ExtractFrameNodeData extends BaseNodeData {
  type: "extract_frame";
  videoUrl?: string;
  timestamp: string;
  outputUrl?: string;
  // Connected values
  connectedVideoUrl?: string;
  connectedTimestamp?: string;
}

export type NodeData =
  | TextNodeData
  | UploadImageNodeData
  | UploadVideoNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData;

export type FlowNode = Node<NodeData>;
export type FlowEdge = Edge;

// ─── Workflow Types ──────────────────────────────────────────────────────────

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport?: { x: number; y: number; zoom: number };
  createdAt: string;
  updatedAt: string;
}

// ─── Execution / History Types ───────────────────────────────────────────────

export type RunScope = "FULL" | "PARTIAL" | "SINGLE";
export type RunStatus = "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";

export interface NodeRunRecord {
  id: string;
  nodeId: string;
  nodeType: string;
  nodeLabel?: string;
  status: RunStatus;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface WorkflowRunRecord {
  id: string;
  workflowId: string;
  scope: RunScope;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  nodeRuns: NodeRunRecord[];
}

// ─── Execution Request Types ─────────────────────────────────────────────────

export interface ExecuteWorkflowRequest {
  workflowId: string;
  nodeIds?: string[]; // undefined = full run, array = partial/single
  nodes: FlowNode[];
  edges: FlowEdge[];
}

// ─── Trigger.dev Task Types ───────────────────────────────────────────────────

export interface LLMTaskPayload {
  model: string;
  systemPrompt?: string;
  userMessage: string;
  imageUrls?: string[];
}

export interface CropImageTaskPayload {
  imageUrl: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface ExtractFrameTaskPayload {
  videoUrl: string;
  timestamp: string; // seconds or "50%"
}

// ─── Gemini Models ───────────────────────────────────────────────────────────

export const GEMINI_MODELS = [
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-1.5-flash-8b", label: "Gemini 1.5 Flash 8B" },
  { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (Exp)" },
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number]["value"];

// ─── Handle Types ─────────────────────────────────────────────────────────────

export type HandleDataType = "text" | "image_url" | "video_url" | "number";

export interface HandleMeta {
  id: string;
  type: HandleDataType;
  label: string;
}

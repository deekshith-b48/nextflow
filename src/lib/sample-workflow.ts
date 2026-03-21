// src/lib/sample-workflow.ts
import { FlowNode, FlowEdge } from "@/types";

export const SAMPLE_WORKFLOW_NAME = "Product Marketing Kit Generator";

export const SAMPLE_NODES: FlowNode[] = [
  // Branch A
  {
    id: "upload-image-1",
    type: "uploadImage",
    position: { x: 80, y: 80 },
    data: { label: "Upload Image", status: "idle", type: "upload_image" },
  },
  {
    id: "crop-image-1",
    type: "cropImage",
    position: { x: 380, y: 80 },
    data: {
      label: "Crop Image",
      status: "idle",
      type: "crop_image",
      xPercent: 10,
      yPercent: 10,
      widthPercent: 80,
      heightPercent: 80,
    },
  },
  {
    id: "text-system-1",
    type: "textNode",
    position: { x: 80, y: 340 },
    data: {
      label: "System Prompt",
      status: "idle",
      type: "text",
      text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description.",
    },
  },
  {
    id: "text-user-1",
    type: "textNode",
    position: { x: 380, y: 340 },
    data: {
      label: "Product Details",
      status: "idle",
      type: "text",
      text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.",
    },
  },
  {
    id: "llm-1",
    type: "llmNode",
    position: { x: 700, y: 180 },
    data: {
      label: "LLM — Product Description",
      status: "idle",
      type: "llm",
      model: "gemini-1.5-flash",
    },
  },

  // Branch B
  {
    id: "upload-video-1",
    type: "uploadVideo",
    position: { x: 80, y: 600 },
    data: { label: "Upload Video", status: "idle", type: "upload_video" },
  },
  {
    id: "extract-frame-1",
    type: "extractFrame",
    position: { x: 380, y: 600 },
    data: {
      label: "Extract Frame",
      status: "idle",
      type: "extract_frame",
      timestamp: "50%",
    },
  },

  // Convergence — final LLM
  {
    id: "text-system-2",
    type: "textNode",
    position: { x: 700, y: 560 },
    data: {
      label: "Social Media System Prompt",
      status: "idle",
      type: "text",
      text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.",
    },
  },
  {
    id: "llm-2",
    type: "llmNode",
    position: { x: 1060, y: 360 },
    data: {
      label: "LLM — Final Marketing Post",
      status: "idle",
      type: "llm",
      model: "gemini-1.5-flash",
    },
  },
];

export const SAMPLE_EDGES: FlowEdge[] = [
  // Branch A connections
  {
    id: "e-upload-image-to-crop",
    source: "upload-image-1",
    sourceHandle: "output",
    target: "crop-image-1",
    targetHandle: "image_url",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#7c3aed", strokeWidth: 2 },
  },
  {
    id: "e-crop-to-llm1-images",
    source: "crop-image-1",
    sourceHandle: "output",
    target: "llm-1",
    targetHandle: "images",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#7c3aed", strokeWidth: 2 },
  },
  {
    id: "e-text-system1-to-llm1",
    source: "text-system-1",
    sourceHandle: "output",
    target: "llm-1",
    targetHandle: "system_prompt",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#7c3aed", strokeWidth: 2 },
  },
  {
    id: "e-text-user1-to-llm1",
    source: "text-user-1",
    sourceHandle: "output",
    target: "llm-1",
    targetHandle: "user_message",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#7c3aed", strokeWidth: 2 },
  },

  // Branch B connections
  {
    id: "e-upload-video-to-extract",
    source: "upload-video-1",
    sourceHandle: "output",
    target: "extract-frame-1",
    targetHandle: "video_url",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#7c3aed", strokeWidth: 2 },
  },

  // Convergence connections
  {
    id: "e-llm1-to-llm2-message",
    source: "llm-1",
    sourceHandle: "output",
    target: "llm-2",
    targetHandle: "user_message",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#7c3aed", strokeWidth: 2 },
  },
  {
    id: "e-crop-to-llm2-images",
    source: "crop-image-1",
    sourceHandle: "output",
    target: "llm-2",
    targetHandle: "images",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#7c3aed", strokeWidth: 2 },
  },
  {
    id: "e-extract-to-llm2-images",
    source: "extract-frame-1",
    sourceHandle: "output",
    target: "llm-2",
    targetHandle: "images",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#7c3aed", strokeWidth: 2 },
  },
  {
    id: "e-text-system2-to-llm2",
    source: "text-system-2",
    sourceHandle: "output",
    target: "llm-2",
    targetHandle: "system_prompt",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#7c3aed", strokeWidth: 2 },
  },
];

// src/app/api/execute/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getExecutionLevels, hasCycle, resolveHandleValue, resolveMultipleImageInputs } from "@/lib/dag";
import { tasks, runs } from "@trigger.dev/sdk/v3";
import type { FlowNode, FlowEdge } from "@/types";

const ExecuteSchema = z.object({
  workflowId: z.string(),
  nodeIds: z.array(z.string()).optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ExecuteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { workflowId, nodeIds, nodes, edges } = parsed.data as {
    workflowId: string;
    nodeIds?: string[];
    nodes: FlowNode[];
    edges: FlowEdge[];
  };

  // Check for cycles
  if (hasCycle(nodes, edges)) {
    return NextResponse.json({ error: "Workflow contains a cycle" }, { status: 400 });
  }

  const scope = nodeIds
    ? nodeIds.length === 1
      ? "SINGLE"
      : "PARTIAL"
    : "FULL";

  // Create run record
  const runRecord = await prisma.workflowRun.create({
    data: {
      workflowId,
      userId,
      scope,
      status: "RUNNING",
    },
  });

  // Start execution in background (don't await)
  executeWorkflow({
    runId: runRecord.id,
    nodes,
    edges,
    nodeIds,
  }).catch(console.error);

  return NextResponse.json({ runId: runRecord.id });
}

async function executeWorkflow({
  runId,
  nodes,
  edges,
  nodeIds,
}: {
  runId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  nodeIds?: string[];
}) {
  const levels = getExecutionLevels(nodes, edges, nodeIds);
  const nodeOutputs = new Map<string, Record<string, unknown>>();
  const nodeRunIds = new Map<string, string>();
  const workflowStartTime = Date.now();

  let overallStatus: "SUCCESS" | "FAILED" | "PARTIAL" = "SUCCESS";
  let anySuccess = false;

  for (const level of levels) {
    // Execute all nodes in this level in parallel
    await Promise.all(
      level.map(async (node) => {
        const nodeRun = await prisma.nodeRun.create({
          data: {
            workflowRunId: runId,
            nodeId: node.id,
            nodeType: node.type ?? "unknown",
            nodeLabel: node.data?.label,
            status: "RUNNING",
          },
        });
        nodeRunIds.set(node.id, nodeRun.id);

        const startTime = Date.now();

        try {
          const result = await executeNode(node, edges, nodeOutputs);
          nodeOutputs.set(node.id, result);
          anySuccess = true;

          await prisma.nodeRun.update({
            where: { id: nodeRun.id },
            data: {
              status: "SUCCESS",
              outputs: result as any,
              completedAt: new Date(),
              durationMs: Date.now() - startTime,
            },
          });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);

          await prisma.nodeRun.update({
            where: { id: nodeRun.id },
            data: {
              status: "FAILED",
              error: errorMsg,
              completedAt: new Date(),
              durationMs: Date.now() - startTime,
            },
          });

          // Determine overall status: PARTIAL if some succeeded, FAILED if none did
          overallStatus = anySuccess ? "PARTIAL" : "FAILED";
        }
      })
    );
  }

  await prisma.workflowRun.update({
    where: { id: runId },
    data: {
      status: overallStatus,
      completedAt: new Date(),
      durationMs: Date.now() - workflowStartTime,
    },
  });
}

async function executeNode(
  node: FlowNode,
  edges: FlowEdge[],
  nodeOutputs: Map<string, Record<string, unknown>>
): Promise<Record<string, unknown>> {
  const nodeType = node.type;

  // Text Node - just pass through its text
  if (nodeType === "textNode") {
    const text = (node.data as any).text ?? "";
    return { output: text };
  }

  // Upload Image / Video - already has URL, just pass through
  if (nodeType === "uploadImage") {
    const url = (node.data as any).imageUrl ?? "";
    return { output: url };
  }
  if (nodeType === "uploadVideo") {
    const url = (node.data as any).videoUrl ?? "";
    return { output: url };
  }

  // LLM Node
  if (nodeType === "llmNode") {
    const data = node.data as any;
    const systemPrompt =
      (resolveHandleValue(node.id, "system_prompt", edges, nodeOutputs) as string) ??
      data.systemPrompt ?? "";
    const userMessage =
      (resolveHandleValue(node.id, "user_message", edges, nodeOutputs) as string) ??
      data.userMessage ?? "";
    const imageUrls = resolveMultipleImageInputs(node.id, edges, nodeOutputs);

    if (!userMessage) throw new Error("user_message is required");

    const handle = await tasks.trigger("run-llm", {
      model: data.model ?? "gemini-1.5-flash",
      systemPrompt: systemPrompt || undefined,
      userMessage,
      imageUrls,
    });

    // Poll for completion
    const result = await waitForTask(handle.id);
    return { output: result.output };
  }

  // Crop Image
  if (nodeType === "cropImage") {
    const data = node.data as any;
    const imageUrl =
      (resolveHandleValue(node.id, "image_url", edges, nodeOutputs) as string) ??
      data.imageUrl ?? "";
    const x = Number(resolveHandleValue(node.id, "x_percent", edges, nodeOutputs) ?? data.xPercent ?? 0);
    const y = Number(resolveHandleValue(node.id, "y_percent", edges, nodeOutputs) ?? data.yPercent ?? 0);
    const w = Number(resolveHandleValue(node.id, "width_percent", edges, nodeOutputs) ?? data.widthPercent ?? 100);
    const h = Number(resolveHandleValue(node.id, "height_percent", edges, nodeOutputs) ?? data.heightPercent ?? 100);

    if (!imageUrl) throw new Error("image_url is required");

    const handle = await tasks.trigger("crop-image", {
      imageUrl, xPercent: x, yPercent: y, widthPercent: w, heightPercent: h,
    });
    const result = await waitForTask(handle.id);
    return { output: result.output };
  }

  // Extract Frame
  if (nodeType === "extractFrame") {
    const data = node.data as any;
    const videoUrl =
      (resolveHandleValue(node.id, "video_url", edges, nodeOutputs) as string) ??
      data.videoUrl ?? "";
    const timestamp =
      String(resolveHandleValue(node.id, "timestamp", edges, nodeOutputs) ?? data.timestamp ?? "0");

    if (!videoUrl) throw new Error("video_url is required");

    const handle = await tasks.trigger("extract-frame", { videoUrl, timestamp });
    const result = await waitForTask(handle.id);
    return { output: result.output };
  }

  throw new Error(`Unknown node type: ${nodeType}`);
}

const TERMINAL_FAILED_STATUSES = new Set([
  "FAILED", "CANCELED", "CRASHED", "INTERRUPTED",
  "SYSTEM_FAILURE", "EXPIRED", "TIMED_OUT",
]);

async function waitForTask(runId: string, timeoutMs = 120000): Promise<any> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const run = await runs.retrieve(runId);
    if (run.status === "COMPLETED") return run.output;
    if (TERMINAL_FAILED_STATUSES.has(run.status)) {
      throw new Error(`Task ${run.status.toLowerCase().replace(/_/g, " ")}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Task timed out after 2 minutes");
}

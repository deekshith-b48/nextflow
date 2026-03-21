// src/app/workflow/[id]/page.tsx
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkflowEditor } from "@/components/canvas/WorkflowEditor";

interface Props {
  params: { id: string };
}

export default async function WorkflowPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workflow = await prisma.workflow.findUnique({
    where: { id: params.id },
  });

  if (!workflow || workflow.userId !== userId) notFound();

  // Fetch run history
  const runs = await prisma.workflowRun.findMany({
    where: { workflowId: workflow.id },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { nodeRuns: { orderBy: { startedAt: "asc" } } },
  });

  return (
    <WorkflowEditor
      workflow={{
        id: workflow.id,
        userId: workflow.userId,
        name: workflow.name,
        description: workflow.description ?? undefined,
        nodes: workflow.nodes as any,
        edges: workflow.edges as any,
        viewport: workflow.viewport as any,
        createdAt: workflow.createdAt.toISOString(),
        updatedAt: workflow.updatedAt.toISOString(),
      }}
      initialRuns={runs.map((r) => ({
        id: r.id,
        workflowId: r.workflowId,
        scope: r.scope as any,
        status: r.status as any,
        startedAt: r.startedAt.toISOString(),
        completedAt: r.completedAt?.toISOString(),
        durationMs: r.durationMs ?? undefined,
        nodeRuns: r.nodeRuns.map((nr) => ({
          id: nr.id,
          nodeId: nr.nodeId,
          nodeType: nr.nodeType,
          nodeLabel: nr.nodeLabel ?? undefined,
          status: nr.status as any,
          inputs: nr.inputs as any,
          outputs: nr.outputs as any,
          error: nr.error ?? undefined,
          startedAt: nr.startedAt.toISOString(),
          completedAt: nr.completedAt?.toISOString(),
          durationMs: nr.durationMs ?? undefined,
        })),
      }))}
    />
  );
}

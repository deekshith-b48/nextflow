// src/app/api/workflows/sample/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SAMPLE_NODES, SAMPLE_EDGES, SAMPLE_WORKFLOW_NAME } from "@/lib/sample-workflow";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name: SAMPLE_WORKFLOW_NAME,
      nodes: SAMPLE_NODES as any,
      edges: SAMPLE_EDGES as any,
    },
  });

  return NextResponse.json({ id: workflow.id });
}

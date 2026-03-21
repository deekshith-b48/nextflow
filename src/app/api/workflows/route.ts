// src/app/api/workflows/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SaveWorkflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = SaveWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, name, nodes, edges, viewport } = parsed.data;

  if (id) {
    // Update existing
    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = await prisma.workflow.update({
      where: { id },
      data: { name, nodes: nodes as any, edges: edges as any, viewport: viewport as any ?? null },
    });
    return NextResponse.json(updated);
  } else {
    // Create new
    const created = await prisma.workflow.create({
      data: { userId, name, nodes: nodes as any, edges: edges as any, viewport: viewport as any ?? null },
    });
    return NextResponse.json(created);
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json(workflows);
}

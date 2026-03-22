// src/app/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Find or create a default workflow (withRetry handles Neon cold-start delays)
  let workflow = await withRetry(() =>
    prisma.workflow.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    })
  );

  if (!workflow) {
    workflow = await withRetry(() =>
      prisma.workflow.create({
        data: {
          userId,
          name: "My First Workflow",
          nodes: [],
          edges: [],
        },
      })
    );
  }

  redirect(`/workflow/${workflow.id}`);
}

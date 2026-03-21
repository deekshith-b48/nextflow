// src/trigger/tasks.ts
import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { LLMTaskPayload, CropImageTaskPayload, ExtractFrameTaskPayload } from "@/types";

// ─── LLM Task ────────────────────────────────────────────────────────────────

export const runLLMTask = task({
  id: "run-llm",
  maxDuration: 120,
  run: async (payload: LLMTaskPayload) => {
    const { model, systemPrompt, userMessage, imageUrls = [] } = payload;

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
    const geminiModel = genAI.getGenerativeModel({
      model,
      systemInstruction: systemPrompt,
    });

    const parts: Part[] = [];

    // Add images if provided
    for (const imageUrl of imageUrls) {
      try {
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = (response.headers.get("content-type") ?? "image/jpeg") as
          | "image/jpeg"
          | "image/png"
          | "image/webp"
          | "image/gif";

        parts.push({
          inlineData: {
            data: base64,
            mimeType,
          },
        });
      } catch (err) {
        console.error(`Failed to fetch image ${imageUrl}:`, err);
      }
    }

    // Add text message
    parts.push({ text: userMessage });

    const result = await geminiModel.generateContent(parts);
    const responseText = result.response.text();

    return { output: responseText };
  },
});

// ─── Crop Image Task ──────────────────────────────────────────────────────────

export const cropImageTask = task({
  id: "crop-image",
  maxDuration: 60,
  run: async (payload: CropImageTaskPayload) => {
    const { imageUrl, xPercent, yPercent, widthPercent, heightPercent } = payload;

    const transloaditKey = process.env.TRANSLOADIT_KEY!;
    const transloaditSecret = process.env.TRANSLOADIT_SECRET!;

    if (!transloaditKey || !transloaditSecret) {
      throw new Error("TRANSLOADIT_KEY or TRANSLOADIT_SECRET is not set");
    }

    const steps = {
      import: {
        robot: "/http/import",
        url: imageUrl,
      },
      crop: {
        robot: "/image/resize",
        use: "import",
        width: `${widthPercent}p`,
        height: `${heightPercent}p`,
        gravity: "NorthWest",
        resize_strategy: "crop",
        offset_x: `${xPercent}p`,
        offset_y: `${yPercent}p`,
        imagemagick_stack: "v2.0.7",
      },
    };

    const crypto = await import("crypto");
    const params = JSON.stringify({
      auth: {
        key: transloaditKey,
        expires: new Date(Date.now() + 3600000)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19),
      },
      steps,
    });

    const sig = crypto
      .createHmac("sha384", transloaditSecret)
      .update(Buffer.from(params, "utf-8"))
      .digest("hex");

    const assemblyResp = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      body: new URLSearchParams({
        params,
        signature: `sha384:${sig}`,
      }),
    });

    const assembly = await assemblyResp.json();

    // Poll for completion
    let result = assembly;
    while (result.ok !== "ASSEMBLY_COMPLETED" && result.ok !== "ASSEMBLY_ERROR") {
      await new Promise((r) => setTimeout(r, 1000));
      const pollResp = await fetch(
        `https://api2.transloadit.com/assemblies/${result.assembly_id}`
      );
      result = await pollResp.json();
    }

    if (result.ok === "ASSEMBLY_ERROR") {
      throw new Error(`Transloadit assembly failed: ${result.error}`);
    }

    const outputFile = result.results?.crop?.[0];
    if (!outputFile?.ssl_url) {
      throw new Error(`No output file from Transloadit assembly. Result: ${JSON.stringify(result.results)}`);
    }

    return { output: outputFile.ssl_url };
  },
});

// ─── Extract Frame Task ───────────────────────────────────────────────────────

export const extractFrameTask = task({
  id: "extract-frame",
  maxDuration: 120,
  run: async (payload: ExtractFrameTaskPayload) => {
    const { videoUrl, timestamp } = payload;

    const transloaditKey = process.env.TRANSLOADIT_KEY!;
    const transloaditSecret = process.env.TRANSLOADIT_SECRET!;

    // Resolve timestamp - handle "50%" format
    let resolvedTimestamp = timestamp;
    if (typeof timestamp === "string" && timestamp.endsWith("%")) {
      // We'll pass percentage directly to ffmpeg offset
      // Transloadit's /video/thumbs supports offset_percent
      resolvedTimestamp = timestamp;
    }

    const isPercent =
      typeof resolvedTimestamp === "string" &&
      resolvedTimestamp.endsWith("%");
    const percentValue = isPercent
      ? parseFloat(resolvedTimestamp as string)
      : null;

    const steps = {
      import: {
        robot: "/http/import",
        url: videoUrl,
      },
      thumb: {
        robot: "/video/thumbs",
        use: "import",
        count: 1,
        ...(isPercent
          ? { offset_percent: percentValue }
          : { offset_seconds: parseFloat(resolvedTimestamp as string) || 0 }),
        format: "jpg",
        width: 1280,
        height: 720,
        resize_strategy: "fit",
      },
    };

    const params = JSON.stringify({
      auth: {
        key: transloaditKey,
        expires: new Date(Date.now() + 3600000)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19),
      },
      steps,
    });

    const crypto = await import("crypto");
    const sig = crypto
      .createHmac("sha384", transloaditSecret)
      .update(Buffer.from(params, "utf-8"))
      .digest("hex");

    const assemblyResp = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      body: new URLSearchParams({
        params,
        signature: `sha384:${sig}`,
      }),
    });

    const assembly = await assemblyResp.json();

    // Poll for completion
    let result = assembly;
    let attempts = 0;
    while (
      result.ok !== "ASSEMBLY_COMPLETED" &&
      result.ok !== "ASSEMBLY_ERROR" &&
      attempts < 60
    ) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollResp = await fetch(
        `https://api2.transloadit.com/assemblies/${result.assembly_id}`
      );
      result = await pollResp.json();
      attempts++;
    }

    if (result.ok === "ASSEMBLY_ERROR") {
      throw new Error(`Transloadit assembly failed: ${result.error}`);
    }

    const outputFile = result.results?.thumb?.[0];
    if (!outputFile?.ssl_url) {
      throw new Error("No output frame from Transloadit assembly");
    }

    return { output: outputFile.ssl_url };
  },
});

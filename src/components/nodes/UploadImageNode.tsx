// src/components/nodes/UploadImageNode.tsx
"use client";
import { memo, useCallback, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ImageIcon, Upload, X } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { UploadImageNodeData } from "@/types";
import { useWorkflowStore } from "@/store/workflow-store";

export const UploadImageNode = memo(function UploadImageNode({
  id, data,
}: NodeProps<UploadImageNodeData>) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      // Show preview immediately
      const objectUrl = URL.createObjectURL(file);
      updateNodeData(id, { imageUrl: objectUrl, fileName: file.name, status: "running" });

      try {
        // Upload via Transloadit
        const formData = new FormData();
        formData.append("file", file);

        const params = JSON.stringify({
          auth: { key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY },
          steps: {
            store: {
              robot: "/transloadit/store",
              use: ":original",
            },
          },
        });
        formData.append("params", params);

        const res = await fetch("https://api2.transloadit.com/assemblies", {
          method: "POST",
          body: formData,
        });
        const assembly = await res.json();

        // Poll
        let result = assembly;
        while (result.ok !== "ASSEMBLY_COMPLETED" && result.ok !== "ASSEMBLY_ERROR") {
          await new Promise((r) => setTimeout(r, 1500));
          const p = await fetch(`https://api2.transloadit.com/assemblies/${result.assembly_id}`);
          result = await p.json();
        }

        if (result.ok === "ASSEMBLY_ERROR") {
          updateNodeData(id, { status: "error", error: `Upload failed: ${result.error ?? "Transloadit error"}` });
          return;
        }

        const uploaded = result.results?.store?.[0];
        if (uploaded?.ssl_url) {
          updateNodeData(id, { imageUrl: uploaded.ssl_url, status: "success" });
        } else {
          // Assembly completed but no stored URL — keep preview for display,
          // but warn that downstream processing tasks won't be able to access it
          updateNodeData(id, { status: "error", error: "Upload succeeded locally but no public URL was returned. Crop/LLM tasks require a public image URL." });
        }
      } catch (err) {
        updateNodeData(id, { status: "error", error: `Upload error: ${err instanceof Error ? err.message : String(err)}` });
      }
    },
    [id, updateNodeData]
  );

  return (
    <BaseNode id={id} title="Upload Image" icon={<ImageIcon size={13} />} status={data.status} minWidth={260}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpg,image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />

      {data.imageUrl ? (
        <div className="relative group">
          <img
            src={data.imageUrl}
            alt="Uploaded"
            className="w-full h-36 object-cover rounded-lg border border-[#2a2a2a]"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-[#7c3aed] text-white text-xs rounded-lg hover:bg-[#6d28d9] transition-colors nodrag"
            >
              Replace
            </button>
            <button
              onClick={() => updateNodeData(id, { imageUrl: undefined, fileName: undefined })}
              className="p-1.5 bg-[#2a2a2a] text-white text-xs rounded-lg hover:bg-[#333] transition-colors nodrag"
            >
              <X size={12} />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-[#737373] truncate">{data.fileName}</p>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-24 border-2 border-dashed border-[#2a2a2a] rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#7c3aed] hover:bg-[#7c3aed]/5 transition-all nodrag"
        >
          <Upload size={20} className="text-[#525252]" />
          <span className="text-xs text-[#525252]">Upload image</span>
          <span className="text-[10px] text-[#737373]">JPG, PNG, WEBP, GIF</span>
        </button>
      )}

      <Handle type="source" position={Position.Right} id="output" style={{ top: "50%", right: -5 }} />
    </BaseNode>
  );
});

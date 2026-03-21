// src/components/nodes/UploadVideoNode.tsx
"use client";
import { memo, useCallback, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Video, Upload, X } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { UploadVideoNodeData } from "@/types";
import { useWorkflowStore } from "@/store/workflow-store";

export const UploadVideoNode = memo(function UploadVideoNode({
  id, data,
}: NodeProps<UploadVideoNodeData>) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      updateNodeData(id, { videoUrl: objectUrl, fileName: file.name, status: "running" });

      try {
        const formData = new FormData();
        formData.append("file", file);
        const params = JSON.stringify({
          auth: { key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY },
          steps: {
            store: { robot: "/transloadit/store", use: ":original" },
          },
        });
        formData.append("params", params);

        const res = await fetch("https://api2.transloadit.com/assemblies", {
          method: "POST",
          body: formData,
        });
        const assembly = await res.json();

        let result = assembly;
        while (result.ok !== "ASSEMBLY_COMPLETED" && result.ok !== "ASSEMBLY_ERROR") {
          await new Promise((r) => setTimeout(r, 2000));
          const p = await fetch(`https://api2.transloadit.com/assemblies/${result.assembly_id}`);
          result = await p.json();
        }

        if (result.ok === "ASSEMBLY_ERROR") {
          updateNodeData(id, { status: "error", error: `Upload failed: ${result.error ?? "Transloadit error"}` });
          return;
        }

        const uploaded = result.results?.store?.[0];
        if (uploaded?.ssl_url) {
          updateNodeData(id, { videoUrl: uploaded.ssl_url, status: "success" });
        } else {
          updateNodeData(id, { status: "error", error: "Upload succeeded locally but no public URL was returned. Extract Frame tasks require a public video URL." });
        }
      } catch (err) {
        updateNodeData(id, { status: "error", error: `Upload error: ${err instanceof Error ? err.message : String(err)}` });
      }
    },
    [id, updateNodeData]
  );

  return (
    <BaseNode id={id} title="Upload Video" icon={<Video size={13} />} status={data.status} minWidth={280}>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />

      {data.videoUrl ? (
        <div className="relative group">
          <video
            src={data.videoUrl}
            controls
            className="w-full h-36 rounded-lg border border-[#2a2a2a] bg-black object-contain nodrag"
          />
          <div className="absolute top-1 right-1 flex gap-1">
            <button
              onClick={() => inputRef.current?.click()}
              className="px-2 py-1 bg-[#7c3aed]/90 text-white text-[10px] rounded hover:bg-[#6d28d9] transition-colors nodrag"
            >
              Replace
            </button>
            <button
              onClick={() => updateNodeData(id, { videoUrl: undefined, fileName: undefined })}
              className="p-1 bg-[#2a2a2a]/90 text-white rounded hover:bg-[#333] transition-colors nodrag"
            >
              <X size={10} />
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
          <span className="text-xs text-[#525252]">Upload video</span>
          <span className="text-[10px] text-[#737373]">MP4, MOV, WEBM, M4V</span>
        </button>
      )}

      <Handle type="source" position={Position.Right} id="output" style={{ top: "50%", right: -5 }} />
    </BaseNode>
  );
});

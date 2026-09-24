"use client";

import { useRef, useState } from "react";
import { ImagePlus, Paperclip, X } from "lucide-react";
import { toast } from "react-toastify";
import { formatSize } from "@/lib/format.js";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
const BLOCKED = [".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".pif"];

export default function UploadZone({ screenshots, files, onChange, maxTotal = 10 * 1024 * 1024, maxShots = 5, maxFiles = 5, compact = false }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const total = [...screenshots, ...files].reduce((s, f) => s + f.size, 0);

  const add = (incoming) => {
    let running = total;
    const ss = [];
    const ff = [];
    for (const file of Array.from(incoming || [])) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (BLOCKED.includes(ext)) {
        toast.error(`${file.name}: blocked file type`);
        continue;
      }
      if (running + file.size > maxTotal) {
        toast.error(`${file.name}: exceeds ${(maxTotal / 1024 / 1024).toFixed(0)}MB total`);
        break;
      }
      const isImg = IMAGE_TYPES.includes(file.type);
      if (isImg && screenshots.length + ss.length < maxShots) ss.push(file);
      else if (!isImg && files.length + ff.length < maxFiles) ff.push(file);
      else {
        toast.error(`${file.name}: limit reached`);
        continue;
      }
      running += file.size;
    }
    if (ss.length || ff.length) {
      onChange({ screenshots: [...screenshots, ...ss], files: [...files, ...ff] });
      toast.success(`${ss.length + ff.length} file(s) added`);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDrag(false); }}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-md p-4 text-center transition-all"
        style={{
          backgroundColor: drag ? "var(--secondary-hover)" : "var(--input-bg)",
          border: drag ? "2px dashed var(--primary-color)" : "2px dashed var(--border-color)",
        }}
      >
        <div className="mb-1 flex items-center justify-center gap-2">
          <ImagePlus className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
          <Paperclip className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
        </div>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {drag ? "Drop files here…" : "Drag & drop or click to add screenshots & files"}
        </p>
        {!compact && (
          <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
            Images, ZIP, PDF, TXT · {formatSize(maxTotal)} total · {formatSize(total)} used
          </p>
        )}
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>

      {screenshots.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {screenshots.map((f, i) => (
            <div key={i} className="group relative overflow-hidden rounded-md" style={{ width: 88, height: 88, border: "1px solid var(--border-color)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); onChange({ screenshots: screenshots.filter((_, j) => j !== i), files }); }}
                className="absolute right-1 top-1 rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "#fff" }}
                aria-label="Remove screenshot"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 truncate px-1 py-0.5 text-xs" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>
                {formatSize(f.size)}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-md px-3 py-2 text-sm" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)" }}>
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                <span className="truncate" style={{ color: "var(--foreground)" }}>{f.name}</span>
                <span className="shrink-0 text-xs" style={{ color: "var(--muted-foreground)" }}>{formatSize(f.size)}</span>
              </div>
              <button onClick={() => onChange({ screenshots, files: files.filter((_, j) => j !== i) })} style={{ color: "var(--muted-foreground)" }} aria-label="Remove file">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

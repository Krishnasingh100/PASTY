"use client";

import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { downloadUrl } from "@/lib/api.js";
import { formatSize } from "@/lib/format.js";
import CodeBlock from "./CodeBlock.jsx";

const TEXT_EXT = [".txt", ".md", ".markdown", ".json", ".js", ".jsx", ".ts", ".tsx", ".css", ".html", ".xml", ".yml", ".yaml", ".py", ".java", ".c", ".cpp", ".h", ".sh", ".sql", ".log", ".csv", ".env", ".toml", ".ini", ".rs", ".go", ".rb", ".php"];
const MAX_PREVIEW = 100 * 1024;
const PREVIEW_CHARS = 3000;

function looksText(name, mime, size) {
  if (size > MAX_PREVIEW) return false;
  const mt = (mime || "").toLowerCase();
  if (mt.startsWith("text/")) return true;
  if (mt === "application/json" || mt.endsWith("+json") || mt.endsWith("+xml")) return true;
  const dot = name.toLowerCase().lastIndexOf(".");
  if (dot < 0) return false;
  return TEXT_EXT.includes(name.toLowerCase().slice(dot));
}

// Document bubble: text-like files render inline as code, rest download rows.
export default function FileBubble({ url, name, size, mime, variant = "solid" }) {
  const [text, setText] = useState(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    if (!looksText(name, mime, size)) return;
    let live = true;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.arrayBuffer();
      })
      .then((buf) => {
        if (live) setText(new TextDecoder("utf-8").decode(buf));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [url, name, mime, size]);

  const save = () => downloadUrl(url, name).catch(() => toast.error("Download failed"));

  const rowStyle =
    variant === "soft"
      ? { backgroundColor: "rgba(0,0,0,0.22)" }
      : { backgroundColor: "var(--secondary-hover)" };

  return (
    <div>
      <button
        type="button"
        onClick={save}
        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left"
        style={{ ...rowStyle, cursor: "pointer" }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
          <FileText className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block text-xs" style={{ opacity: 0.75 }}>{formatSize(size)} · tap to save</span>
        </span>
        <Download className="h-4 w-4 shrink-0" style={{ opacity: 0.75 }} />
      </button>
      {text !== null && (
        <div className="mt-1.5">
          <CodeBlock code={more ? text : text.slice(0, PREVIEW_CHARS)} langLabel={name} />
          {text.length > PREVIEW_CHARS && (
            <button
              type="button"
              onClick={() => setMore((m) => !m)}
              className="mt-1 text-xs underline"
              style={{ color: "var(--accent-color)", cursor: "pointer" }}
            >
              {more ? "Show less" : `Show full file (${formatSize(size)})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

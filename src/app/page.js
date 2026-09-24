"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clipboard, Link2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import { formatSize, formatTTL } from "@/lib/format.js";
import TtlPicker from "@/components/TtlPicker.jsx";
import UploadZone from "@/components/UploadZone.jsx";

export default function CreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [ttlHours, setTtlHours] = useState(24);
  const [screenshots, setScreenshots] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const total = [...screenshots, ...files].reduce((s, f) => s + f.size, 0);

  const pasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text);
        toast.success("Pasted!");
      }
    } catch {
      toast.error("Clipboard blocked — paste with Ctrl+V");
    }
  };

  const create = async () => {
    if (!code.trim() && screenshots.length === 0 && files.length === 0) {
      return toast.error("Add code, screenshots, or files first");
    }
    setBusy(true);
    try {
      const res = await api.createGist({ code: code.trim(), title: title || "Untitled", ttlHours }, screenshots, files);
      const link = `${window.location.origin}/code/${res.data.id}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.info("Link copied!");
      } catch {}
      toast.success(`Created! ID ${res.data.id} · expires in ${formatTTL(res.data.ttlHours)}`);
      router.push(`/code/${res.data.id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rise space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>New paste</h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Write code, attach files, get a short link.</p>
        </div>
        <TtlPicker value={ttlHours} onChange={setTtlHours} />
      </div>

      <section className="space-y-3 rounded-lg p-4 sm:p-5" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          maxLength={100}
          className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
          style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--foreground)" }}
        />
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              const t = e.target;
              const next = t.value.slice(0, t.selectionStart) + "    " + t.value.slice(t.selectionEnd);
              setCode(next);
              requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = t.selectionStart; });
            }
          }}
          placeholder="Paste code here… (Tab inserts spaces)"
          maxLength={100000}
          rows={14}
          className="w-full resize-y rounded-md p-3 font-mono text-sm focus:outline-none"
          style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--foreground)", lineHeight: 1.5 }}
        />
        <UploadZone
          screenshots={screenshots}
          files={files}
          onChange={({ screenshots: ss, files: ff }) => { setScreenshots(ss); setFiles(ff); }}
          maxTotal={10 * 1024 * 1024}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {code.length.toLocaleString()} chars{total > 0 && ` · ${formatSize(total)} / 10MB`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={pasteClipboard}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm transition-colors"
              style={{ backgroundColor: "var(--secondary-color)", color: "var(--foreground)", border: "1px solid var(--border-color)", cursor: "pointer" }}
            >
              <Clipboard className="h-4 w-4" /> Paste
            </button>
            <button
              onClick={create}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{ backgroundColor: busy ? "var(--muted-foreground)" : "var(--primary-color)", color: "#fff", border: "none", cursor: busy ? "not-allowed" : "pointer" }}
            >
              <Link2 className="h-4 w-4" /> {busy ? "Creating…" : "Create link"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

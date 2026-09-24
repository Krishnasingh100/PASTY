"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import { addIncoming } from "@/lib/attach.js";
import { copyText, deriveTitle, formatSize, formatTTL } from "@/lib/format.js";
import { tryFormat } from "@/lib/formatCode.js";
import Composer from "@/components/Composer.jsx";
import PendingPreview from "@/components/PendingPreview.jsx";

let seq = 0;
const nextKey = () => `st-${Date.now()}-${seq++}`;
const TTL_HOURS = 24;

export default function CreatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [files, setFiles] = useState([]);
  const [staged, setStaged] = useState([]);
  const [results, setResults] = useState([]);
  const [busyKey, setBusyKey] = useState(false);
  const [formError, setFormError] = useState("");
  const [dragging, setDragging] = useState(false);
  const dragCount = useRef(0);
  const threadRef = useRef(null);

  const draftTotal = [...screenshots, ...files].reduce((s, f) => s + f.size, 0);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [staged, results]);

  const onFiles = (incoming) => {
    const next = addIncoming(screenshots, files, incoming, { maxTotal: 10 * 1024 * 1024 });
    setScreenshots(next.screenshots);
    setFiles(next.files);
  };

  const stage = () => {
    setFormError("");
    if (!code.trim() && screenshots.length === 0 && files.length === 0) {
      const msg = "Type something or attach a file first";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    setStaged((prev) => [...prev, { key: nextKey(), code, screenshots, files }]);
    setCode("");
    setScreenshots([]);
    setFiles([]);
  };

  const generateOne = async (key) => {
    const item = staged.find((s) => s.key === key);
    if (!item) return;
    setFormError("");
    setBusyKey(true);
    try {
      const formatted = await tryFormat(item.code);
      const res = await api.createGist(
        { code: formatted.trim(), title: deriveTitle(formatted, item.screenshots, item.files), ttlHours: TTL_HOURS },
        item.screenshots,
        item.files
      );
      if (!res?.data?.id) throw new Error("Server returned no ID — try again");
      const link = `${window.location.origin}/code/${res.data.id}`;
      setResults((prev) => [...prev, { id: res.data.id, link, ttlHours: res.data.ttlHours, title: res.data.title }]);
      setStaged((prev) => prev.filter((s) => s.key !== key));
      try {
        await navigator.clipboard.writeText(link);
      } catch {}
    } catch (e) {
      console.error("Create paste failed:", e);
      const msg = e?.message || "Could not create link";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setBusyKey(false);
    }
  };

  const generateAll = async () => {
    for (const item of [...staged]) {
      await generateOne(item.key);
    }
  };

  const fresh = () => {
    setCode("");
    setScreenshots([]);
    setFiles([]);
    setStaged([]);
    setResults([]);
    setFormError("");
  };

  return (
    <div
      className="rise -m-4 sm:-m-6"
      onDragEnter={(e) => { e.preventDefault(); dragCount.current++; setDragging(true); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => { e.preventDefault(); dragCount.current--; if (dragCount.current <= 0) { dragCount.current = 0; setDragging(false); } }}
      onDrop={(e) => { e.preventDefault(); dragCount.current = 0; setDragging(false); onFiles(e.dataTransfer.files); }}
    >
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <div className="rounded-2xl px-8 py-6 text-lg font-bold" style={{ border: "3px dashed var(--primary-color)", color: "var(--foreground)", backgroundColor: "var(--card-bg)" }}>
            Drop to stage
          </div>
        </div>
      )}
      <div className="space-y-3 p-4 sm:p-6">
        <div ref={threadRef} className="chat-scroll" style={{ maxHeight: "calc(100dvh - 330px)" }}>
          <div className="chat">
            <div className="date-chip">New paste</div>

            {formError && (
              <div className="bubble bubble-in" style={{ borderColor: "var(--danger-color)" }}>
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--danger-color)" }} />
                  <span>{formError}</span>
                </div>
              </div>
            )}

            {staged.length === 0 && results.length === 0 && (
              <div className="bubble bubble-in">
                <div className="bubble-name">Pasty</div>
                <div className="text-sm">Stage as many as you like below — each becomes its own link. Old ones stay until you generate or remove them.</div>
                <div className="bubble-meta"><span>now</span></div>
              </div>
            )}

            {staged.map((item) => {
              const size = [...item.screenshots, ...item.files].reduce((s, f) => s + f.size, 0);
              return (
                <div key={item.key}>
                  <PendingPreview code={item.code} screenshots={item.screenshots} files={item.files} />
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="chip">{item.screenshots.length + item.files.length > 0 ? `${formatSize(size)} attached` : "text only"}</span>
                    <button
                      type="button"
                      onClick={() => setStaged((prev) => prev.filter((s) => s.key !== item.key))}
                      disabled={busyKey}
                      className="btn btn-ghost ms-auto"
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem" }}
                      aria-label="Remove staged item"
                    >
                      <X className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {results.map((r) => (
              <div key={r.id} className="bubble bubble-out rise">
                <div className="bubble-name" style={{ color: "inherit", opacity: 0.85 }}>{r.title || "Untitled"}</div>
                <div className="text-sm">ID <button type="button" onClick={() => copyText(r.id)} className="mono font-bold underline" style={{ cursor: "pointer" }}>{r.id}</button></div>
                <div className="mono mt-1 break-all text-xs" style={{ opacity: 0.9 }}>{r.link}</div>
                <div className="mt-2 flex gap-1.5">
                  <button type="button" onClick={() => copyText(r.link)} className="btn flex-1" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", backgroundColor: "rgba(0,0,0,0.25)", color: "inherit", border: "1px solid rgba(255,255,255,0.25)" }}>
                    Copy link
                  </button>
                  <button type="button" onClick={() => router.push(`/code/${r.id}`)} className="btn flex-1" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", backgroundColor: "rgba(0,0,0,0.25)", color: "inherit", border: "1px solid rgba(255,255,255,0.25)" }}>
                    Open
                  </button>
                </div>
                <div className="bubble-meta">
                  <span>link auto-copied · {formatTTL(r.ttlHours)}</span>
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-3 px-4 sm:px-6">
        {draftTotal > 0 && <div className="mb-1 text-xs muted">{formatSize(draftTotal)} / 10MB attached</div>}
        <Composer
          value={code}
          onChange={setCode}
          onSend={stage}
          sending={false}
          sendLabel="Stage it above"
          placeholder=""
          screenshots={screenshots}
          files={files}
          onFiles={onFiles}
          attachIdPrefix="new"
        />
        {staged.length > 0 && (
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={generateAll} disabled={busyKey} className="btn btn-primary flex-1" style={{ padding: "0.7rem" }}>
              {busyKey ? "Generating…" : `Generate ID + link (${staged.length})`}
            </button>
            <button type="button" onClick={fresh} disabled={busyKey} className="btn btn-ghost">
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

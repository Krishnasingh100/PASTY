"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import { addIncoming } from "@/lib/attach.js";
import { copyText, formatSize, formatTTL } from "@/lib/format.js";
import { tryFormat } from "@/lib/formatCode.js";
import { pingLists, peekPasteNum, commitPasteNum, addPaste } from "@/lib/visited.js";
import Composer from "@/components/Composer.jsx";
import PendingPreview from "@/components/PendingPreview.jsx";
import IdBox from "@/components/IdBox.jsx";

const MIN_TTL = 1;
const MAX_TTL = 168;
const MAX_STAGED = 1;

let seq = 0;
const nextKey = () => `st-${Date.now()}-${seq++}`;
// Same text + same files = same draft. Stops double-Enter duplicates.
const draftSig = (code, screenshots, files) =>
  [code.trim(), ...[...screenshots, ...files].map((f) => `${f.name}:${f.size}:${f.lastModified || 0}`)].join("|");

export default function CreatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [files, setFiles] = useState([]);
  // Queue — every Enter appends a new draft above. Old drafts stay.
  const [staged, setStaged] = useState([]);
  // One result per generated draft.
  const [results, setResults] = useState([]);
  const [ttlHours, setTtlHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [dragging, setDragging] = useState(false);
  const busyRef = useRef(false);
  const dragCount = useRef(0);
  const threadRef = useRef(null);

  const draftTotal = [...screenshots, ...files].reduce((s, f) => s + f.size, 0);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [staged, results]);

  const onFiles = (incoming) => {
    // UploadZone remove buttons send back { screenshots, files } directly.
    if (incoming && Array.isArray(incoming.screenshots) && Array.isArray(incoming.files)) {
      setScreenshots(incoming.screenshots);
      setFiles(incoming.files);
      return;
    }
    const next = addIncoming(screenshots, files, incoming, { maxTotal: 10 * 1024 * 1024 });
    setScreenshots(next.screenshots);
    setFiles(next.files);
  };

  // Step 1: Enter / Send appends a draft above. Never replaces old drafts.
  const stage = () => {
    setFormError("");
    if (!code.trim() && screenshots.length === 0 && files.length === 0) {
      const msg = "Type something or attach a file first";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    if (staged.length >= MAX_STAGED) {
      const msg = "One box at a time — generate or remove it first";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    const sig = draftSig(code, screenshots, files);
    if (staged.some((s) => s.sig === sig)) {
      toast.info("Already staged above");
      return;
    }
    setStaged((prev) => [...prev, { key: nextKey(), sig, code, screenshots, files }]);
    setCode("");
    setScreenshots([]);
    setFiles([]);
  };

  // Step 2: Generate merges every staged box into ONE paste — always 1 ID.
  const generateAll = async () => {
    if (busyRef.current || staged.length === 0) return;
    setFormError("");
    // One paste caps: 10MB total, 5 screenshots, 5 files.
    const shots = staged.flatMap((s) => s.screenshots);
    const docs = staged.flatMap((s) => s.files);
    const totalSize = [...shots, ...docs].reduce((sum, f) => sum + f.size, 0);
    if (shots.length > 5 || docs.length > 5 || totalSize > 10 * 1024 * 1024) {
      const msg = "Too much for one ID — remove a box (max 5 photos, 5 files, 10MB total)";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    const queue = [...staged];
    const num = peekPasteNum();
    try {
      const parts = [];
      for (const item of queue) {
        const formatted = await tryFormat(item.code);
        if (formatted.trim()) parts.push(formatted.trim());
      }
      const res = await api.createGist(
        { code: parts.join("\n\n"), title: `Paste ${num}`, ttlHours },
        shots,
        docs
      );
      if (!res?.data?.id) throw new Error("Server returned no ID — try again");
      commitPasteNum(num);
      addPaste(res.data.id, res.data.title);
      setResults((prev) => [...prev, { id: res.data.id, ttlHours: res.data.ttlHours, title: res.data.title }]);
      setStaged([]);
      pingLists();
      try {
        await navigator.clipboard.writeText(res.data.id);
      } catch {}
    } catch (e) {
      console.error("Create paste failed:", e);
      const msg = e?.message || "Could not create ID";
      setFormError(msg);
      toast.error(msg);
    } finally {
      busyRef.current = false;
      setBusy(false);
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
                <div className="text-sm">Type below, press Enter — one box above holds text plus images. Generate makes 1 ID.</div>
                <div className="bubble-meta"><span>now</span></div>
              </div>
            )}

            {staged.map((item, i) => {
              const size = [...item.screenshots, ...item.files].reduce((s, f) => s + f.size, 0);
              return (
                <div key={item.key}>
                  <PendingPreview code={item.code} screenshots={item.screenshots} files={item.files} />
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="chip">{item.screenshots.length + item.files.length > 0 ? `${formatSize(size)} attached` : "text only"}</span>
                    <button
                      type="button"
                      onClick={() => setStaged((prev) => prev.filter((s) => s.key !== item.key))}
                      disabled={busy}
                      className="btn btn-ghost ms-auto"
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem" }}
                      aria-label={`Remove draft ${i + 1}`}
                    >
                      <X className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {results.map((r) => (
              <div key={r.id} className="bubble bubble-out rise" style={{ maxWidth: "100%" }}>
                <div className="bubble-name flex items-center gap-2" style={{ color: "inherit", opacity: 0.85 }}>
                  <span className="min-w-0 flex-1 truncate">{r.title || "Untitled"}</span>
                  <button
                    type="button"
                    onClick={() => setResults((prev) => prev.filter((x) => x.id !== r.id))}
                    className="icon-btn shrink-0"
                    style={{ padding: "0.15rem", color: "inherit" }}
                    aria-label={`Dismiss ${r.id}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <IdBox label="Paste ID" value={r.id} toastMsg="ID copied!" />
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button type="button" onClick={() => copyText(r.id, "ID copied!")} className="btn flex-1" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", backgroundColor: "rgba(0,0,0,0.25)", color: "inherit", border: "1px solid rgba(255,255,255,0.25)" }}>
                    Copy ID
                  </button>
                  <button type="button" onClick={() => router.push(`/code/${r.id}`)} className="btn flex-1" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", backgroundColor: "rgba(0,0,0,0.25)", color: "inherit", border: "1px solid rgba(255,255,255,0.25)" }}>
                    Open
                  </button>
                </div>
                <div className="bubble-meta">
                  <span>ID auto-copied · {formatTTL(r.ttlHours)}</span>
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
          <div className="mt-2 flex flex-wrap items-stretch gap-2">
            <div className="flex min-w-44 flex-1 items-center gap-2 rounded-[10px] px-3" style={{ backgroundColor: "var(--secondary-color)", border: "1px solid var(--border-color)" }} role="group" aria-label="Link validity">
              <span className="mono shrink-0 text-[11px] muted">1h</span>
              <input
                type="range"
                min={MIN_TTL}
                max={MAX_TTL}
                step={1}
                value={ttlHours}
                disabled={busy}
                onChange={(e) => setTtlHours(Number(e.target.value))}
                className="ttl-slider"
                aria-label={`Link validity in hours, now ${formatTTL(ttlHours)}`}
              />
              <span className="mono shrink-0 text-[11px] muted">7d</span>
              <span className="chip mono shrink-0" title="ID lives this long">{formatTTL(ttlHours)}</span>
            </div>
            <button type="button" onClick={generateAll} disabled={busy} className="btn btn-primary flex-1" style={{ padding: "0.7rem" }}>
              {busy ? "Generating…" : "Generate ID"}
            </button>
            <button type="button" onClick={fresh} disabled={busy} className="btn btn-ghost">
              Clear
            </button>
          </div>
        )}
        {results.length > 0 && (
          <button type="button" onClick={() => setResults([])} disabled={busy} className="btn btn-ghost mt-2 w-full" style={{ padding: "0.5rem", fontSize: "0.75rem" }}>
            Clear all links ({results.length})
          </button>
        )}
      </div>
    </div>
  );
}

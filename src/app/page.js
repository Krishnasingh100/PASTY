"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import { addIncoming } from "@/lib/attach.js";
import { copyText, deriveTitle, formatSize, formatTTL } from "@/lib/format.js";
import { tryFormat } from "@/lib/formatCode.js";
import { pingLists } from "@/lib/visited.js";
import Composer from "@/components/Composer.jsx";
import PendingPreview from "@/components/PendingPreview.jsx";
import IdBox from "@/components/IdBox.jsx";

const TTL_HOURS = 24;

export default function CreatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [files, setFiles] = useState([]);
  // Single draft slot — Enter stages it above. Only one draft exists ever.
  const [staged, setStaged] = useState(null);
  // Single result — one Generate click makes exactly one ID + one link.
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [dragging, setDragging] = useState(false);
  const busyRef = useRef(false);
  const dragCount = useRef(0);
  const threadRef = useRef(null);

  const draftTotal = [...screenshots, ...files].reduce((s, f) => s + f.size, 0);
  const done = !!result && !staged;

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [staged, result]);

  const onFiles = (incoming) => {
    const next = addIncoming(screenshots, files, incoming, { maxTotal: 10 * 1024 * 1024 });
    setScreenshots(next.screenshots);
    setFiles(next.files);
  };

  // Step 1: Enter / Send stages draft above. Replaces any old draft — no pile-up.
  const stage = () => {
    if (busyRef.current) return;
    setFormError("");
    if (!code.trim() && screenshots.length === 0 && files.length === 0) {
      const msg = "Type something or attach a file first";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    setStaged({ key: `st-${Date.now()}`, code, screenshots, files });
    setCode("");
    setScreenshots([]);
    setFiles([]);
  };

  // Step 2: Generate button makes exactly ONE gist from the staged draft.
  const generate = async () => {
    if (busyRef.current || !staged) return;
    setFormError("");
    busyRef.current = true;
    setBusy(true);
    try {
      const formatted = await tryFormat(staged.code);
      const res = await api.createGist(
        { code: formatted.trim(), title: deriveTitle(formatted, staged.screenshots, staged.files), ttlHours: TTL_HOURS },
        staged.screenshots,
        staged.files
      );
      if (!res?.data?.id) throw new Error("Server returned no ID — try again");
      const link = `${window.location.origin}/code/${res.data.id}`;
      setResult({ id: res.data.id, link, ttlHours: res.data.ttlHours, title: res.data.title });
      setStaged(null);
      pingLists();
      try {
        await navigator.clipboard.writeText(link);
      } catch {}
    } catch (e) {
      console.error("Create paste failed:", e);
      const msg = e?.message || "Could not create link";
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
    setStaged(null);
    setResult(null);
    setFormError("");
  };

  const stagedSize = staged ? [...staged.screenshots, ...staged.files].reduce((s, f) => s + f.size, 0) : 0;

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

            {!staged && !result && (
              <div className="bubble bubble-in">
                <div className="bubble-name">Pasty</div>
                <div className="text-sm">Type below and press Enter — draft appears above, then hit Generate for one ID + one link.</div>
                <div className="bubble-meta"><span>now</span></div>
              </div>
            )}

            {staged && (
              <div>
                <PendingPreview code={staged.code} screenshots={staged.screenshots} files={staged.files} />
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="chip">{staged.screenshots.length + staged.files.length > 0 ? `${formatSize(stagedSize)} attached` : "text only"}</span>
                  <button
                    type="button"
                    onClick={() => setStaged(null)}
                    disabled={busy}
                    className="btn btn-ghost ms-auto"
                    style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem" }}
                    aria-label="Remove staged item"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            )}

            {result && (
              <div className="bubble bubble-out rise" style={{ maxWidth: "100%" }}>
                <div className="bubble-name" style={{ color: "inherit", opacity: 0.85 }}>{result.title || "Untitled"}</div>
                <div className="space-y-2">
                  <IdBox label="Paste ID" value={result.id} toastMsg="ID copied!" />
                  <IdBox label="Paste link" value={result.link} toastMsg="Link copied!" />
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button type="button" onClick={() => copyText(result.link, "Link copied!")} className="btn flex-1" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", backgroundColor: "rgba(0,0,0,0.25)", color: "inherit", border: "1px solid rgba(255,255,255,0.25)" }}>
                    Copy link
                  </button>
                  <button type="button" onClick={() => router.push(`/code/${result.id}`)} className="btn flex-1" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", backgroundColor: "rgba(0,0,0,0.25)", color: "inherit", border: "1px solid rgba(255,255,255,0.25)" }}>
                    Open
                  </button>
                </div>
                <div className="bubble-meta">
                  <span>link auto-copied · {formatTTL(result.ttlHours)}</span>
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!done ? (
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
        {staged && (
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={generate} disabled={busy} className="btn btn-primary flex-1" style={{ padding: "0.7rem" }}>
              {busy ? "Generating…" : "Generate ID + link"}
            </button>
            <button type="button" onClick={fresh} disabled={busy} className="btn btn-ghost">
              Clear
            </button>
          </div>
        )}
      </div>
      ) : (
      <div className="px-4 sm:px-6">
        <button type="button" onClick={fresh} className="btn btn-primary w-full" style={{ padding: "0.8rem" }}>
          + New paste
        </button>
        <p className="mt-2 text-center text-xs muted">Share the ID + link above with any device — open it there, no login.</p>
      </div>
      )}
    </div>
  );
}

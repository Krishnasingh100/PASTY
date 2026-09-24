"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCheck, Wand2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import { addIncoming } from "@/lib/attach.js";
import { copyText, formatSize, formatTTL } from "@/lib/format.js";
import Composer from "@/components/Composer.jsx";
import TtlPicker from "@/components/TtlPicker.jsx";

export default function CreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [ttlHours, setTtlHours] = useState(24);
  const [screenshots, setScreenshots] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [fmtBusy, setFmtBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState(null);

  const total = [...screenshots, ...files].reduce((s, f) => s + f.size, 0);

  const onFiles = (incoming) => {
    const next = addIncoming(screenshots, files, incoming, { maxTotal: 10 * 1024 * 1024 });
    setScreenshots(next.screenshots);
    setFiles(next.files);
  };

  const send = async () => {
    setFormError("");
    setResult(null);
    if (!code.trim() && screenshots.length === 0 && files.length === 0) {
      const msg = "Type something or attach a file first";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    setBusy(true);
    try {
      const res = await api.createGist({ code: code.trim(), title: title || "Untitled", ttlHours }, screenshots, files);
      if (!res?.data?.id) throw new Error("Server returned no ID — try again");
      const link = `${window.location.origin}/code/${res.data.id}`;
      setResult({ id: res.data.id, link, ttlHours: res.data.ttlHours, title: res.data.title });
      try {
        await navigator.clipboard.writeText(link);
      } catch {}
      toast.success(`ID ${res.data.id} generated — link copied!`);
    } catch (e) {
      console.error("Create paste failed:", e);
      const msg = e?.message || "Could not create link";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const formatCode = async () => {
    if (!code.trim()) return toast.info("Nothing to format");
    setFmtBusy(true);
    try {
      const prettier = await import("prettier/standalone");
      const babel = await import("prettier/plugins/babel");
      const estree = await import("prettier/plugins/estree");
      const trimmed = code.trim();
      let out = null;
      if (/^[\[{]/.test(trimmed)) {
        try {
          out = await prettier.format(trimmed, { parser: "json", plugins: [estree] });
        } catch {}
      }
      if (out == null) out = await prettier.format(code, { parser: "babel", plugins: [babel, estree] });
      setCode(out);
      toast.success("Formatted!");
    } catch {
      toast.error("Cannot format — check syntax (JS/JSON supported)");
    } finally {
      setFmtBusy(false);
    }
  };

  const fresh = () => {
    setCode("");
    setTitle("");
    setScreenshots([]);
    setFiles([]);
    setResult(null);
    setFormError("");
  };

  return (
    <div className="rise space-y-3">
      <div className="chat">
        <div className="date-chip">New paste</div>
        <div className="notice">Anything you send becomes a shareable link with a short ID · expires in {formatTTL(ttlHours)}</div>

        {formError && (
          <div className="bubble bubble-in" style={{ borderColor: "var(--danger-color)" }}>
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--danger-color)" }} />
              <span>{formError}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="bubble bubble-out rise">
            <div className="bubble-name" style={{ color: "inherit", opacity: 0.85 }}>{result.title || "Untitled"}</div>
            <div className="text-sm">ID <button type="button" onClick={() => copyText(result.id, "ID copied!")} className="mono font-bold underline" style={{ cursor: "pointer" }}>{result.id}</button></div>
            <div className="mono mt-1 break-all text-xs" style={{ opacity: 0.9 }}>{result.link}</div>
            <div className="mt-2 flex gap-1.5">
              <button type="button" onClick={() => copyText(result.link, "Link copied!")} className="btn flex-1" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", backgroundColor: "rgba(0,0,0,0.25)", color: "inherit", border: "1px solid rgba(255,255,255,0.25)" }}>
                Copy link
              </button>
              <button type="button" onClick={() => router.push(`/code/${result.id}`)} className="btn flex-1" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", backgroundColor: "rgba(0,0,0,0.25)", color: "inherit", border: "1px solid rgba(255,255,255,0.25)" }}>
                Open
              </button>
              <button type="button" onClick={fresh} className="btn flex-1" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", backgroundColor: "transparent", color: "inherit", border: "1px solid rgba(255,255,255,0.25)" }}>
                New
              </button>
            </div>
            <div className="bubble-meta">
              <span>expires in {formatTTL(result.ttlHours)}</span>
              <CheckCheck className="h-3.5 w-3.5" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          maxLength={100}
          className="field"
          aria-label="Title"
        />
        <TtlPicker value={ttlHours} onChange={setTtlHours} />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={formatCode} disabled={fmtBusy} className="btn btn-ghost" style={{ padding: "0.4rem 0.8rem" }} title="Auto-format code (JS/JSON)">
          <Wand2 className="h-3.5 w-3.5" /> {fmtBusy ? "…" : "Format"}
        </button>
        <span className="text-xs muted">Highlight colors appear automatically after send.</span>
      </div>
      {total > 0 && <div className="text-xs muted">{formatSize(total)} / 10MB attached</div>}

      <Composer
        value={code}
        onChange={setCode}
        onSend={send}
        sending={busy}
        sendLabel="Generate ID and link"
        placeholder="Paste code or any text… Enter to send, Shift+Enter new line"
        screenshots={screenshots}
        files={files}
        onFiles={onFiles}
        maxTotal={10 * 1024 * 1024}
        attachIdPrefix="new"
      />
    </div>
  );
}

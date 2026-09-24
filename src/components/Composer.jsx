"use client";

import { useRef, useState } from "react";
import { FileUp, ImagePlus, Plus, SendHorizontal, X } from "lucide-react";
import UploadZone from "@/components/UploadZone.jsx";

// WhatsApp-style composer: + attach menu, growing box, send button.
export default function Composer({
  value,
  onChange,
  onSend,
  sending,
  sendLabel = "Send",
  placeholder = "Type a message…",
  screenshots,
  files,
  onFiles,
  maxTotal,
  attachIdPrefix = "att",
}) {
  const [attachOpen, setAttachOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const boxRef = useRef(null);

  const autogrow = () => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(160, el.scrollHeight) + "px";
  };

  const pick = (which) => {
    setMode(which);
    setAttachOpen(false);
  };

  const canSend = value.trim().length > 0 || screenshots.length > 0 || files.length > 0;

  return (
    <div className="composer">
      {attachOpen && (
        <div className="rise mb-2 flex gap-2">
          <button type="button" onClick={() => pick("photos")} className="btn btn-ghost flex-1">
            <ImagePlus className="h-4 w-4" /> Photos
          </button>
          <button type="button" onClick={() => pick("docs")} className="btn btn-ghost flex-1">
            <FileUp className="h-4 w-4" /> Documents
          </button>
        </div>
      )}

      {mode && (
        <div className="rise mb-2 rounded-xl p-2" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)" }}>
          <div className="mb-1 flex items-center justify-between px-1 text-xs muted">
            <span>{mode === "photos" ? "Photos" : "Documents"}</span>
            <button type="button" onClick={() => setMode(null)} className="icon-btn" style={{ padding: "0.25rem" }} aria-label="Close attachments">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <AttachPicker
            mode={mode}
            screenshots={screenshots}
            files={files}
            onFiles={onFiles}
            maxTotal={maxTotal}
            idPrefix={attachIdPrefix}
          />
        </div>
      )}

      <div className="composer-row">
        <button
          type="button"
          onClick={() => { setAttachOpen((o) => !o); setMode(null); }}
          className="icon-btn shrink-0"
          style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", width: 44, height: 44 }}
          aria-label="Attach"
        >
          <Plus className="h-5 w-5" style={{ transform: attachOpen ? "rotate(45deg)" : "none", transition: "transform 0.15s" }} />
        </button>
        <textarea
          ref={boxRef}
          rows={1}
          value={value}
          onChange={(e) => { onChange(e.target.value); autogrow(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend && !sending) onSend();
            } else if (e.key === "Tab") {
              e.preventDefault();
              const t = e.target;
              const start = t.selectionStart;
              onChange(t.value.slice(0, start) + "    " + t.value.slice(t.selectionEnd));
              requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = start + 4; });
            }
          }}
          placeholder={placeholder}
          className="composer-box"
          aria-label={sendLabel}
        />
        <button type="button" onClick={onSend} disabled={!canSend || sending} className="send-btn" aria-label={sendLabel} title={sendLabel}>
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function AttachPicker({ mode, screenshots, files, onFiles, maxTotal, idPrefix }) {
  const inputRef = useRef(null);
  if (mode === "photos") {
    return (
      <div>
        <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-ghost w-full">
          <ImagePlus className="h-4 w-4" /> Choose photos ({screenshots.length}/5)
        </button>
        <input
          ref={inputRef}
          id={`${idPrefix}-photos`}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            onFiles(e.target.files, "photos");
            e.target.value = "";
          }}
        />
        <PhotoTray screenshots={screenshots} files={files} onFiles={onFiles} />
      </div>
    );
  }
  return (
    <div>
      <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-ghost w-full">
        <FileUp className="h-4 w-4" /> Choose documents ({files.length}/5)
      </button>
      <input
        ref={inputRef}
        id={`${idPrefix}-docs`}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          onFiles(e.target.files, "docs");
          e.target.value = "";
        }}
      />
      <PhotoTray screenshots={screenshots} files={files} onFiles={onFiles} />
    </div>
  );
}

function PhotoTray({ screenshots, files, onFiles }) {
  if (screenshots.length === 0 && files.length === 0) return null;
  return (
    <div className="mt-2">
      <UploadZone screenshots={screenshots} files={files} onChange={onFiles} compact hideDrop />
    </div>
  );
}

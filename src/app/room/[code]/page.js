"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCheck, Download, FileText, Plus } from "lucide-react";
import { toast } from "react-toastify";
import api, { downloadUrl } from "@/lib/api.js";
import { addIncoming } from "@/lib/attach.js";
import { isOwn, markOwn } from "@/lib/device.js";
import { copyText, formatSize, formatTTL, timeRemaining } from "@/lib/format.js";
import CodeBlock from "@/components/CodeBlock.jsx";
import Composer from "@/components/Composer.jsx";
import Lightbox from "@/components/Lightbox.jsx";

const POLL_MS = 10000;
const time = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const day = (d) => new Date(d).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

export default function RoomPage() {
  const { code } = useParams();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [entryCode, setEntryCode] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [files, setFiles] = useState([]);
  const [adding, setAdding] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const timer = useRef(null);
  const bottomRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!code) return;
    try {
      const res = await api.getRoom(code);
      if (!res?.data?.code) throw new Error("Bad room response");
      setRoom(res.data);
      setError("");
    } catch (e) {
      console.error("Load room failed:", e);
      if (!silent) setError(e?.message || "Failed to load room");
    }
  }, [code]);

  useEffect(() => {
    setRoom(null);
    setError("");
    load();
    timer.current = setInterval(() => { if (!document.hidden) load(true); }, POLL_MS);
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(timer.current); window.removeEventListener("focus", onFocus); };
  }, [code, load]);

  const onFiles = (incoming) => {
    const cap = room ? Math.min(10 * 1024 * 1024, Math.max(0, room.maxSize - room.totalSize)) : 10 * 1024 * 1024;
    const next = addIncoming(screenshots, files, incoming, { maxTotal: cap });
    setScreenshots(next.screenshots);
    setFiles(next.files);
  };

  const send = async () => {
    if (!entryCode.trim() && screenshots.length === 0 && files.length === 0) {
      toast.error("Type something or attach a file first");
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const temp = {
      id: tempId,
      title: title || "Untitled",
      code: entryCode.trim(),
      entrySize: [...screenshots, ...files].reduce((s, f) => s + f.size, 0),
      screenshots: screenshots.map((f) => ({ name: f.name, size: f.size })),
      files: files.map((f) => ({ name: f.name, size: f.size })),
      createdAt: new Date().toISOString(),
      _sending: true,
    };
    setRoom((prev) => (prev ? { ...prev, entries: [temp, ...prev.entries] } : prev));
    setAdding(true);
    try {
      const res = await api.addRoomEntry(code, { code: entryCode.trim(), title: title || "Untitled" }, screenshots, files);
      if (!res?.success) throw new Error("Server rejected entry");
      if (res?.data?.id) markOwn(res.data.id);
      setTitle("");
      setEntryCode("");
      setScreenshots([]);
      setFiles([]);
      await load();
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
    } catch (e) {
      console.error("Add entry failed:", e);
      toast.error(e?.message || "Could not send");
      setRoom((prev) => (prev ? { ...prev, entries: prev.entries.filter((x) => x.id !== tempId) } : prev));
    } finally {
      setAdding(false);
    }
  };

  if (error) {
    return (
      <div className="rise mx-auto w-full max-w-md py-14">
        <div className="chat">
          <div className="bubble bubble-in" style={{ borderColor: "var(--danger-color)", maxWidth: "100%" }}>
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--danger-color)" }} />
              <span>{error} — check the 6-character code or expiry.</span>
            </div>
          </div>
          <Link href="/" className="btn btn-primary mx-auto"><Plus className="h-4 w-4" /> Home</Link>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center py-24" role="status" aria-label="Loading">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2" style={{ borderColor: "var(--primary-color)" }} />
      </div>
    );
  }

  const pct = Math.min(100, (room.totalSize / room.maxSize) * 100);
  const totalSel = [...screenshots, ...files].reduce((s, f) => s + f.size, 0);

  return (
    <div className="rise space-y-3">
      <section className="card flex flex-wrap items-center gap-2 p-3 sm:p-4">
        <Link href="/" className="icon-btn shrink-0" aria-label="Back home" title="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: "var(--secondary-hover)", color: "var(--accent-color)" }}>
          {(room.name || "R").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold sm:text-lg" style={{ color: "var(--foreground)" }}>{room.name}</h1>
          <button type="button" onClick={() => copyText(room.code, "Room code copied!")} className="mono text-xs muted underline" style={{ cursor: "pointer" }} title="Copy room code">
            {room.code} · tap to copy
          </button>
        </div>
        <div className="flex w-full flex-col gap-1 sm:w-44">
          <div className="flex justify-between text-[11px] muted">
            <span>{formatSize(room.totalSize)} / {formatSize(room.maxSize)}</span>
            <span>{timeRemaining(room.expiresAt)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "var(--input-bg)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct > 90 ? "var(--danger-color)" : "var(--primary-color)" }} />
          </div>
        </div>
      </section>

      <div className="chat">
        <div className="date-chip">{day(room.createdAt)}</div>
        <div className="notice">
          Room <span className="mono font-bold">{room.code}</span> · {room.entries.length} messages · {formatTTL(room.ttlHours)} life · yours appear on the right
        </div>

        {room.entries.length === 0 && (
          <div className="notice">No messages yet — say hello below.</div>
        )}

        {room.entries.map((entry) => {
          const own = entry._sending || isOwn(entry.id);
          return (
            <div key={entry.id} className={`bubble ${own ? "bubble-out" : "bubble-in"}`} style={entry._sending ? { opacity: 0.75 } : undefined}>
              {!own && <div className="bubble-name">{entry.title}</div>}
              {own && entry.title && entry.title !== "Untitled" && (
                <div className="bubble-name" style={{ color: "inherit", opacity: 0.8 }}>{entry.title}</div>
              )}
              {entry.code && (
                <div className="mt-1"><CodeBlock code={entry.code} /></div>
              )}
              {!entry._sending && entry.screenshots?.map((s, i) => (
                <div key={`s-${i}`} className="mt-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={api.roomScreenshotUrl(room.code, entry.id, i)}
                    alt={s.name}
                    loading="lazy"
                    onClick={() => setLightbox({ entryId: entry.id, index: i, name: s.name })}
                    className="w-full cursor-pointer rounded-lg object-cover"
                    style={{ maxHeight: 320 }}
                  />
                </div>
              ))}
              {!entry._sending && entry.files?.map((f, i) => (
                <button
                  key={`f-${i}`}
                  type="button"
                  onClick={() => downloadUrl(api.roomFileUrl(room.code, entry.id, i), f.name).catch(() => toast.error("Download failed"))}
                  className="mt-1.5 flex w-full items-center gap-2.5 rounded-lg p-2 text-left"
                  style={{ backgroundColor: "rgba(0,0,0,0.22)", cursor: "pointer" }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{f.name}</span>
                    <span className="block text-xs" style={{ opacity: 0.75 }}>{formatSize(f.size)} · tap to save</span>
                  </span>
                  <Download className="h-4 w-4 shrink-0" style={{ opacity: 0.75 }} />
                </button>
              ))}
              {entry._sending && (entry.screenshots.length > 0 || entry.files.length > 0) && (
                <div className="mt-1.5 text-xs" style={{ opacity: 0.8 }}>
                  Uploading: {[...entry.screenshots, ...entry.files].map((f) => f.name).join(", ")}
                </div>
              )}
              <div className="bubble-meta">
                {entry._sending ? (
                  <span>Sending…</span>
                ) : (
                  <>
                    {entry.entrySize > 0 && <span>{formatSize(entry.entrySize)}</span>}
                    <span>{time(entry.createdAt)}</span>
                    {own && <CheckCheck className="h-3.5 w-3.5" />}
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name this message (optional)"
          maxLength={100}
          className="field"
          aria-label="Message title"
        />
        {totalSel > 0 && <span className="chip shrink-0">{formatSize(totalSel)}</span>}
      </div>

      <Composer
        value={entryCode}
        onChange={setEntryCode}
        onSend={send}
        sending={adding}
        sendLabel="Send to room"
        placeholder="Message… Enter to send, Shift+Enter new line"
        screenshots={screenshots}
        files={files}
        onFiles={onFiles}
        maxTotal={Math.min(10 * 1024 * 1024, Math.max(0, room.maxSize - room.totalSize))}
        attachIdPrefix="room"
      />

      <p className="text-center text-xs muted">Created {new Date(room.createdAt).toLocaleString()} · auto-refresh 10s</p>

      {lightbox && (
        <Lightbox
          src={api.roomScreenshotUrl(room.code, lightbox.entryId, lightbox.index)}
          name={lightbox.name}
          onClose={() => setLightbox(null)}
          onDownload={() => {
            const shot = room.entries.find((e) => String(e.id) === String(lightbox.entryId))?.screenshots?.[lightbox.index];
            if (shot) downloadUrl(api.roomScreenshotUrl(room.code, lightbox.entryId, lightbox.index), shot.name).catch(() => toast.error("Download failed"));
          }}
        />
      )}
    </div>
  );
}

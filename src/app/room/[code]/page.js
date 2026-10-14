"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, Plus } from "lucide-react";
import { toast } from "react-toastify";
import api, { downloadUrl } from "@/lib/api.js";
import { addIncoming } from "@/lib/attach.js";
import { isOwn, markOwn } from "@/lib/device.js";
import { deriveTitle, formatSize, formatTTL, timeRemaining } from "@/lib/format.js";
import { tryFormat } from "@/lib/formatCode.js";
import { addVisited, pingLists } from "@/lib/visited.js";
import CodeBlock from "@/components/CodeBlock.jsx";
import Composer from "@/components/Composer.jsx";
import IdBox from "@/components/IdBox.jsx";
import Lightbox from "@/components/Lightbox.jsx";

const POLL_MS = 3000;
const time = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const day = (d) => new Date(d).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

export default function RoomPage() {
  const { code } = useParams();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [entryCode, setEntryCode] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [files, setFiles] = useState([]);
  const [adding, setAdding] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [dragging, setDragging] = useState(false);
  const dragCount = useRef(0);
  const sendingRef = useRef(false);
  const pollBusy = useRef(false);
  const cursor = useRef({ topId: 0, totalSize: -1 });
  const timer = useRef(null);
  const bottomRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!code || pollBusy.current) return;
    pollBusy.current = true;
    try {
      // Silent ticks send cursor. Server answers { unchanged:true } with 2 cheap
      // indexed queries, no payload, no re-render.
      const c = cursor.current;
      const haveCursor = silent && c.totalSize >= 0;
      const res = await api.getRoom(code, haveCursor ? { sinceId: c.topId, totalSize: c.totalSize } : undefined);
      if (res?.unchanged) return;
      if (!res?.data?.code) throw new Error("Bad room response");
      cursor.current = { topId: res.data.topId || 0, totalSize: res.data.totalSize };
      setRoom(res.data);
      setError("");
      addVisited(res.data.code, res.data.name);
      pingLists();
    } catch (e) {
      console.error("Load room failed:", e);
      if (!silent) setError(e?.message || "Failed to load room");
    } finally {
      pollBusy.current = false;
    }
  }, [code]);

  useEffect(() => {
    setRoom(null);
    setError("");
    cursor.current = { topId: 0, totalSize: -1 };
    load();
    timer.current = setInterval(() => { if (!document.hidden) load(true); }, POLL_MS);
    const onFocus = () => load(true);
    const onVis = () => { if (!document.hidden) load(true); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(timer.current); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVis); };
  }, [code, load]);

  const onFiles = (incoming) => {
    // UploadZone remove buttons send back { screenshots, files } directly.
    if (incoming && Array.isArray(incoming.screenshots) && Array.isArray(incoming.files)) {
      setScreenshots(incoming.screenshots);
      setFiles(incoming.files);
      return;
    }
    const cap = room ? Math.min(10 * 1024 * 1024, Math.max(0, room.maxSize - room.totalSize)) : 10 * 1024 * 1024;
    const next = addIncoming(screenshots, files, incoming, { maxTotal: cap });
    setScreenshots(next.screenshots);
    setFiles(next.files);
  };

  const send = async () => {
    if (sendingRef.current) return;
    if (!entryCode.trim() && screenshots.length === 0 && files.length === 0) {
      toast.error("Type something or attach a file first");
      return;
    }
    sendingRef.current = true;
    const formatted = await tryFormat(entryCode);
    if (formatted !== entryCode) setEntryCode(formatted);
    const autoTitle = deriveTitle(formatted, screenshots, files);
    const tempId = `temp-${Date.now()}`;
    const temp = {
      id: tempId,
      title: autoTitle,
      code: formatted.trim(),
      entrySize: [...screenshots, ...files].reduce((s, f) => s + f.size, 0),
      screenshots: screenshots.map((f) => ({ name: f.name, size: f.size })),
      files: files.map((f) => ({ name: f.name, size: f.size })),
      createdAt: new Date().toISOString(),
      _sending: true,
    };
    setRoom((prev) => (prev ? { ...prev, entries: [temp, ...prev.entries] } : prev));
    setAdding(true);
    try {
      const res = await api.addRoomEntry(code, { code: formatted.trim(), title: autoTitle }, screenshots, files);
      if (!res?.success) throw new Error("Server rejected entry");
      if (res?.data?.id) markOwn(res.data.id);
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
      sendingRef.current = false;
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
    <div
      className="rise space-y-3"
      onDragEnter={(e) => { e.preventDefault(); dragCount.current++; setDragging(true); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => { e.preventDefault(); dragCount.current--; if (dragCount.current <= 0) { dragCount.current = 0; setDragging(false); } }}
      onDrop={(e) => { e.preventDefault(); dragCount.current = 0; setDragging(false); onFiles(e.dataTransfer.files); }}
    >
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <div className="rounded-2xl px-8 py-6 text-lg font-bold" style={{ border: "3px dashed var(--primary-color)", color: "var(--foreground)", backgroundColor: "var(--card-bg)" }}>
            Drop to attach
          </div>
        </div>
      )}
      <section className="card flex flex-wrap items-center gap-2 p-3 sm:p-4">
        <Link href="/" className="icon-btn shrink-0" aria-label="Back to new paste" title="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: "var(--secondary-hover)", color: "var(--accent-color)" }}>
          {(room.name || "R").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold sm:text-lg" style={{ color: "var(--foreground)" }}>{room.name}</h1>
          <div className="mt-1 max-w-56">
            <IdBox label="Room code" value={room.code} toastMsg="Room code copied!" />
          </div>
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

        {room.entries.length === 0 && (
          <div className="bubble bubble-in">
            <div className="bubble-name">Pasty</div>
            <div className="text-sm">Room <span className="mono font-bold">{room.code}</span> is live — say hello below. Your messages appear on the right.</div>
            <div className="bubble-meta"><span>{time(room.createdAt)}</span></div>
          </div>
        )}

        {room.entries.map((entry) => (
          <RoomEntry key={entry.id} entry={entry} roomCode={room.code} onLightbox={setLightbox} />
        ))}
        <div ref={bottomRef} />
      </div>

      {totalSel > 0 && (
        <div className="flex items-center gap-2">
          <span className="chip shrink-0">{formatSize(totalSel)} attached</span>
        </div>
      )}

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
        attachIdPrefix="room"
      />

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

// Memo entry: same object ref skips render. Typing in composer no longer
// re-renders the whole chat thread every keystroke.
const RoomEntry = memo(function RoomEntry({ entry, roomCode, onLightbox }) {
  const own = entry._sending || isOwn(entry.id);
  return (
    <div className={`bubble ${own ? "bubble-out" : "bubble-in"}`} style={entry._sending ? { opacity: 0.75 } : undefined}>
      {/* Title is auto-derived from the first code line — show it only when there is no code text, else text shows twice. */}
      {!entry.code && entry.title && (
        <div className="bubble-name" style={own ? { color: "inherit", opacity: 0.8 } : undefined}>{entry.title}</div>
      )}
      {entry.code && (
        <div className="mt-1"><CodeBlock code={entry.code} /></div>
      )}
      {!entry._sending && entry.screenshots?.map((s, i) => (
        <div key={`s-${i}`} className="mt-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={api.roomScreenshotUrl(roomCode, entry.id, i)}
            alt={s.name}
            loading="lazy"
            decoding="async"
            onClick={() => onLightbox({ entryId: entry.id, index: i, name: s.name })}
            className="w-full cursor-pointer rounded-lg object-cover"
            style={{ maxHeight: 320 }}
          />
        </div>
      ))}
      {!entry._sending && entry.files?.map((f, i) => (
        <div key={`f-${i}`} className="mt-1.5">
          <FileBubble url={api.roomFileUrl(roomCode, entry.id, i)} name={f.name} size={f.size} mime={f.contentType} variant="soft" />
        </div>
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
            {own && <Check className="h-3.5 w-3.5" />}
          </>
        )}
      </div>
    </div>
  );
});

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Clock, Copy, Download, Eye, ImagePlus, Paperclip, Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import api, { downloadUrl } from "@/lib/api.js";
import { copyText, formatSize, formatTTL, timeRemaining } from "@/lib/format.js";
import Lightbox from "@/components/Lightbox.jsx";
import UploadZone from "@/components/UploadZone.jsx";

const POLL_MS = 10000;

export default function RoomPage() {
  const { code } = useParams();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [entryCode, setEntryCode] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [files, setFiles] = useState([]);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const timer = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!code) return;
    try {
      const res = await api.getRoom(code);
      setRoom(res.data);
      setError(null);
    } catch (e) {
      if (!silent) {
        setError(e.message);
        toast.error("Failed to load room");
      }
    }
  }, [code]);

  useEffect(() => {
    setRoom(null);
    setError(null);
    load();
    timer.current = setInterval(() => { if (!document.hidden) load(true); }, POLL_MS);
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(timer.current); window.removeEventListener("focus", onFocus); };
  }, [code, load]);

  const addEntry = async () => {
    if (!entryCode.trim() && screenshots.length === 0 && files.length === 0) {
      return toast.error("Add code, screenshots, or files");
    }
    setAdding(true);
    try {
      await api.addRoomEntry(code, { code: entryCode.trim(), title: title || "Untitled" }, screenshots, files);
      toast.success("Entry added!");
      setTitle("");
      setEntryCode("");
      setScreenshots([]);
      setFiles([]);
      setShowForm(false);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  if (error) {
    return (
      <div className="rise py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>Room not found</h1>
        <p className="mb-4 text-sm" style={{ color: "var(--muted-foreground)" }}>{error}</p>
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium" style={{ backgroundColor: "var(--primary-color)", color: "#fff", textDecoration: "none" }}>
          <Plus className="h-4 w-4" /> Home
        </Link>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2" style={{ borderColor: "var(--primary-color)" }} />
      </div>
    );
  }

  const pct = Math.min(100, (room.totalSize / room.maxSize) * 100);
  const roomRemaining = room.maxSize - room.totalSize;

  return (
    <div className="rise space-y-4">
      <section className="rounded-lg p-4 sm:p-5" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold" style={{ color: "var(--foreground)" }}>{room.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
              <code className="rounded px-2 py-0.5 font-mono" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)" }}>{room.code}</code>
              <button onClick={() => copyText(room.code, "Room code copied!")} className="transition-colors hover:underline" style={{ color: "var(--primary-color)", cursor: "pointer" }}>Copy</button>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeRemaining(room.expiresAt)}</span>
              <span className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: "var(--secondary-color)", border: "1px solid var(--border-color)" }}>{formatTTL(room.ttlHours)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm" style={{ backgroundColor: "var(--secondary-color)", color: "var(--foreground)", border: "1px solid var(--border-color)", textDecoration: "none" }}>
              <X className="h-4 w-4" /> Leave
            </Link>
            <button onClick={() => setShowForm((s) => !s)} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium" style={{ backgroundColor: "var(--primary-color)", color: "#fff", border: "none", cursor: "pointer" }}>
              <Plus className="h-4 w-4" /> Entry
            </button>
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span>{formatSize(room.totalSize)} / {formatSize(room.maxSize)} used</span>
            <span>{pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--input-bg)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct > 90 ? "var(--danger-color)" : "var(--primary-color)" }} />
          </div>
        </div>
      </section>

      {showForm && (
        <section className="rise space-y-3 rounded-lg p-4 sm:p-5" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>New entry</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            maxLength={100}
            className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
            style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--foreground)" }}
          />
          <textarea
            value={entryCode}
            onChange={(e) => setEntryCode(e.target.value)}
            placeholder="Paste code here…"
            maxLength={100000}
            rows={7}
            className="w-full resize-y rounded-md p-3 font-mono text-sm focus:outline-none"
            style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--foreground)" }}
          />
          <UploadZone
            screenshots={screenshots}
            files={files}
            onChange={({ screenshots: ss, files: ff }) => { setScreenshots(ss); setFiles(ff); }}
            maxTotal={Math.min(10 * 1024 * 1024, Math.max(0, roomRemaining))}
            compact
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{formatSize(roomRemaining)} room space left</span>
            <button onClick={addEntry} disabled={adding} className="rounded-md px-4 py-2 text-sm font-medium" style={{ backgroundColor: adding ? "var(--muted-foreground)" : "var(--primary-color)", color: "#fff", border: "none", cursor: adding ? "not-allowed" : "pointer" }}>
              {adding ? "Adding…" : "Submit entry"}
            </button>
          </div>
        </section>
      )}

      {room.entries.length === 0 && !showForm ? (
        <div className="py-12 text-center" style={{ color: "var(--muted-foreground)" }}>
          <p className="mb-1 text-lg">No entries yet</p>
          <p className="text-sm">Click “Entry” to share something in this room.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {room.entries.map((entry) => (
            <article key={entry.id} className="space-y-3 rounded-lg p-4 sm:p-5" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <h3 className="truncate font-medium" style={{ color: "var(--foreground)" }}>{entry.title}</h3>
                <span className="shrink-0 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(entry.createdAt).toLocaleString()}{entry.entrySize > 0 && ` · ${formatSize(entry.entrySize)}`}
                </span>
              </div>

              {entry.code && (
                <div className="relative">
                  <div
                    onClick={() => setExpanded((p) => ({ ...p, [entry.id]: !p[entry.id] }))}
                    className="cursor-pointer rounded-md transition-colors"
                    style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)" }}
                  >
                    {expanded[entry.id] ? (
                      <pre className="overflow-auto p-3 font-mono text-sm" style={{ color: "var(--foreground)", maxHeight: 500, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        <code>{entry.code}</code>
                      </pre>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <code className="flex-1 truncate font-mono text-sm" style={{ color: "var(--foreground)" }}>{entry.code.split("\n")[0]}</code>
                        <Eye className="h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                      </div>
                    )}
                  </div>
                  <button onClick={() => copyText(entry.code, "Copied!")} className="absolute right-2 top-2 rounded-md p-1.5" style={{ backgroundColor: "var(--secondary-color)", border: "1px solid var(--border-color)", color: "var(--foreground)", cursor: "pointer" }} aria-label="Copy entry code">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {entry.screenshots?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.screenshots.map((s, i) => (
                    <div key={i} className="group relative" style={{ width: 120, height: 90 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={api.roomScreenshotUrl(room.code, entry.id, i)}
                        alt={s.name}
                        loading="lazy"
                        onClick={() => setLightbox({ entryId: entry.id, index: i, name: s.name })}
                        className="h-full w-full cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
                        style={{ border: "1px solid var(--border-color)" }}
                      />
                      <button
                        onClick={() => downloadUrl(api.roomScreenshotUrl(room.code, entry.id, i), s.name).catch(() => toast.error("Download failed"))}
                        className="absolute bottom-1 right-1 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "#fff", cursor: "pointer" }}
                        aria-label="Download screenshot"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {entry.files?.length > 0 && (
                <div className="space-y-1">
                  {entry.files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded px-3 py-2 text-sm" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)" }}>
                      <div className="flex min-w-0 items-center gap-2">
                        <Paperclip className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                        <span className="truncate" style={{ color: "var(--foreground)" }}>{f.name}</span>
                        <span className="shrink-0 text-xs" style={{ color: "var(--muted-foreground)" }}>{formatSize(f.size)}</span>
                      </div>
                      <button
                        onClick={() => downloadUrl(api.roomFileUrl(room.code, entry.id, i), f.name).catch(() => toast.error("Download failed"))}
                        className="ml-2 inline-flex shrink-0 items-center gap-1 rounded px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: "var(--primary-color)", color: "#fff", border: "none", cursor: "pointer" }}
                      >
                        <Download className="h-3 w-3" /> Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", color: "var(--muted-foreground)" }}>
        Created {new Date(room.createdAt).toLocaleString()} · Expires {new Date(room.expiresAt).toLocaleString()} · {room.entries.length} entries · refreshes every 10s
      </div>

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

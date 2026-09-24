"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, Copy, Download, Image as ImageIcon, Paperclip, Plus, Search } from "lucide-react";
import { toast } from "react-toastify";
import api, { downloadUrl } from "@/lib/api.js";
import { copyText, formatSize, formatTTL, timeRemaining } from "@/lib/format.js";
import Lightbox from "@/components/Lightbox.jsx";

export default function ViewPage() {
  const { id } = useParams();
  const [gist, setGist] = useState(null);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!id) return;
    api.getGist(id).then((r) => setGist(r.data)).catch((e) => { setError(e.message); toast.error("Failed to load paste"); });
  }, [id]);

  if (error) {
    return (
      <div className="rise py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--foreground)" }}>Paste not found</h1>
        <p className="mb-4 text-sm" style={{ color: "var(--muted-foreground)" }}>{error}</p>
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium" style={{ backgroundColor: "var(--primary-color)", color: "#fff", textDecoration: "none" }}>
          <Plus className="h-4 w-4" /> New paste
        </Link>
      </div>
    );
  }

  if (!gist) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2" style={{ borderColor: "var(--primary-color)" }} />
      </div>
    );
  }

  return (
    <div className="rise space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold" style={{ color: "var(--foreground)" }}>{gist.title || "Untitled"}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(gist.createdAt).toLocaleDateString()}</span>
            <span className="inline-flex items-center gap-1">
              <Copy className="h-3.5 w-3.5" /> ID: <code className="font-mono">{gist.id}</code>
              <button onClick={() => copyText(gist.id, "ID copied!")} className="rounded p-1" style={{ backgroundColor: "var(--secondary-color)", border: "1px solid var(--border-color)", color: "var(--foreground)", cursor: "pointer" }} aria-label="Copy ID">
                <Copy className="h-3 w-3" />
              </button>
            </span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeRemaining(gist.expiresAt)}</span>
            {gist.ttlHours && <span className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: "var(--secondary-color)", border: "1px solid var(--border-color)" }}>{formatTTL(gist.ttlHours)}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm" style={{ backgroundColor: "var(--secondary-color)", color: "var(--foreground)", border: "1px solid var(--border-color)", textDecoration: "none" }}>
            <Plus className="h-4 w-4" /> New
          </Link>
          <Link href="/recent" className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm" style={{ backgroundColor: "var(--secondary-color)", color: "var(--foreground)", border: "1px solid var(--border-color)", textDecoration: "none" }}>
            <Search className="h-4 w-4" /> Search
          </Link>
        </div>
      </div>

      {gist.code && (
        <section className="space-y-3 rounded-lg p-4 sm:p-5" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Code</h2>
            <div className="flex gap-2">
              <button onClick={() => copyText(gist.code, "Code copied!")} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors" style={{ backgroundColor: "var(--secondary-color)", color: "var(--foreground)", border: "1px solid var(--border-color)", cursor: "pointer" }}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <button onClick={() => copyText(window.location.href, "Link copied!")} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors" style={{ backgroundColor: "var(--primary-color)", color: "#fff", border: "none", cursor: "pointer" }}>
                <Copy className="h-3.5 w-3.5" /> Link
              </button>
            </div>
          </div>
          <pre className="overflow-auto rounded-md p-4 font-mono text-sm" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--foreground)", maxHeight: 600 }}>
            <code>{gist.code}</code>
          </pre>
        </section>
      )}

      {gist.screenshots?.length > 0 && (
        <section className="space-y-3 rounded-lg p-4 sm:p-5" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
          <h2 className="flex items-center gap-2 font-semibold" style={{ color: "var(--foreground)" }}>
            <ImageIcon className="h-4 w-4" /> Screenshots ({gist.screenshots.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gist.screenshots.map((s, i) => (
              <div key={i} className="group relative overflow-hidden rounded-md" style={{ border: "1px solid var(--border-color)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={api.gistScreenshotUrl(gist.id, i)} alt={s.name} loading="lazy" onClick={() => setLightbox(i)} className="h-40 w-full cursor-pointer object-cover transition-transform group-hover:scale-105" />
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 truncate px-2 py-1 text-xs" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>
                  {s.name} · {formatSize(s.size)}
                </div>
                <button
                  onClick={() => downloadUrl(api.gistScreenshotUrl(gist.id, i), s.name).catch(() => toast.error("Download failed"))}
                  className="absolute right-2 top-2 rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: "var(--primary-color)", color: "#fff", cursor: "pointer" }}
                  aria-label="Download image"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {gist.files?.length > 0 && (
        <section className="space-y-3 rounded-lg p-4 sm:p-5" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
          <h2 className="flex items-center gap-2 font-semibold" style={{ color: "var(--foreground)" }}>
            <Paperclip className="h-4 w-4" /> Files ({gist.files.length})
          </h2>
          <div className="space-y-1.5">
            {gist.files.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-md px-3 py-2.5" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)" }}>
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <Paperclip className="h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                  <span className="truncate" style={{ color: "var(--foreground)" }}>{f.name}</span>
                  <span className="shrink-0 text-xs" style={{ color: "var(--muted-foreground)" }}>{formatSize(f.size)}</span>
                </div>
                <button
                  onClick={() => downloadUrl(api.gistFileUrl(gist.id, i), f.name).catch(() => toast.error("Download failed"))}
                  className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: "var(--primary-color)", color: "#fff", border: "none", cursor: "pointer" }}
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", color: "var(--muted-foreground)" }}>
        Created {new Date(gist.createdAt).toLocaleString()} · Expires {new Date(gist.expiresAt).toLocaleString()}
      </div>

      {lightbox !== null && gist.screenshots[lightbox] && (
        <Lightbox
          src={api.gistScreenshotUrl(gist.id, lightbox)}
          name={gist.screenshots[lightbox].name}
          onClose={() => setLightbox(null)}
          onDownload={() => downloadUrl(api.gistScreenshotUrl(gist.id, lightbox), gist.screenshots[lightbox].name).catch(() => toast.error("Download failed"))}
        />
      )}
    </div>
  );
}

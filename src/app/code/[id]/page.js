"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { toast } from "react-toastify";
import api, { downloadUrl } from "@/lib/api.js";
import { formatSize, formatTTL, timeRemaining } from "@/lib/format.js";
import CodeBlock from "@/components/CodeBlock.jsx";
import FileBubble from "@/components/FileBubble.jsx";
import IdBox from "@/components/IdBox.jsx";
import Lightbox from "@/components/Lightbox.jsx";

const time = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const day = (d) => new Date(d).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

export default function ViewPage() {
  const { id } = useParams();
  const [gist, setGist] = useState(null);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!id) return;
    setError("");
    api.getGist(id).then((r) => setGist(r.data)).catch((e) => {
      console.error("Load paste failed:", e);
      setError(e?.message || "Failed to load paste");
    });
  }, [id]);

  if (error) {
    return (
      <div className="rise mx-auto w-full max-w-md py-14">
        <div className="chat">
          <div className="bubble bubble-in" style={{ borderColor: "var(--danger-color)", maxWidth: "100%" }}>
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--danger-color)" }} />
              <span>{error} — pastes live 1 hour to 7 days, then vanish.</span>
            </div>
            <div className="bubble-meta"><span>{time(Date.now())}</span></div>
          </div>
          <Link href="/" className="btn btn-primary mx-auto"><Plus className="h-4 w-4" /> New paste</Link>
        </div>
      </div>
    );
  }

  if (!gist) {
    return (
      <div className="flex items-center justify-center py-24" role="status" aria-label="Loading">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2" style={{ borderColor: "var(--primary-color)" }} />
      </div>
    );
  }

  return (
    <div className="rise">
      <div className="chat">
        <div className="date-chip">{day(gist.createdAt)}</div>
        <div className="notice">
          <div className="mb-1 text-xs">{timeRemaining(gist.expiresAt)} · {formatTTL(gist.ttlHours)} total</div>
          <IdBox label="Paste ID" value={gist.id} toastMsg="ID copied!" />
        </div>

        <div className="bubble bubble-in">
          {/* Title is auto-derived from the first code line — show it only when there is no code text, else text shows twice. */}
          {!gist.code && <div className="bubble-name">{gist.title || "Untitled"}</div>}
          {gist.code ? (
            <CodeBlock code={gist.code} />
          ) : (
            <div className="text-sm muted">No text — files only.</div>
          )}
          <div className="bubble-meta"><span>{time(gist.createdAt)}</span></div>
        </div>

        {gist.screenshots?.map((s, i) => (
          <div key={`s-${i}`} className="bubble bubble-in" style={{ padding: "0.3rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={api.gistScreenshotUrl(gist.id, i)}
              alt={s.name}
              loading="lazy"
              decoding="async"
              onClick={() => setLightbox(i)}
              className="w-full cursor-pointer rounded-lg object-cover"
              style={{ maxHeight: 380 }}
            />
            <div className="bubble-meta"><span>{s.name} · {formatSize(s.size)} · {time(gist.createdAt)}</span></div>
          </div>
        ))}

        {gist.files?.map((f, i) => (
          <div key={`f-${i}`} className="bubble bubble-in">
            <FileBubble url={api.gistFileUrl(gist.id, i)} name={f.name} size={f.size} mime={f.contentType} />
            <div className="bubble-meta"><span>{time(gist.createdAt)}</span></div>
          </div>
        ))}
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

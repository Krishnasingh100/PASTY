"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardPaste, Hash, MessageSquarePlus, Search, Trash2, Users } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import { copyText, extractId, timeRemaining } from "@/lib/format.js";
import { getVisited, pingLists, removeVisited } from "@/lib/visited.js";
import IdBox from "./IdBox.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Sidebar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomBusy, setRoomBusy] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [pastes, setPastes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let live = true;
    const reload = () => {
      if (!live) return;
      api.listGists(1, 8).then((r) => live && setPastes(r.data || [])).catch(() => {});
      setRooms(getVisited());
    };
    reload();
    window.addEventListener("focus", reload);
    window.addEventListener("pasty:update", reload);
    return () => { live = false; window.removeEventListener("focus", reload); window.removeEventListener("pasty:update", reload); };
  }, []);

  const go = () => {
    const id = extractId(q);
    if (id.length !== 4) return toast.error("Enter a 4-character ID or paste link");
    setQ("");
    router.push(`/code/${id}`);
  };

  const join = () => {
    const code = joinCode.trim().toLowerCase();
    if (code.length !== 6) return toast.error("Enter a 6-character room code");
    setJoinCode("");
    router.push(`/room/${code}`);
  };

  const createRoom = async () => {
    if (roomBusy) return;
    setRoomBusy(true);
    try {
      const res = await api.createRoom({ name: "New Room", ttlHours: 24 });
      router.push(`/room/${res.data.code}`);
    } catch (e) {
      console.error("Create room failed:", e);
      toast.error(e?.message || "Could not create room");
    } finally {
      setRoomBusy(false);
    }
  };

  const deletePaste = async (id) => {
    if (deleting) return;
    if (!window.confirm(`Delete paste ${id}? Gone forever.`)) return;
    setDeleting(`paste:${id}`);
    try {
      await api.deleteGist(id);
      setPastes((prev) => prev.filter((g) => g.id !== id));
      if (expandedId === id) setExpandedId(null);
      pingLists();
      toast.success("Paste deleted");
      if (typeof window !== "undefined" && window.location.pathname === `/code/${id}`) router.push("/");
    } catch (e) {
      console.error("Delete paste failed:", e);
      toast.error(e?.message || "Could not delete paste");
    } finally {
      setDeleting(null);
    }
  };

  const deleteRoom = async (code) => {
    if (deleting) return;
    if (!window.confirm(`Delete room ${code}? All messages gone forever.`)) return;
    setDeleting(`room:${code}`);
    try {
      try {
        await api.deleteRoom(code);
      } catch (e) {
        // Room may already be expired on server — still drop it locally.
        console.warn("Server room delete failed, removing locally:", e?.message);
      }
      removeVisited(code);
      setRooms(getVisited());
      pingLists();
      toast.success("Room deleted");
      if (typeof window !== "undefined" && window.location.pathname === `/room/${code}`) router.push("/");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "var(--primary-color)", color: "var(--primary-ink)" }}>
            <ClipboardPaste className="h-4 w-4" />
          </span>
          <span className="text-base font-extrabold tracking-[0.2em]" style={{ color: "var(--foreground)" }}>PASTY</span>
        </Link>
        <div className="ms-auto flex items-center gap-1">
          <Link href="/" className="icon-btn" title="New paste" aria-label="New paste">
            <MessageSquarePlus className="h-5 w-5" />
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="sidebar-search">
        <div className="sidebar-search-row">
          <Search className="h-4 w-4 shrink-0 muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="Paste ID or link…"
            className="mono min-w-0 flex-1"
            aria-label="Find paste"
          />
        </div>
        <div className="sidebar-search-row">
          <Users className="h-4 w-4 shrink-0 muted" />
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && join()}
            placeholder="room code…"
            maxLength={6}
            className="mono min-w-0 flex-1"
            aria-label="Join room"
          />
          <button type="button" onClick={join} className="btn btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}>
            Join
          </button>
        </div>
        <button type="button" onClick={createRoom} disabled={roomBusy} className="btn btn-primary w-full" style={{ padding: "0.45rem", fontSize: "0.8rem" }}>
          {roomBusy ? "…" : "+ Room"}
        </button>
      </div>

      <div className="sidebar-list">
        <div className="sidebar-title">Pastes</div>
        {pastes.length === 0 && <div className="sidebar-empty">Nothing yet.</div>}
        {pastes.map((g) => {
          const open = expandedId === g.id;
          const link = typeof window !== "undefined" ? `${window.location.origin}/code/${g.id}` : `/code/${g.id}`;
          return (
            <div key={g.id} className="side-item-col">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setExpandedId(open ? null : g.id)} className="side-item min-w-0 flex-1 text-left" style={{ cursor: "pointer" }}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "var(--secondary-hover)", color: "var(--accent-color)" }}>
                    <Hash className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium" style={{ color: "var(--foreground)" }}>{g.title || "Untitled"}</span>
                    <span className="mono block truncate text-xs muted">{g.id} · {timeRemaining(g.expiresAt)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => deletePaste(g.id)}
                  disabled={deleting === `paste:${g.id}`}
                  className="icon-btn shrink-0"
                  aria-label={`Delete paste ${g.id}`}
                  title={`Delete paste ${g.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {open && (
                <div className="rise mb-1 ml-12 mr-1 space-y-2 rounded-lg p-2.5" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)" }}>
                  <IdBox label="Paste ID" value={g.id} toastMsg="ID copied!" />
                  <IdBox label="Paste link" value={link} toastMsg="Link copied!" />
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => copyText(link)} className="btn btn-ghost flex-1" style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}>
                      Copy link
                    </button>
                    <button type="button" onClick={() => router.push(`/code/${g.id}`)} className="btn btn-primary flex-1" style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}>
                      Open
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => deletePaste(g.id)}
                    disabled={deleting === `paste:${g.id}`}
                    className="btn btn-ghost w-full"
                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem", color: "var(--danger-color)" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {deleting === `paste:${g.id}` ? "Deleting…" : "Delete paste"}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div className="sidebar-title">Rooms</div>
        {rooms.length === 0 && <div className="sidebar-empty">No recent rooms.</div>}
        {rooms.map((r) => (
          <div key={r.code} className="flex items-center gap-1">
            <Link href={`/room/${r.code}`} className="side-item min-w-0 flex-1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: "var(--secondary-hover)", color: "var(--primary-color)" }}>
                {(r.name || "R").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium" style={{ color: "var(--foreground)" }}>{r.name || r.code}</span>
                <span className="mono block truncate text-xs muted">{r.code}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => deleteRoom(r.code)}
              disabled={deleting === `room:${r.code}`}
              className="icon-btn shrink-0"
              aria-label={`Delete room ${r.code}`}
              title={`Delete room ${r.code}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

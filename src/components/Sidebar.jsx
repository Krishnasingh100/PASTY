"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardPaste, Hash, MessageSquarePlus, Search, Users } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import { extractId, timeRemaining } from "@/lib/format.js";
import { getVisited } from "@/lib/visited.js";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Sidebar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomBusy, setRoomBusy] = useState(false);
  const [pastes, setPastes] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    let live = true;
    api.listGists(1, 8).then((r) => live && setPastes(r.data || [])).catch(() => {});
    setRooms(getVisited());
    const onFocus = () => live && setRooms(getVisited());
    window.addEventListener("focus", onFocus);
    return () => { live = false; window.removeEventListener("focus", onFocus); };
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
        {pastes.map((g) => (
          <Link key={g.id} href={`/code/${g.id}`} className="side-item">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "var(--secondary-hover)", color: "var(--accent-color)" }}>
              <Hash className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium" style={{ color: "var(--foreground)" }}>{g.title || "Untitled"}</span>
              <span className="mono block truncate text-xs muted">{g.id} · {timeRemaining(g.expiresAt)}</span>
            </span>
          </Link>
        ))}

        <div className="sidebar-title">Rooms</div>
        {rooms.length === 0 && <div className="sidebar-empty">No recent rooms.</div>}
        {rooms.map((r) => (
          <Link key={r.code} href={`/room/${r.code}`} className="side-item">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: "var(--secondary-hover)", color: "var(--primary-color)" }}>
              {(r.name || "R").slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium" style={{ color: "var(--foreground)" }}>{r.name || r.code}</span>
              <span className="mono block truncate text-xs muted">{r.code}</span>
            </span>
          </Link>
        ))}
      </div>
    </aside>
  );
}

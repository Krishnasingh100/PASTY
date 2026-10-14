"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardPaste, Menu, Search } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import { peekRoomNum, commitRoomNum } from "@/lib/visited.js";
import ThemeToggle from "./ThemeToggle.jsx";

export default function MobileBar({ onMenu }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const createRoom = async () => {
    if (busy) return;
    setBusy(true);
    const num = peekRoomNum();
    try {
      const res = await api.createRoom({ name: `Room ${num}`, ttlHours: 24 });
      commitRoomNum(num);
      router.push(`/room/${res.data.code}`);
    } catch (e) {
      console.error("Create room failed:", e);
      toast.error(e?.message || "Could not create room");
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="mobilebar">
      {onMenu && (
        <button type="button" onClick={onMenu} className="icon-btn shrink-0" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      )}
      <Link href="/" className="flex shrink-0 items-center gap-1.5" style={{ textDecoration: "none" }}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: "var(--primary-color)", color: "var(--primary-ink)" }}>
          <ClipboardPaste className="h-3.5 w-3.5" />
        </span>
        <span className="hidden text-sm font-extrabold tracking-[0.2em] min-[380px]:inline" style={{ color: "var(--foreground)" }}>PASTY</span>
      </Link>
      <div className="ms-auto flex min-w-0 items-center gap-1">
        <Link href="/recent" className="icon-btn" aria-label="Find a paste">
          <Search className="h-4 w-4" />
        </Link>
        <ThemeToggle />
        <button type="button" onClick={createRoom} disabled={busy} className="btn btn-primary" style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem" }}>
          {busy ? "…" : "+ Room"}
        </button>
      </div>
    </header>
  );
}

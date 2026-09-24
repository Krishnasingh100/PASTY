"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardPaste, Search } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import ThemeToggle from "./ThemeToggle.jsx";

export default function MobileBar() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const createRoom = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.createRoom({ name: "New Room", ttlHours: 24 });
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
      <Link href="/" className="flex items-center gap-1.5" style={{ textDecoration: "none" }}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: "var(--primary-color)", color: "var(--primary-ink)" }}>
          <ClipboardPaste className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm font-extrabold tracking-[0.2em]" style={{ color: "var(--foreground)" }}>PASTY</span>
      </Link>
      <div className="ms-auto flex items-center gap-1">
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

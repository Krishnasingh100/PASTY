"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardPaste, Search, Users } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import ThemeToggle from "@/components/ThemeToggle.jsx";

export default function Navbar() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  const join = () => {
    const code = joinCode.trim().toLowerCase();
    if (code.length !== 6) {
      toast.error("Enter a 6-character room code");
      return;
    }
    router.push(`/room/${code}`);
    setJoinCode("");
  };

  const createRoom = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.createRoom({ name: "New Room", ttlHours: 24 });
      toast.success(`Room ready: ${res.data.code}`);
      router.push(`/room/${res.data.code}`);
    } catch (e) {
      console.error("Create room failed:", e);
      toast.error(e?.message || "Could not create room. Check server log.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="sticky top-0 z-40" style={{ backgroundColor: "var(--card-bg)", borderBottom: "1px solid var(--border-color)" }}>
      <div className="wrap" style={{ paddingTop: "0.55rem", paddingBottom: "0.55rem" }}>
        <div className="flex items-center gap-2">
          <Link href="/" className="flex shrink-0 items-center gap-2" style={{ textDecoration: "none" }}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: "var(--primary-color)", color: "var(--primary-ink)" }}>
              <ClipboardPaste className="h-4 w-4" />
            </span>
            <span className="hidden text-base font-extrabold tracking-[0.2em] xs:inline sm:inline" style={{ color: "var(--foreground)" }}>
              PASTY
            </span>
          </Link>

          <div className="ms-auto flex min-w-0 items-center gap-1.5">
            <Link href="/recent" className="icon-btn shrink-0" title="Find a paste" aria-label="Find a paste">
              <Search className="h-4 w-4" />
            </Link>
            <ThemeToggle />
            <span className="hidden h-5 w-px shrink-0 sm:inline-block" style={{ backgroundColor: "var(--border-color)" }} />
            <Users className="hidden h-4 w-4 shrink-0 sm:inline" style={{ color: "var(--muted-foreground)" }} />
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && join()}
              placeholder="room code"
              maxLength={6}
              aria-label="Room code"
              className="field mono min-w-0 w-20 sm:w-24"
              style={{ padding: "0.4rem 0.6rem" }}
            />
            <button type="button" onClick={join} className="btn btn-ghost shrink-0" style={{ padding: "0.4rem 0.7rem" }}>
              Join
            </button>
            <button type="button" onClick={createRoom} disabled={busy} className="btn btn-primary shrink-0" style={{ padding: "0.4rem 0.7rem" }} title="Create a room">
              {busy ? "…" : "+ Room"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

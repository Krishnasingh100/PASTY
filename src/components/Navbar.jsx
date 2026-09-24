"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";

export default function Navbar() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  const join = () => {
    if (joinCode.length !== 6) return toast.error("Enter a 6-character room code");
    router.push(`/room/${joinCode.toLowerCase()}`);
  };

  const createRoom = async () => {
    setBusy(true);
    try {
      const res = await api.createRoom({ name: "New Room", ttlHours: 168 });
      toast.success(`Room created: ${res.data.code}`);
      router.push(`/room/${res.data.code}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: "rgba(10,10,10,0.85)", backdropFilter: "blur(10px)", borderColor: "var(--border-color)" }}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
        <Link href="/" className="mr-auto text-xl font-bold tracking-[0.35em]" style={{ color: "var(--primary-color)", textDecoration: "none" }}>
          PASTY
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/" className="rounded-md px-3 py-1.5" style={{ color: "var(--foreground)", textDecoration: "none", border: "1px solid transparent" }}>
            Create
          </Link>
          <Link href="/recent" className="rounded-md px-3 py-1.5" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>
            Search
          </Link>
        </nav>
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && join()}
            placeholder="room code"
            maxLength={6}
            className="w-24 rounded-md px-2 py-1.5 font-mono text-sm focus:outline-none"
            style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--foreground)" }}
          />
          <button
            onClick={join}
            className="rounded-md px-2.5 py-1.5 text-sm transition-colors"
            style={{ backgroundColor: "var(--secondary-color)", color: "var(--foreground)", border: "1px solid var(--border-color)", cursor: "pointer" }}
          >
            Join
          </button>
          <button
            onClick={createRoom}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm transition-colors"
            style={{ backgroundColor: "var(--primary-color)", color: "#fff", border: "none", cursor: busy ? "not-allowed" : "pointer" }}
          >
            <Plus className="h-3.5 w-3.5" />
            {busy ? "…" : "Room"}
          </button>
        </div>
      </div>
    </header>
  );
}

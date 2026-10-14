"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock3, Search, Users } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import { extractId, timeRemaining } from "@/lib/format.js";
import { peekRoomNum, commitRoomNum } from "@/lib/visited.js";

export default function SearchPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [roomBusy, setRoomBusy] = useState(false);
  const [latest, setLatest] = useState([]);
  const [latestError, setLatestError] = useState("");

  useEffect(() => {
    api.listGists(1, 10).then((r) => setLatest(r.data || [])).catch((e) => setLatestError(e.message));
  }, []);

  const search = async () => {
    const id = extractId(value);
    if (id.length !== 4) {
      toast.error("Enter a 4-character ID");
      return;
    }
    setBusy(true);
    try {
      const res = await api.searchGist(id);
      if (!res?.data?.id) throw new Error("Not found");
      router.push(`/code/${res.data.id}`);
    } catch (e) {
      console.error("Search failed:", e);
      toast.error(e?.message || "Paste not found or expired");
    } finally {
      setBusy(false);
    }
  };

  const join = () => {
    const code = joinCode.trim().toLowerCase();
    if (code.length !== 6) return toast.error("Enter a 6-character room code");
    router.push(`/room/${code}`);
  };

  const createRoom = async () => {
    if (roomBusy) return;
    setRoomBusy(true);
    const num = peekRoomNum();
    try {
      const res = await api.createRoom({ name: `Room ${num}`, ttlHours: 24 });
      commitRoomNum(num);
      router.push(`/room/${res.data.code}`);
    } catch (e) {
      console.error("Create room failed:", e);
      toast.error(e?.message || "Could not create room");
    } finally {
      setRoomBusy(false);
    }
  };

  return (
    <div className="rise mx-auto w-full max-w-2xl space-y-5">
      <div className="text-center">
        <h1 className="text-xl font-extrabold sm:text-2xl" style={{ color: "var(--foreground)" }}>Open a paste</h1>
        <p className="text-sm muted">Type the 4-character ID.</p>
      </div>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="a3f9"
            autoFocus
            className="field mono"
            aria-label="Paste ID"
          />
          <button type="button" onClick={search} disabled={busy} className="btn btn-primary sm:w-auto">
            <Search className="h-4 w-4" /> {busy ? "…" : "Open"}
          </button>
        </div>
        <p className="mt-2 text-xs muted">Each paste has a 4-character ID — find it in the box under the paste.</p>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider muted">
          <Users className="h-4 w-4" /> Rooms
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && join()}
            placeholder="6-character room code"
            maxLength={6}
            className="field mono"
            aria-label="Room code"
          />
          <div className="flex gap-2">
            <button type="button" onClick={join} className="btn btn-ghost flex-1 sm:flex-none">Join</button>
            <button type="button" onClick={createRoom} disabled={roomBusy} className="btn btn-primary flex-1 sm:flex-none">
              {roomBusy ? "…" : "+ Room"}
            </button>
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider muted">Latest pastes</h2>
        {latestError ? (
          <p className="text-sm muted">Could not load list: {latestError}</p>
        ) : latest.length === 0 ? (
          <p className="text-sm muted">No pastes yet — create the first one.</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border-color)" }}>
            {latest.map((g) => (
              <li key={g.id}>
                <Link href={`/code/${g.id}`} className="flex items-center gap-2 py-2.5" style={{ textDecoration: "none", color: "var(--foreground)" }}>
                  <span className="chip mono">{g.id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{g.title || "Untitled"}</span>
                  <span className="hidden shrink-0 items-center gap-1 text-xs muted sm:inline-flex">
                    <Clock3 className="h-3 w-3" />{timeRemaining(g.expiresAt)}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "var(--primary-color)" }} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

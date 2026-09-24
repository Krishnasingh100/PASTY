"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api.js";
import { extractId } from "@/lib/format.js";

export default function SearchPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const search = async () => {
    const id = extractId(value);
    if (id.length !== 4) return toast.error("Enter a 4-character paste ID");
    setBusy(true);
    try {
      const res = await api.searchGist(id);
      router.push(`/code/${res.data.id}`);
    } catch {
      toast.error("Paste not found or expired");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rise space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Find a paste</h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Enter the 4-character ID or paste a full link.</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors"
          style={{ backgroundColor: "var(--secondary-color)", color: "var(--foreground)", border: "1px solid var(--border-color)", cursor: "pointer" }}
        >
          <ArrowLeft className="h-4 w-4" /> New paste
        </button>
      </div>

      <section className="rounded-lg p-4 sm:p-5" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="e.g. a3f9 or https://…/code/a3f9"
            autoFocus
            className="w-full rounded-md px-3 py-2 font-mono text-sm focus:outline-none"
            style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--foreground)" }}
          />
          <button
            onClick={search}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{ backgroundColor: busy ? "var(--muted-foreground)" : "var(--primary-color)", color: "#fff", border: "none", cursor: busy ? "not-allowed" : "pointer" }}
          >
            <Search className="h-4 w-4" /> {busy ? "…" : "Search"}
          </button>
        </div>
      </section>
    </div>
  );
}

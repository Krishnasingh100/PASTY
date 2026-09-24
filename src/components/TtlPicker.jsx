"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { formatTTL } from "@/lib/format.js";

export default function TtlPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors"
        style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--foreground)", cursor: "pointer" }}
      >
        <Clock className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
        {formatTTL(value)}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1.5 rounded-lg px-4 py-3" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)", width: 220 }}>
          <div className="mb-2 text-center text-sm font-medium" style={{ color: "var(--foreground)" }}>{formatTTL(value)}</div>
          <input type="range" min={1} max={168} value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} className="w-full cursor-pointer" />
          <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span>1h</span>
            <span>7d</span>
          </div>
        </div>
      )}
    </div>
  );
}

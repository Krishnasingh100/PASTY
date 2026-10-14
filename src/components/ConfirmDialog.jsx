"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Delete", busy = false, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={() => !busy && onCancel?.()}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="rise w-full max-w-sm rounded-2xl p-5"
        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--danger-color)", opacity: 0.15 }}
          >
            <AlertTriangle className="h-5 w-5" style={{ color: "var(--danger-color)" }} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>{title}</h2>
            <p className="mt-1 text-sm muted">{message}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="btn btn-primary flex-1"
            style={{ backgroundColor: "var(--danger-color)", borderColor: "var(--danger-color)" }}
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

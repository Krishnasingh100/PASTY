"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/format.js";

// Single contrast box for every ID / link / code in the app.
// Black theme -> white box, black text. Light theme -> black box, white text.
// Always carries a copy icon.
export default function IdBox({ label, value, toastMsg, mono = true, truncate = false }) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const doCopy = async () => {
    await copyText(value, toastMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="idbox-wrap">
      {label && <div className="idbox-label">{label}</div>}
      <div className="idbox" role="group" aria-label={label || value}>
        <span className={`idbox-value${mono ? " mono" : ""}${truncate ? " idbox-truncate" : ""}`} title={value}>
          {value}
        </span>
        <button
          type="button"
          onClick={doCopy}
          className="idbox-copy"
          aria-label={`Copy ${label || "value"}`}
          title={`Copy ${label || "value"}`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

"use client";

import CodeBlock from "./CodeBlock.jsx";
import { formatSize } from "@/lib/format.js";

// Big live preview above composer: what you type is what gets sent.
export default function PendingPreview({ code = "", screenshots = [], files = [] }) {
  const hasCode = code.trim().length > 0;
  const total = [...screenshots, ...files].reduce((s, f) => s + f.size, 0);
  if (!hasCode && screenshots.length === 0 && files.length === 0) return null;

  return (
    <div className="bubble bubble-out rise" style={{ maxWidth: "100%", opacity: 0.95 }}>
      <div className="bubble-name" style={{ color: "inherit", opacity: 0.75 }}>Preview — not sent yet</div>
      {hasCode && (
        <div className="mt-1">
          <CodeBlock code={code} langLabel="preview" />
        </div>
      )}
      {(screenshots.length > 0 || files.length > 0) && (
        <div className="mt-1.5 text-xs" style={{ opacity: 0.85 }}>
          {[...screenshots, ...files].map((f) => f.name).join(", ")} · {formatSize(total)}
        </div>
      )}
      <div className="bubble-meta"><span>preview</span></div>
    </div>
  );
}

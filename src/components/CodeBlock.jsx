"use client";

import { useMemo, useState } from "react";
import hljs from "highlight.js/lib/common";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/format.js";

export default function CodeBlock({ code, langLabel = "code" }) {
  const [copied, setCopied] = useState(false);

  const { html, lang } = useMemo(() => {
    try {
      const auto = hljs.highlightAuto(code || "", hljs.listLanguages());
      return { html: auto.value, lang: auto.language || langLabel };
    } catch {
      return { html: null, lang: langLabel };
    }
  }, [code, langLabel]);

  const copy = async () => {
    await copyText(code, "Code copied!");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="code-shell">
      <div className="code-bar">
        <span className="mono">{lang}</span>
        <button type="button" onClick={copy} className="icon-btn" style={{ padding: "0.3rem", color: "#9fb3c8" }} aria-label="Copy code">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      {html ? (
        <pre style={{ margin: 0, padding: "0.6rem 0.75rem", overflowX: "auto" }}>
          <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      ) : (
        <pre style={{ margin: 0, padding: "0.6rem 0.75rem", overflowX: "auto" }}>
          <code className="hljs">{code}</code>
        </pre>
      )}
    </div>
  );
}

"use client";

import { Download, X } from "lucide-react";

export default function Lightbox({ src, name, onClose, onDownload }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <button className="absolute right-4 top-4 rounded-full p-2" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">
        <X className="h-6 w-6" />
      </button>
      {onDownload && (
        <button className="absolute right-16 top-4 rounded-full p-2" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onDownload(); }} aria-label="Download">
          <Download className="h-6 w-6" />
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name || "preview"} className="max-h-[90vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

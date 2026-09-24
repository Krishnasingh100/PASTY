"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Sunset } from "lucide-react";

const ORDER = ["grape", "light", "sunset"];
const ICONS = { grape: Moon, light: Sun, sunset: Sunset };
const LABELS = { grape: "Grape dark", light: "Light", sunset: "Sunset dark" };

export default function ThemeToggle() {
  const [theme, setTheme] = useState("grape");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pasty-theme");
      const next = ORDER.includes(saved) ? saved : "grape";
      setTheme(next);
      document.documentElement.dataset.theme = next;
    } catch {}
  }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("pasty-theme", next);
    } catch {}
  };

  const Icon = ICONS[theme] || Moon;
  return (
    <button
      type="button"
      onClick={cycle}
      className="icon-btn"
      title={`${LABELS[theme] || "Grape dark"} — tap for next theme`}
      aria-label="Change theme"
      style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--secondary-color)", color: "var(--foreground)" }}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Waves } from "lucide-react";

const ORDER = ["dark", "light", "ocean"];
const ICONS = { dark: Moon, light: Sun, ocean: Waves };
const LABELS = { dark: "Dark", light: "Light", ocean: "Ocean" };

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pasty-theme");
      if (saved && ORDER.includes(saved)) {
        setTheme(saved);
        document.documentElement.dataset.theme = saved;
      } else {
        document.documentElement.dataset.theme = "dark";
      }
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

  const Icon = ICONS[theme];
  return (
    <button
      type="button"
      onClick={cycle}
      className="icon-btn"
      title={`Theme: ${LABELS[theme]} — tap to change`}
      aria-label={`Theme: ${LABELS[theme]}`}
      style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--secondary-color)", color: "var(--foreground)" }}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

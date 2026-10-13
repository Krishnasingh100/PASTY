"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pasty-theme");
      const next = saved === "black" ? "black" : "light";
      setTheme(next);
      document.documentElement.dataset.theme = next;
    } catch {}
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "black" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("pasty-theme", next);
    } catch {}
  };

  const Icon = theme === "light" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={toggle}
      className="icon-btn"
      title={theme === "light" ? "Switch to black" : "Switch to light"}
      aria-label={theme === "light" ? "Switch to black" : "Switch to light"}
      style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--secondary-color)", color: "var(--foreground)" }}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

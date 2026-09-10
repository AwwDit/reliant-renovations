"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useEffect } from "react";

const storageKey = "reliant-theme";

export function ThemeToggle() {
  useEffect(() => {
    // Match the pre-hydration initializer, including the default dark theme.
    const restore = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        document.documentElement.dataset.theme =
          saved === "dark" || saved === "light" ? saved : "dark";
      } catch {
        // The current-page toggle also works when browser storage is blocked.
      }
    };
    restore();
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) restore();
    };
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
    };
  }, []);

  function toggle() {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Persistence is optional; changing the displayed theme is not.
    }
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggle}>
      <span className="theme-toggle-light">
        <Moon size={20} weight="regular" aria-hidden="true" />
        <span className="sr-only">Switch to dark mode</span>
      </span>
      <span className="theme-toggle-dark">
        <Sun size={20} weight="regular" aria-hidden="true" />
        <span className="sr-only">Switch to light mode</span>
      </span>
    </button>
  );
}

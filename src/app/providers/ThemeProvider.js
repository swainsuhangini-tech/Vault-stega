import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { db } from "../../database/db";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const settings = await db.settings.get(1);
        if (mounted && settings?.theme) setTheme(settings.theme);
      } catch (e) {
        // IndexedDB may be unavailable (private mode); fall back silently.
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(async () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      db.settings.update(1, { theme: next }).catch(() => {});
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type ThemeMode = "auto" | "light" | "night";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "auto",
  setMode: () => {},
  isDark: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [isDark, setIsDark] = useState(false);

  const applyTheme = useCallback((m: ThemeMode) => {
    const dark =
      m === "night" ||
      (m === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("night", dark);
    setIsDark(dark);
  }, []);

  const setMode = useCallback(
    (m: ThemeMode) => {
      setModeState(m);
      localStorage.setItem("grounded-theme", m);
      applyTheme(m);
    },
    [applyTheme]
  );

  useEffect(() => {
    const stored = localStorage.getItem("grounded-theme") as ThemeMode | null;
    const initial = stored || "auto";
    setModeState(initial);
    applyTheme(initial);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = (localStorage.getItem("grounded-theme") as ThemeMode) || "auto";
      if (current === "auto") applyTheme("auto");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

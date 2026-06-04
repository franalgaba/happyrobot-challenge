import { useCallback, useSyncExternalStore } from "react";
import { THEME_META_COLOR } from "./lib/theme-meta";

export type Theme = "light" | "dark";

const STORAGE_KEY = "hr-dashboard-theme";
const THEME_COLOR: Record<Theme, string> = {
  light: THEME_META_COLOR.light,
  dark: THEME_META_COLOR.dark,
};
const listeners = new Set<() => void>();

function emitThemeChange() {
  listeners.forEach((listener) => listener());
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const onSystemPreferenceChange = () => {
    if (getStoredTheme()) return;
    applyTheme(getSystemTheme());
  };

  listeners.add(onStoreChange);
  media.addEventListener("change", onSystemPreferenceChange);

  return () => {
    listeners.delete(onStoreChange);
    media.removeEventListener("change", onSystemPreferenceChange);
  };
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);

  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);

  emitThemeChange();
}

export function useTheme(): {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
} {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, (): Theme => "light");

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}

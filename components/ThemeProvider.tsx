"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { isMyEventPublicHost } from "@/lib/my-event/domains";
import { shouldSkipMarketplaceDocumentTheme } from "@/lib/theme-surfaces";

export type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "bilitmall-theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return getSystemTheme();
}

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
}

function clearDocumentTheme() {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
}

function getBrowserHost(): string {
  if (typeof window === "undefined") return "";
  return window.location.host.split(":")[0]?.toLowerCase() ?? "";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [host, setHost] = useState("");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setHost(getBrowserHost());
    setThemeState(readStoredTheme());
  }, []);

  const onOrganizerPublicHost = host !== "" && isMyEventPublicHost(host);
  const skipDocumentTheme =
    shouldSkipMarketplaceDocumentTheme(pathname) || onOrganizerPublicHost;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
    if (skipDocumentTheme) {
      clearDocumentTheme();
      return;
    }
    applyThemeClass(theme);
  }, [theme, skipDocumentTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

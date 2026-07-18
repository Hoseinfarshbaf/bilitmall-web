"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isMyEventPublicHost } from "@/lib/my-event/domains";
import { shouldSkipMarketplaceDocumentTheme } from "@/lib/theme-surfaces";

type Theme = "light" | "dark";

type MyEventThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "myevent-theme";
const ROOT_ID = "my-event-theme-root";

const MyEventThemeContext = createContext<MyEventThemeContextType | undefined>(
  undefined
);

function clearMarketplaceDocumentTheme() {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
}

function restoreMarketplaceDocumentTheme() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "";
  const host = window.location.host.split(":")[0]?.toLowerCase() ?? "";
  if (
    shouldSkipMarketplaceDocumentTheme(path) ||
    isMyEventPublicHost(host)
  ) {
    clearMarketplaceDocumentTheme();
    return;
  }
  const stored = window.localStorage.getItem("bilitmall-theme");
  const dark =
    stored === "dark" ||
    (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

/** تم استودیو فقط روی ریشهٔ My Event — بدون آلوده کردن html مارکت‌پلیس. */
function applyThemeClass(theme: Theme) {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  root.classList.toggle("dark", theme === "dark");
}

export default function MyEventThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next: Theme = stored === "dark" ? "dark" : "light";
    setThemeState(next);
  }, []);

  useEffect(() => {
    clearMarketplaceDocumentTheme();
    return () => {
      restoreMarketplaceDocumentTheme();
    };
  }, []);

  useEffect(() => {
    clearMarketplaceDocumentTheme();
    applyThemeClass(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    clearMarketplaceDocumentTheme();
    applyThemeClass(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      clearMarketplaceDocumentTheme();
      applyThemeClass(next);
      return next;
    });
  }, []);

  return (
    <MyEventThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </MyEventThemeContext.Provider>
  );
}

export function useMyEventTheme() {
  const context = useContext(MyEventThemeContext);
  if (!context) {
    throw new Error("useMyEventTheme must be used within a MyEventThemeProvider");
  }
  return context;
}

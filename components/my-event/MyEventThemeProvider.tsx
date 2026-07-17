"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type MyEventThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "myevent-theme";
const SITE_STORAGE_KEY = "bilitmall-theme";

const MyEventThemeContext = createContext<MyEventThemeContextType | undefined>(
  undefined
);

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : "light";
}

function readSiteTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(SITE_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** تم استودیو باید روی html اعمال شود؛ در غیر این صورت dark سراسری همیشه برنده است. */
function applyDocumentTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
}

export default function MyEventThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyDocumentTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);

    return () => {
      applyDocumentTheme(readSiteTheme());
    };
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyDocumentTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      applyDocumentTheme(next);
      return next;
    });
  }, []);

  return (
    <MyEventThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div
        id="my-event-theme-root"
        className={theme === "dark" ? "dark" : undefined}
        suppressHydrationWarning
      >
        {children}
      </div>
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

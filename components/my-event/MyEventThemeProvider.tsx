"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark";

type MyEventThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "myevent-theme";

const MyEventThemeContext = createContext<MyEventThemeContextType | undefined>(
  undefined
);

export default function MyEventThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      setThemeState(stored);
    }
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <MyEventThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div className={theme === "dark" ? "dark" : undefined}>{children}</div>
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

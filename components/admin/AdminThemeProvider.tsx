"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Moon, Sun } from "lucide-react";
import { isMyEventPublicHost } from "@/lib/my-event/domains";
import { shouldSkipMarketplaceDocumentTheme } from "@/lib/theme-surfaces";

type Theme = "light" | "dark";

type AdminThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "admin-theme";
const ROOT_ID = "admin-theme-root";

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(
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

/** کلاس dark فقط روی ریشهٔ پنل ادمین — html مارکت‌پلیس را خالی نگه می‌داریم. */
function applyThemeClass(theme: Theme) {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  root.classList.toggle("dark", theme === "dark");
}

export function AdminThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setThemeState(stored === "dark" ? "dark" : "light");
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
    <AdminThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used within an AdminThemeProvider");
  }
  return context;
}

export function AdminThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "روشن کردن تم" : "تیره کردن تم"}
      title={isDark ? "تم روشن" : "تم تیره"}
      className="fixed bottom-6 left-6 z-50 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-lg transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-blue-600" />
      )}
      <span>{isDark ? "تم روشن" : "تم تیره"}</span>
    </button>
  );
}

"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
};

export default function ThemeToggle({
  className,
  showLabel = true,
  size = "md",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const sizeClass =
    size === "sm"
      ? "h-9 gap-1.5 px-2.5 text-xs"
      : "h-10 gap-2 px-3 text-sm";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "فعال‌کردن تم روشن" : "فعال‌کردن تم تیره"}
      title={isDark ? "تم روشن" : "تم تیره"}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full border font-bold transition-all duration-200",
        "border-neutral-200 bg-white text-neutral-700 shadow-sm",
        "hover:border-red-200 hover:bg-red-50 hover:text-red-600",
        "dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
        "dark:hover:border-red-500/40 dark:hover:bg-neutral-800 dark:hover:text-red-400",
        sizeClass,
        className
      )}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <Sun
          className={cn(
            "absolute h-4 w-4 text-amber-500 transition-all duration-200",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )}
          aria-hidden
        />
        <Moon
          className={cn(
            "absolute h-4 w-4 text-sky-400 transition-all duration-200",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )}
          aria-hidden
        />
      </span>
      {showLabel ? (
        <span className="hidden sm:inline">{isDark ? "تم روشن" : "تم تیره"}</span>
      ) : null}
    </button>
  );
}

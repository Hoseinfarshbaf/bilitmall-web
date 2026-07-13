"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastAction = {
  label: string;
  href: string;
};

type ToastItem = {
  id: number;
  message: string;
  action?: ToastAction;
};

type ShowToastOptions = {
  action?: ToastAction;
  durationMs?: number;
};

type ToastContextType = {
  showToast: (message: string, options?: ShowToastOptions) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options?: ShowToastOptions) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const toast: ToastItem = {
        id,
        message,
        action: options?.action,
      };

      setToasts((current) => [...current, toast]);

      const timer = setTimeout(() => {
        dismissToast(id);
      }, options?.durationMs ?? 4500);
      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-800 shadow-lg",
              "animate-in fade-in slide-in-from-bottom-2 duration-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            )}
          >
            <p className="flex-1 leading-6">{toast.message}</p>
            {toast.action ? (
              <Link
                href={toast.action.href}
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
              >
                {toast.action.label}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

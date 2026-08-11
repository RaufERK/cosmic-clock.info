"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, X } from "lucide-react";

export type ToastVariant = "error" | "success";

export type ToastMessage = {
  id: number;
  text: string;
  variant: ToastVariant;
};

type Props = {
  toast: ToastMessage | null;
  onDismiss: () => void;
  /** Auto-hide after ms; default 4500. */
  durationMs?: number;
};

export function Toast({ toast, onDismiss, durationMs = 4500 }: Props) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss, durationMs]);

  const isError = toast?.variant === "error";

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {toast ? (
          <motion.div
            key={toast.id}
            role={isError ? "alert" : "status"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={
              isError
                ? "pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl border border-rose-500/50 bg-rose-900/95 px-6 py-3.5 text-base font-bold text-rose-100 shadow-2xl shadow-rose-950/80 backdrop-blur-xl"
                : "pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/95 px-6 py-3.5 text-base font-bold text-emerald-100 shadow-2xl shadow-emerald-950/80 backdrop-blur-xl"
            }
          >
            {isError ? (
              <AlertCircle
                className="h-4 w-4 flex-shrink-0 text-rose-400"
                aria-hidden
              />
            ) : null}
            <p className="flex-1 leading-snug tracking-wide">{toast.text}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

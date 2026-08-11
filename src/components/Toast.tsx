"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

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
      className="pointer-events-none fixed inset-x-0 bottom-8 z-[60] flex justify-center px-4 sm:bottom-10"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {toast ? (
          <motion.div
            key={toast.id}
            role={isError ? "alert" : "status"}
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="pointer-events-auto flex max-w-lg items-start gap-3 rounded-2xl border border-[#e8a0b4]/35 bg-[#6b0f2a]/95 px-5 py-4 text-white shadow-[0_12px_40px_rgba(80,8,28,0.55)] backdrop-blur-xl"
          >
            <p className="flex-1 text-base leading-snug font-bold tracking-wide sm:text-lg">
              {toast.text}
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

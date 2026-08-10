"use client";

import { FormEvent, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  loginAction,
  registerAction,
  type AuthActionResult,
} from "@/lib/auth-actions";

type Props = {
  mode: "login" | "register";
  onClose: () => void;
  onSuccess: () => void;
};

export function AuthModal({ mode: initialMode, onClose, onSuccess }: Props) {
  const t = useTranslations("app");
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function errorMessage(result: AuthActionResult): string {
    if (result.ok) return "";
    switch (result.error) {
      case "invalid":
        return t("authErrorInvalid");
      case "mismatch":
        return t("authErrorMismatch");
      case "taken":
        return t("authErrorTaken");
      case "weak":
        return t("authErrorWeak");
      case "unknown":
        return t("authErrorUnknown");
      default: {
        const _exhaustive: never = result.error;
        return _exhaustive;
      }
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result =
        mode === "register"
          ? await registerAction(email, password, confirm)
          : await loginAction(email, password);

      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }

      onSuccess();
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-[2rem] border border-indigo-400/20 bg-indigo-950/80 p-8 shadow-2xl shadow-indigo-950 backdrop-blur-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4 text-white/50" />
          </button>

          <h2 className="mb-6 text-xl font-bold tracking-wide text-white">
            {mode === "login" ? t("login") : t("register")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-white/70">
                {t("email")}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white transition-all placeholder:text-white/40 focus:border-blue-400/60 focus:bg-white/15 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-white/70">
                {t("password")}
              </label>
              <input
                type="password"
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white transition-all placeholder:text-white/40 focus:border-blue-400/60 focus:bg-white/15 focus:outline-none"
              />
            </div>

            {mode === "register" ? (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-white/70">
                  {t("confirmPassword")}
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white transition-all placeholder:text-white/40 focus:border-blue-400/60 focus:bg-white/15 focus:outline-none"
                />
              </div>
            ) : null}

            {error ? (
              <p className="text-sm font-medium text-red-300" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 w-full rounded-2xl bg-white py-3 font-bold text-black transition-all hover:bg-blue-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending
                ? t("authPending")
                : mode === "login"
                  ? t("login")
                  : t("register")}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-white/55">
            {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
            >
              {mode === "login" ? t("register") : t("login")}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

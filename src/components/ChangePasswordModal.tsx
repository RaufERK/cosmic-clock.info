"use client";

import { FormEvent, useId, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  changePasswordAction,
  type AuthActionResult,
} from "@/lib/auth-actions";

type Props = {
  login: string;
  onClose: () => void;
};

export function ChangePasswordModal({ login, onClose }: Props) {
  const t = useTranslations("app");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const currentId = useId();
  const newId = useId();
  const confirmId = useId();

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
      case "wrong_password":
        return t("authErrorWrongPassword");
      case "unauthorized":
        return t("authErrorUnauthorized");
      case "rate_limited":
        return t("authErrorRateLimited");
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
    setSuccess(false);

    startTransition(async () => {
      const result = await changePasswordAction(
        currentPassword,
        newPassword,
        confirm,
      );
      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    });
  }

  const fieldClass =
    "w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white transition-all placeholder:text-white/40 focus:border-blue-400/60 focus:bg-white/15 focus:outline-none";

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
            aria-label={t("formCancel")}
            className="absolute top-5 right-5 rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4 text-white/50" aria-hidden />
          </button>

          <h2 className="mb-1 text-xl font-bold tracking-wide text-white">
            {t("changePasswordTitle")}
          </h2>
          <p className="mb-6 truncate text-sm text-white/50">{login}</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor={currentId}
                className="text-xs font-bold uppercase tracking-widest text-white/70"
              >
                {t("currentPassword")}
              </label>
              <input
                id={currentId}
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor={newId}
                className="text-xs font-bold uppercase tracking-widest text-white/70"
              >
                {t("newPassword")}
              </label>
              <input
                id={newId}
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor={confirmId}
                className="text-xs font-bold uppercase tracking-widest text-white/70"
              >
                {t("confirmNewPassword")}
              </label>
              <input
                id={confirmId}
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={fieldClass}
              />
            </div>

            {error ? (
              <p className="text-sm font-medium text-red-300" role="alert">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="text-sm font-medium text-emerald-300" role="status">
                {t("changePasswordSuccess")}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 w-full rounded-2xl bg-white py-3 font-bold text-black transition-all hover:bg-blue-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? t("authPending") : t("changePasswordSubmit")}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

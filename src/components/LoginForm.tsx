"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  clearDemoSession,
  readDemoSession,
  writeDemoSession,
} from "@/lib/demo-auth";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("demo@cosmic-clock.info");
  const [password, setPassword] = useState("demo");
  const session = readDemoSession();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    writeDemoSession({ email: email.trim() || "demo@cosmic-clock.info" });
    router.push("/cards");
    router.refresh();
  }

  function onLogout() {
    clearDemoSession();
    router.refresh();
  }

  if (session) {
    return (
      <div className="mt-8 space-y-4 text-center">
        <p className="text-white/70">
          {t("demoUser")}: <span className="text-blue-300">{session.email}</span>
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-2xl border border-white/15 bg-white/5 py-3.5 font-semibold text-white/80 hover:border-blue-500/30 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block text-left text-sm text-white/50">
        {t("email")}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-blue-500/50"
        />
      </label>
      <label className="block text-left text-sm text-white/50">
        {t("password")}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-blue-500/50"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-2xl bg-white py-3.5 font-bold text-black hover:bg-blue-50 transition-colors"
      >
        {t("submit")}
      </button>
    </form>
  );
}

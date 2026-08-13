"use client";

import { FormEvent, useId, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { loginAction, type AuthActionResult } from "@/lib/auth-actions";

function errorMessage(result: AuthActionResult): string {
  if (result.ok) return "";
  switch (result.error) {
    case "invalid":
    case "wrong_password":
      return "Wrong login or password.";
    case "rate_limited":
      return "Too many attempts. Try again in a few minutes.";
    case "unauthorized":
      return "Login required.";
    case "mismatch":
    case "taken":
    case "weak":
    case "unknown":
      return "Could not log in.";
    default: {
      const _exhaustive: never = result.error;
      return _exhaustive;
    }
  }
}

export function AdminSignIn() {
  const { update } = useSession();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const loginId = useId();
  const passwordId = useId();

  const fieldClass =
    "w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white transition-all placeholder:text-white/40 focus:border-blue-400/60 focus:bg-white/15 focus:outline-none";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction(login, password);
      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }
      await update();
    });
  }

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="text-xl text-foreground">Admin</h1>
      <p className="mt-2 text-sm text-muted">Log in with an allowlisted login.</p>
      <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor={loginId}>
            Login
          </label>
          <input
            id={loginId}
            autoComplete="username"
            className={fieldClass}
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor={passwordId}>
            Password
          </label>
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            className={fieldClass}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm text-white disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Login"}
        </button>
      </form>
    </main>
  );
}

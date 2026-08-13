"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AdminSignIn } from "@/components/admin/AdminSignIn";
import { getAdminStatsAction } from "@/lib/admin-stats-actions";
import type { AdminStats } from "@/lib/admin-stats";
import type { DayCount } from "@/lib/admin-day-buckets";

function DailyHistogram({
  title,
  days,
}: {
  title: string;
  days: DayCount[];
}) {
  const max = Math.max(1, ...days.map((day) => day.count));
  const first = days[0]?.date ?? "";
  const last = days[days.length - 1]?.date ?? "";

  return (
    <section className="rounded-xl border border-glass-border bg-glass p-4">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <div className="mt-4 flex h-36 items-end gap-0.5 border-b border-glass-border">
        {days.map((day) => (
          <div
            key={day.date}
            className="min-w-0 flex-1 rounded-t-sm bg-accent/80"
            style={{
              height: day.count === 0 ? 0 : `${(day.count / max) * 100}%`,
            }}
            title={`${day.date}: ${day.count}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{first}</span>
        <span>{last}</span>
      </div>
    </section>
  );
}

function AdminStatsView({ stats }: { stats: AdminStats }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-wide text-muted">Admin</p>
      <h1 className="mt-1 text-2xl text-foreground">Cosmic Clock</h1>
      <p className="mt-2 text-sm text-muted">
        Days are UTC. New accounts are registrations (
        <code className="text-foreground">createdAt</code>), not daily logins.
        Guest cards are not included.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-glass-border bg-glass p-3">
          <dt className="text-xs text-muted">Users</dt>
          <dd className="mt-1 text-xl tabular-nums">{stats.userCount}</dd>
        </div>
        <div className="rounded-xl border border-glass-border bg-glass p-3">
          <dt className="text-xs text-muted">Cards</dt>
          <dd className="mt-1 text-xl tabular-nums">{stats.cardCount}</dd>
        </div>
        <div className="rounded-xl border border-glass-border bg-glass p-3">
          <dt className="text-xs text-muted">Users today</dt>
          <dd className="mt-1 text-xl tabular-nums">+{stats.usersToday}</dd>
        </div>
        <div className="rounded-xl border border-glass-border bg-glass p-3">
          <dt className="text-xs text-muted">Cards today</dt>
          <dd className="mt-1 text-xl tabular-nums">+{stats.cardsToday}</dd>
        </div>
      </dl>

      <div className="mt-8 grid gap-6">
        <DailyHistogram title="New accounts (30d)" days={stats.accountDays} />
        <DailyHistogram title="New cards (30d)" days={stats.cardDays} />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-foreground">Accounts</h2>
        {stats.users.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No accounts yet.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-glass-border text-muted">
                <th className="py-2 font-medium">Login</th>
                <th className="py-2 text-right font-medium">Cards</th>
              </tr>
            </thead>
            <tbody>
              {stats.users.map((user) => (
                <tr
                  key={user.login}
                  className="border-b border-glass-border/60"
                >
                  <td className="py-2">{user.login}</td>
                  <td className="py-2 text-right tabular-nums">
                    {user.cardCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function NotFoundMessage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4">
      <h1 className="text-2xl text-foreground">404</h1>
      <p className="mt-2 text-sm text-muted">This page could not be found.</p>
    </main>
  );
}

export function AdminDashboard() {
  const { status } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setStats(null);
      setForbidden(false);
      return;
    }

    let cancelled = false;
    void getAdminStatsAction().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setForbidden(true);
        setStats(null);
        return;
      }
      setForbidden(false);
      setStats(result.stats);
    });

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading") {
    return (
      <main className="flex min-h-full items-center justify-center px-4">
        <p className="text-sm text-muted">Loading…</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <AdminSignIn />;
  }

  if (forbidden) {
    return <NotFoundMessage />;
  }

  if (!stats) {
    return (
      <main className="flex min-h-full items-center justify-center px-4">
        <p className="text-sm text-muted">Loading…</p>
      </main>
    );
  }

  return <AdminStatsView stats={stats} />;
}

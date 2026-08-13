"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AdminSignIn } from "@/components/admin/AdminSignIn";
import { getAdminStatsAction } from "@/lib/admin-stats-actions";
import type { AdminStats } from "@/lib/admin-stats";
import {
  formatHistogramDate,
  histogramAxisTicks,
  histogramValueScale,
  type DayCount,
} from "@/lib/admin-day-buckets";

function DailyHistogram({
  title,
  days,
}: {
  title: string;
  days: DayCount[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const dataMax = Math.max(0, ...days.map((day) => day.count));
  const { top, ticks: valueTicks } = histogramValueScale(dataMax);
  const dateTicks = histogramAxisTicks(days.map((day) => day.date));
  const dateTickAt = new Set(dateTicks.map((tick) => tick.index));
  const lastIndex = days.length - 1;
  const hoveredDay = hovered != null ? days[hovered] : null;

  return (
    <section className="rounded-xl border border-glass-border bg-glass p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <p className="min-h-[1rem] text-[11px] tabular-nums text-muted">
          {hoveredDay
            ? `${formatHistogramDate(hoveredDay.date)} · ${hoveredDay.count}`
            : "Hover a bar"}
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="relative h-36 w-8 shrink-0">
          {valueTicks.map((value) => (
            <span
              key={value}
              className="absolute right-0 text-[10px] leading-none tabular-nums text-muted"
              style={{
                bottom: `${(value / top) * 100}%`,
                transform:
                  value === 0 ? "translateY(0)" : "translateY(50%)",
              }}
            >
              {value}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-36">
            {valueTicks.map((value) => (
              <div
                key={value}
                className={
                  value === 0
                    ? "absolute right-0 left-0 border-t border-glass-border"
                    : "absolute right-0 left-0 border-t border-white/10"
                }
                style={{ bottom: `${(value / top) * 100}%` }}
              />
            ))}
            <div className="relative flex h-full gap-0.5">
              {days.map((day, index) => {
                const heightPct =
                  day.count === 0 ? 0 : (day.count / top) * 100;
                const isHovered = hovered === index;
                return (
                  <div
                    key={day.date}
                    className="relative min-w-0 flex-1 cursor-pointer"
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div
                      className={
                        isHovered
                          ? "absolute right-0 bottom-0 left-0 rounded-t-sm bg-accent"
                          : "absolute right-0 bottom-0 left-0 rounded-t-sm bg-accent/80"
                      }
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-0.5">
            {days.map((day, index) => (
              <div
                key={`${day.date}-tick`}
                className="flex min-w-0 flex-1 justify-center"
              >
                <span
                  className={
                    dateTickAt.has(index)
                      ? "h-1.5 w-px bg-glass-border"
                      : "h-1.5"
                  }
                />
              </div>
            ))}
          </div>
          <div className="relative mt-1 h-5">
            {dateTicks.map((tick) => {
              const isFirst = tick.index === 0;
              const isLast = tick.index === lastIndex && days.length > 1;
              let left = `${((tick.index + 0.5) / days.length) * 100}%`;
              let transform = "translateX(-50%)";
              if (isFirst) {
                left = "0%";
                transform = "translateX(0)";
              } else if (isLast) {
                left = "100%";
                transform = "translateX(-100%)";
              }
              return (
                <span
                  key={tick.index}
                  className="absolute top-0 whitespace-nowrap text-[10px] leading-none text-muted"
                  style={{ left, transform }}
                >
                  {tick.label}
                </span>
              );
            })}
          </div>
        </div>
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

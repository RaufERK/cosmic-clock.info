"use client";

import { useTranslations } from "next-intl";
import { CosmicClock } from "@/components/CosmicClock";
import {
  getHandHour,
  monthHandRotation,
  yearHandRotation,
} from "@/lib/cosmic-clock-math";

const PREVIEW_SAMPLES = [
  { day: 15, month: 5, year: 1995 },
  { day: 12, month: 2, year: 2026 },
] as const;

function formatSampleDate(day: number, month: number, year: number): string {
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return `${dd}.${mm}.${year}`;
}

export function ClockPreview() {
  const t = useTranslations("home");

  return (
    <div className="mt-16 w-full border-t border-white/10 pt-12">
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/35">
        {t("previewLabel")}
      </p>
      <p className="mb-8 text-sm text-white/45">{t("previewHint")}</p>

      <div className="flex flex-wrap items-start justify-center gap-10">
        {PREVIEW_SAMPLES.map((sample) => {
          const yearHour = getHandHour(yearHandRotation(sample.year));
          const monthHour = getHandHour(monthHandRotation(sample.month));
          return (
            <figure
              key={`${sample.year}-${sample.month}-${sample.day}`}
              className="flex flex-col items-center gap-4"
            >
              <CosmicClock
                day={sample.day}
                month={sample.month}
                year={sample.year}
                size={200}
              />
              <figcaption className="text-center text-sm text-white/60">
                <div className="font-medium tracking-wide text-white/80">
                  {formatSampleDate(sample.day, sample.month, sample.year)}
                </div>
                <div className="mt-1 text-xs text-white/40">
                  {t("previewLegend", {
                    yearHour,
                    monthHour,
                  })}
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}

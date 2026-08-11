"use client";

import { FormEvent, useId, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { daysInMonth, todayCivil } from "@/lib/cosmic-clock-math";
import {
  isDaySelectable,
  isYearMonthNotFuture,
  validateStartDate,
} from "@/lib/start-date";

export type CardFormValues = {
  name: string;
  day: number;
  month: number;
  year: number;
};

type Props = {
  initialData?: CardFormValues;
  onSave: (data: CardFormValues) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  isNew?: boolean;
};

type Step = "details" | "day";

function firstWeekdayMondayFirst(year: number, month: number): number {
  const sundayFirst = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (sundayFirst + 6) % 7;
}

export function CardForm({
  initialData,
  onSave,
  onCancel,
  onDelete,
  isNew,
}: Props) {
  const t = useTranslations("app");
  const monthNames = t.raw("monthNames") as string[];
  const weekdayShort = t.raw("weekdayShort") as string[];
  const nameId = useId();
  const yearId = useId();
  const monthId = useId();

  const today = todayCivil();

  const [name, setName] = useState(initialData?.name ?? "");
  const [yearText, setYearText] = useState(
    initialData ? String(initialData.year) : "",
  );
  const [month, setMonth] = useState<number | null>(
    initialData?.month ?? null,
  );
  const [day, setDay] = useState<number | null>(initialData?.day ?? null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("details");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const yearNum = Number.parseInt(yearText, 10);
  const yearValid =
    Number.isInteger(yearNum) && yearNum >= 0 && yearNum <= today.year;
  const nameOk = name.trim().length > 0;
  const monthOk = month !== null;
  const detailsComplete = nameOk && yearValid && monthOk;
  const canFinish = detailsComplete && day !== null;

  const dayCount =
    month !== null && yearValid ? daysInMonth(yearNum, month) : 0;
  const leadEmpty =
    month !== null && yearValid
      ? firstWeekdayMondayFirst(yearNum, month)
      : 0;

  const calendarCells = useMemo(() => {
    const cells: Array<number | null> = Array.from(
      { length: leadEmpty },
      () => null,
    );
    for (let d = 1; d <= dayCount; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [leadEmpty, dayCount]);

  function startDateMessage(
    code: ReturnType<typeof validateStartDate>,
  ): string {
    switch (code) {
      case null:
        return "";
      case "incomplete":
        return t("dateErrorIncomplete");
      case "invalid_day":
        return t("dateErrorInvalid");
      case "year":
        return t("dateErrorYear");
      case "future":
        return t("dateErrorFuture");
      default: {
        const _exhaustive: never = code;
        return _exhaustive;
      }
    }
  }

  function goBack() {
    setError(null);
    setConfirmingDelete(false);
    setStep("details");
  }

  function goForward() {
    setError(null);
    setConfirmingDelete(false);
    if (!detailsComplete || month === null) {
      setError(t("dateErrorIncomplete"));
      return;
    }
    if (!yearValid) {
      setError(t("dateErrorYear"));
      return;
    }
    if (!isYearMonthNotFuture(yearNum, month, today)) {
      setError(t("dateErrorFuture"));
      return;
    }
    if (day !== null && day > daysInMonth(yearNum, month)) {
      setDay(null);
    }
    if (
      day !== null &&
      !isDaySelectable(yearNum, month, day, today)
    ) {
      setDay(null);
    }
    setStep("day");
  }

  function onYearChange(value: string) {
    const next = value.replace(/\D/g, "").slice(0, 4);
    setYearText(next);
    const nextYear = Number.parseInt(next, 10);
    if (
      Number.isInteger(nextYear) &&
      month !== null &&
      !isYearMonthNotFuture(nextYear, month, today)
    ) {
      setMonth(null);
      setDay(null);
    }
  }

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    if (!canFinish || month === null || day === null) {
      setError(t("dateErrorIncomplete"));
      return;
    }
    const dateError = validateStartDate(yearNum, month, day, today);
    if (dateError !== null) {
      setError(startDateMessage(dateError));
      return;
    }
    onSave({
      name: name.trim(),
      day,
      month,
      year: yearNum,
    });
  }

  const fieldClass =
    "w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white transition-all placeholder:text-white/40 focus:border-blue-400/60 focus:bg-white/15 focus:outline-none";

  const summary =
    detailsComplete && month !== null
      ? `${name.trim()} · ${monthNames[month - 1]} ${yearNum}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex h-full w-full flex-col rounded-[2.5rem] border border-indigo-400/20 bg-indigo-950/80 p-6 shadow-2xl shadow-indigo-950 backdrop-blur-2xl sm:p-8"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        {step === "day" ? (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {t("formBack")}
          </button>
        ) : (
          <span />
        )}
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            aria-label={t("formCancel")}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5 text-white/50" aria-hidden />
          </button>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1"
      >
        {step === "details" ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor={nameId}
                className="ml-1 text-xs font-bold uppercase tracking-widest text-white/70"
              >
                {t("labelName")}
              </label>
              <input
                id={nameId}
                type="text"
                placeholder={t("namePlaceholder")}
                autoFocus={isNew}
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor={yearId}
                className="ml-1 text-xs font-bold uppercase tracking-widest text-white/70"
              >
                {t("labelYear")}
              </label>
              <input
                id={yearId}
                type="text"
                inputMode="numeric"
                autoComplete="bday-year"
                placeholder={t("yearPlaceholder")}
                className={fieldClass}
                value={yearText}
                onChange={(e) => onYearChange(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor={monthId}
                className="ml-1 text-xs font-bold uppercase tracking-widest text-white/70"
              >
                {t("labelMonth")}
              </label>
              <select
                id={monthId}
                className={fieldClass}
                value={month ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setMonth(v === "" ? null : Number.parseInt(v, 10));
                }}
              >
                <option value="" className="bg-indigo-950 text-white">
                  {t("selectMonth")}
                </option>
                {monthNames.map((label, index) => {
                  const monthValue = index + 1;
                  const disabled =
                    yearValid &&
                    !isYearMonthNotFuture(yearNum, monthValue, today);
                  return (
                    <option
                      key={label}
                      value={monthValue}
                      disabled={disabled}
                      className="bg-indigo-950 text-white"
                    >
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        ) : null}

        {step === "day" ? (
          <div className="space-y-3">
            {summary ? (
              <p className="text-center text-sm font-bold tracking-wide text-white/55">
                {summary}
              </p>
            ) : null}

            <p className="ml-1 text-xs font-bold uppercase tracking-widest text-white/70">
              {t("labelDay")}
            </p>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold tracking-wide text-white/40">
              {weekdayShort.map((label) => (
                <div key={label} className="py-1">
                  {label}
                </div>
              ))}
            </div>

            <div
              className="grid grid-cols-7 gap-1.5"
              role="listbox"
              aria-label={t("labelDay")}
            >
              {calendarCells.map((d, index) => {
                if (d === null) {
                  return <div key={`e-${index}`} className="aspect-square" />;
                }
                const selectable = isDaySelectable(yearNum, month!, d, today);
                const selected = day === d;
                return (
                  <button
                    key={d}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    aria-disabled={!selectable}
                    disabled={!selectable}
                    onClick={() => {
                      if (selectable) setDay(d);
                    }}
                    className={`aspect-square rounded-lg text-sm font-bold transition-all ${
                      selected
                        ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.45)]"
                        : selectable
                          ? "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                          : "cursor-not-allowed bg-white/5 text-white/25"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm font-medium text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {step === "details" ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={goForward}
            disabled={!detailsComplete}
            className="w-full rounded-2xl bg-purple-500/85 py-3.5 font-bold text-white transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("formNext")}
          </button>

          {!isNew && onDelete ? (
            confirmingDelete ? (
              <div className="space-y-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-3">
                <p className="text-center text-sm font-medium text-red-200">
                  {t("confirmDelete")}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm font-bold text-white/80 transition-all hover:bg-white/10"
                  >
                    {t("confirmDeleteCancel")}
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex-1 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-500"
                  >
                    {t("confirmDeleteYes")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 py-3 text-sm font-bold text-red-400 transition-all hover:border-red-500/60 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t("deleteCard")}
              </button>
            )
          ) : null}
        </div>
      ) : null}

      {step === "day" ? (
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!canFinish}
          className="mt-4 w-full transform rounded-2xl bg-purple-500/85 py-3.5 font-bold text-white shadow-xl shadow-purple-950/30 transition-all hover:bg-purple-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("done")}
        </button>
      ) : null}
    </motion.div>
  );
}

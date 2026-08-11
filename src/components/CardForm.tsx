"use client";

import {
  FormEvent,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Trash2, X } from "lucide-react";
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

type Step = 1 | 2;

function firstWeekdayMondayFirst(year: number, month: number): number {
  const sundayFirst = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (sundayFirst + 6) % 7;
}

function yearToPin(year: number | undefined): string {
  if (year === undefined) return "";
  return String(year).padStart(4, "0").slice(-4);
}

function YearPin({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2, ref3];

  function handleKey(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[idx]) {
        onChange(value.slice(0, idx) + value.slice(idx + 1));
      } else if (idx > 0) {
        onChange(value.slice(0, idx - 1) + value.slice(idx));
        refs[idx - 1].current?.focus();
      }
    }
  }

  function handleChange(idx: number, e: ChangeEvent<HTMLInputElement>) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    if (!char) return;
    const arr = (value + "    ").slice(0, 4).split("");
    arr[idx] = char;
    const next = arr.join("").trimEnd().slice(0, 4);
    onChange(next);
    if (idx < 3) refs[idx + 1].current?.focus();
  }

  return (
    <div className="flex justify-center gap-2.5" id={id}>
      {[0, 1, 2, 3].map((idx) => (
        <input
          key={idx}
          ref={refs[idx]}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={1}
          aria-label={`${idx + 1}`}
          value={value[idx] ?? ""}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKey(idx, e)}
          onClick={() => refs[idx].current?.select()}
          className="h-16 w-14 select-none rounded-xl border border-white/20 bg-white/10 text-center text-2xl font-black text-white caret-transparent transition-all focus:border-blue-400/70 focus:bg-white/15 focus:outline-none"
        />
      ))}
    </div>
  );
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
  const [yearText, setYearText] = useState(yearToPin(initialData?.year));
  const [month, setMonth] = useState<number | null>(
    initialData?.month ?? null,
  );
  const [day, setDay] = useState<number | null>(initialData?.day ?? null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const yearNum = Number.parseInt(yearText, 10);
  const yearComplete = yearText.length === 4 && Number.isInteger(yearNum);
  const yearValid =
    yearComplete && yearNum >= 0 && yearNum <= today.year;
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
    setStep(1);
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
    setStep(2);
  }

  function onYearChange(value: string) {
    const next = value.replace(/\D/g, "").slice(0, 4);
    setYearText(next);
    const nextYear = Number.parseInt(next, 10);
    if (
      next.length === 4 &&
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
    "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white transition-all placeholder:text-white/25 focus:border-blue-400/60 focus:bg-white/15 focus:outline-none";

  const summaryReady = detailsComplete && month !== null;
  const summaryName = name.trim();
  const summaryDate =
    month !== null ? `${monthNames[month - 1]} ${yearNum}` : null;

  const deleteButton = !isNew && onDelete ? (
    confirmingDelete ? (
      <div className="mt-3 space-y-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-3">
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
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 py-3 text-sm font-bold text-red-400 transition-all hover:border-red-500/60 hover:bg-red-500/10"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {t("deleteCard")}
      </button>
    )
  ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex h-full w-full flex-col overflow-hidden rounded-[2.5rem] border border-indigo-400/20 bg-indigo-950/80 shadow-2xl shadow-indigo-950 backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between px-7 pt-6 pb-2">
        <div className="flex items-center gap-2" aria-hidden>
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                s === step
                  ? "bg-blue-400"
                  : s < step
                    ? "bg-blue-400/40"
                    : "bg-white/15"
              }`}
            />
          ))}
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            aria-label={t("formCancel")}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5 text-white/50" aria-hidden />
          </button>
        ) : (
          <span />
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {step === 1 ? (
          <div className="flex flex-1 flex-col px-7 pb-7">
            <div className="flex flex-1 flex-col justify-evenly gap-4">
              <div className="flex flex-col gap-3">
                <label
                  htmlFor={nameId}
                  className="text-xs font-bold tracking-widest text-white/50 uppercase"
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

              <div className="flex flex-col gap-3">
                <label
                  htmlFor={yearId}
                  className="text-xs font-bold tracking-widest text-white/50 uppercase"
                >
                  {t("labelYear")}
                </label>
                <YearPin
                  id={yearId}
                  value={yearText}
                  onChange={onYearChange}
                />
              </div>

              <div className="flex flex-col gap-3">
                <label
                  htmlFor={monthId}
                  className="text-xs font-bold tracking-widest text-white/50 uppercase"
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
                    setDay(null);
                  }}
                >
                  <option value="" className="bg-[#0a0a20] text-white/40">
                    —
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
                        className="bg-[#0a0a20] text-white"
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {error ? (
              <p className="mt-3 text-sm font-medium text-red-300" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={goForward}
              disabled={!detailsComplete}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500/80 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-30"
            >
              {t("formNext")} <ArrowRight className="h-4 w-4" aria-hidden />
            </button>

            {deleteButton}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-1 flex-col px-7 pb-7">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-2 flex-1" aria-hidden />
              <div className="w-full shrink-0">
                {summaryReady && summaryDate ? (
                  <div className="mb-4 text-center">
                    <p className="text-sm font-bold tracking-wide text-white/80">
                      {summaryName}
                    </p>
                    <p className="mt-1 text-sm font-bold tracking-wide text-white/55">
                      {summaryDate}
                    </p>
                  </div>
                ) : null}
                <div className="mb-2 grid grid-cols-7">
                  {weekdayShort.map((label) => (
                    <div
                      key={label}
                      className="py-1 text-center text-[10px] font-bold tracking-widest text-white/30 uppercase"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div
                  className="grid grid-cols-7 gap-1"
                  role="listbox"
                  aria-label={t("labelDay")}
                >
                  {calendarCells.map((d, index) => {
                    if (d === null) {
                      return <div key={`e-${index}`} />;
                    }
                    const selectable = isDaySelectable(
                      yearNum,
                      month!,
                      d,
                      today,
                    );
                    const selected = day === d;
                    const isToday =
                      yearNum === today.year &&
                      month === today.month &&
                      d === today.day;
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
                        className={`flex aspect-square items-center justify-center rounded-lg text-sm font-bold transition-all ${
                          selected
                            ? "scale-105 bg-blue-500 text-white shadow-lg shadow-blue-500/40"
                            : !selectable
                              ? "cursor-not-allowed border border-white/5 bg-white/[0.03] text-white/15"
                              : isToday
                                ? "border border-indigo-400/50 bg-indigo-500/30 text-indigo-200 hover:bg-indigo-500/50"
                                : "border border-indigo-400/15 bg-indigo-900/50 text-white/75 hover:border-indigo-400/40 hover:bg-indigo-700/60 hover:text-white"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="min-h-2 flex-1" aria-hidden />
            </div>

            {error ? (
              <p className="mt-3 text-sm font-medium text-red-300" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1.5 rounded-2xl border border-white/15 px-4 py-3 text-sm font-bold text-white/50 transition-all hover:border-white/30 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {t("formBack")}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!canFinish}
                className="flex-1 rounded-2xl bg-white py-3 text-base font-bold text-black shadow-xl transition-all hover:bg-blue-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30"
              >
                {t("done")}
              </button>
            </div>
          </div>
        ) : null}
      </form>
    </motion.div>
  );
}

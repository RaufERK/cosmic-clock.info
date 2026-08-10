"use client";

import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import { Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

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

export function CardForm({
  initialData,
  onSave,
  onCancel,
  onDelete,
  isNew,
}: Props) {
  const t = useTranslations("app");
  const [formData, setFormData] = useState<CardFormValues>(
    initialData ?? { name: "", day: 1, month: 1, year: 1990 },
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave(formData);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex h-full w-full flex-col rounded-[2.5rem] border border-indigo-400/20 bg-indigo-950/80 p-8 shadow-2xl shadow-indigo-950 backdrop-blur-2xl"
    >
      <div className="mb-4 flex items-center justify-end">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5 text-white/50" />
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-3 pr-1">
        <div className="space-y-1">
          <label className="ml-1 text-xs font-bold uppercase tracking-widest text-white/70">
            {t("labelName")}
          </label>
          <input
            type="text"
            placeholder={t("namePlaceholder")}
            required
            className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white transition-all placeholder:text-white/40 focus:border-blue-400/60 focus:bg-white/15 focus:outline-none"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-white/70">
              {t("labelDay")}
            </label>
            <input
              type="number"
              min={1}
              max={31}
              className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white transition-all focus:border-blue-400/60 focus:bg-white/15 focus:outline-none"
              value={formData.day}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(value)) {
                  setFormData({ ...formData, day: value });
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-white/70">
              {t("labelMonth")}
            </label>
            <input
              type="number"
              min={1}
              max={12}
              className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white transition-all focus:border-blue-400/60 focus:bg-white/15 focus:outline-none"
              value={formData.month}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(value)) {
                  setFormData({ ...formData, month: value });
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-white/70">
              {t("labelYear")}
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white transition-all focus:border-blue-400/60 focus:bg-white/15 focus:outline-none"
              value={formData.year}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(value)) {
                  setFormData({ ...formData, year: value });
                }
              }}
            />
          </div>
        </div>
      </form>

      <button
        type="button"
        onClick={handleSubmit}
        className="mt-4 w-full transform rounded-2xl bg-white py-3.5 font-bold text-black shadow-xl transition-all hover:bg-blue-50 active:scale-[0.98]"
      >
        {t("done")}
      </button>

      {!isNew && onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 py-3 text-sm font-bold text-red-400 transition-all hover:border-red-500/60 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
          {t("deleteCard")}
        </button>
      ) : null}
    </motion.div>
  );
}

import React, { useState, useRef } from 'react';
import { X, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useLang } from '../contexts/LangContext';

interface CardFormProps {
  initialData?: { day: number; month: number; year: number; name: string };
  onSave: (data: { day: number; month: number; year: number; name: string }) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  isNew?: boolean;
}

// ── PIN year input ──────────────────────────────────────────────
function YearPin({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[idx]) {
        onChange(value.slice(0, idx) + value.slice(idx + 1));
      } else if (idx > 0) {
        onChange(value.slice(0, idx - 1) + value.slice(idx));
        refs[idx - 1].current?.focus();
      }
    }
  };

  const handleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    if (!char) return;
    const arr = (value + '    ').slice(0, 4).split('');
    arr[idx] = char;
    const next = arr.join('').trimEnd().slice(0, 4);
    onChange(next);
    if (idx < 3) refs[idx + 1].current?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {[0, 1, 2, 3].map(idx => (
        <input
          key={idx}
          ref={refs[idx]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] ?? ''}
          onChange={e => handleChange(idx, e)}
          onKeyDown={e => handleKey(idx, e)}
          onClick={() => refs[idx].current?.select()}
          className="w-14 h-16 text-center text-2xl font-black bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400/70 focus:bg-white/15 transition-all caret-transparent select-none"
        />
      ))}
    </div>
  );
}

// ── Calendar grid ───────────────────────────────────────────────
function CalendarGrid({ year, month, selected, onSelect }: {
  year: number; month: number; selected: number | null; onSelect: (d: number) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const offset = (firstDow + 6) % 7; // Mon=0

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isFuture = (day: number) => new Date(year, month - 1, day) > today;
  const isToday = (day: number) => {
    const d = new Date(year, month - 1, day);
    return d.getTime() === today.getTime();
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-white/30 uppercase tracking-widest py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const future = isFuture(day);
          const todayMark = isToday(day);
          const sel = selected === day;
          return (
            <button
              key={i}
              type="button"
              disabled={future}
              onClick={() => onSelect(day)}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all
                ${sel
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40 scale-105'
                  : future
                  ? 'bg-white/[0.03] text-white/15 cursor-not-allowed border border-white/5'
                  : todayMark
                  ? 'bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 hover:bg-indigo-500/50'
                  : 'bg-indigo-900/50 border border-indigo-400/15 text-white/75 hover:bg-indigo-700/60 hover:border-indigo-400/40 hover:text-white'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────
export const CardForm = ({ initialData, onSave, onCancel, onDelete, isNew }: CardFormProps) => {
  const { tr } = useLang();

  // shared state — prefilled for edit, empty for new
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initialData?.name ?? '');
  const [yearStr, setYearStr] = useState(initialData ? String(initialData.year) : '');
  const [month, setMonth] = useState<number>(initialData?.month ?? 0);
  const [day, setDay] = useState<number | null>(initialData?.day ?? null);

  const year = parseInt(yearStr);
  const step1Valid = name.trim().length > 0 && yearStr.length === 4 && !isNaN(year) && year > 0 && month > 0;
  const step2Valid = day !== null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full rounded-[2.5rem] flex flex-col bg-indigo-950/80 backdrop-blur-2xl border border-indigo-400/20 shadow-2xl shadow-indigo-950 overflow-hidden"
    >
      {/* Dots + close */}
      <div className="flex items-center justify-between px-7 pt-6 pb-2">
        <div className="flex items-center gap-2">
          {[1, 2].map(s => (
            <div key={s} className={`w-2 h-2 rounded-full transition-all duration-300 ${s === step ? 'bg-blue-400' : s < step ? 'bg-blue-400/40' : 'bg-white/15'}`} />
          ))}
        </div>
        {onCancel && (
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        )}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="flex-1 flex flex-col px-7 pb-7">
          <div className="flex-1 flex flex-col justify-evenly">
            <div className="flex flex-col gap-3">
              <label className="text-xs text-white/50 uppercase tracking-widest font-bold">{tr.labelName}</label>
              <input
                type="text"
                autoFocus
                placeholder={tr.namePlaceholder}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400/60 focus:bg-white/15 transition-all text-base"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs text-white/50 uppercase tracking-widest font-bold">{tr.labelYear}</label>
              <YearPin value={yearStr} onChange={setYearStr} />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs text-white/50 uppercase tracking-widest font-bold">{tr.labelMonth}</label>
              <select
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/60 transition-all text-base"
                value={month || ''}
                onChange={e => { setMonth(parseInt(e.target.value)); setDay(null); }}
              >
                <option value="" className="bg-[#0a0a20] text-white/40">—</option>
                {tr.months.map((m, i) => (
                  <option key={i} value={i + 1} className="bg-[#0a0a20]">{m}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            disabled={!step1Valid}
            onClick={() => setStep(2)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base transition-all bg-blue-500/80 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-30 disabled:pointer-events-none"
          >
            Далее <ArrowRight className="w-4 h-4" />
          </button>

          {!isNew && onDelete && (
            <button
              onClick={onDelete}
              className="w-full mt-3 py-3 rounded-2xl border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/10 hover:border-red-500/60 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />{tr.deleteCard}
            </button>
          )}
        </div>
      )}

      {/* Step 2 — calendar */}
      {step === 2 && (
        <div className="flex-1 flex flex-col px-7 pb-7">
          <p className="text-white/60 font-bold text-sm mb-3">
            {tr.months[month - 1]} {year}
            {day ? <span className="text-blue-300 ml-2">· {day}</span> : null}
          </p>
          <div className="flex-1 flex items-center">
            <CalendarGrid year={year} month={month} selected={day} onSelect={setDay} />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-white/15 text-white/50 hover:text-white hover:border-white/30 font-bold text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Назад
            </button>
            <button
              disabled={!step2Valid}
              onClick={() => { if (step1Valid && step2Valid) onSave({ name: name.trim(), year, month, day: day! }); }}
              className="flex-1 py-3 rounded-2xl font-bold text-base transition-all bg-white text-black hover:bg-blue-50 active:scale-[0.98] shadow-xl disabled:opacity-30 disabled:pointer-events-none"
            >
              {tr.done}
            </button>
          </div>

          {!isNew && onDelete && (
            <button
              onClick={onDelete}
              className="w-full mt-3 py-3 rounded-2xl border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/10 hover:border-red-500/60 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />{tr.deleteCard}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

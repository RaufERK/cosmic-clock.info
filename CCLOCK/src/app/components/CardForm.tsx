import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLang } from '../contexts/LangContext';

interface CardFormProps {
  initialData?: { day: number; month: number; year: number; name: string };
  onSave: (data: { day: number; month: number; year: number; name: string }) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  isNew?: boolean;
}

export const CardForm = ({ initialData, onSave, onCancel, onDelete, isNew }: CardFormProps) => {
  const { tr } = useLang();
  const [formData, setFormData] = useState(initialData || { name: '', day: 1, month: 1, year: 1990 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full rounded-[2.5rem] p-8 flex flex-col bg-[#0a0a10]/95 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black ring-1 ring-white/10"
    >
      <div className="flex justify-end items-center mb-4">
        {onCancel && (
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-3 pr-1">
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">{tr.labelName}</label>
          <input
            type="text"
            placeholder={tr.namePlaceholder}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-sm"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">{tr.labelDay}</label>
            <input
              type="number" min="1" max="31"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 text-sm"
              value={formData.day}
              onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setFormData({ ...formData, day: v }); }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">{tr.labelMonth}</label>
            <input
              type="number" min="1" max="12"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 text-sm"
              value={formData.month}
              onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setFormData({ ...formData, month: v }); }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">{tr.labelYear}</label>
            <input
              type="number"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 text-sm"
              value={formData.year}
              onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setFormData({ ...formData, year: v }); }}
            />
          </div>
        </div>
      </form>

      <button
        onClick={handleSubmit}
        className="w-full bg-white text-black font-bold py-3.5 rounded-2xl transition-all transform hover:bg-blue-50 active:scale-[0.98] mt-4 shadow-xl"
      >
        {tr.done}
      </button>

      {!isNew && onDelete && (
        <button
          onClick={onDelete}
          className="w-full mt-3 py-3 rounded-2xl border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/10 hover:border-red-500/60 transition-all flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {tr.deleteCard}
        </button>
      )}
    </motion.div>
  );
};

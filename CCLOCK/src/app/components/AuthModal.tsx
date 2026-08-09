import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const AuthModal = ({ mode: initialMode, onClose, onSuccess }: AuthModalProps) => {
  const { tr } = useLang();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) onSuccess(email);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-sm bg-[#0a0a14] border border-white/15 rounded-[2rem] p-8 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>

          <h2 className="text-xl font-bold text-white mb-6 tracking-wide">
            {mode === 'login' ? tr.login : tr.register}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{tr.email}</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{tr.password}</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all text-sm"
              />
            </div>

            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{tr.confirmPassword}</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-white text-black font-bold py-3 rounded-2xl hover:bg-blue-50 active:scale-[0.98] transition-all mt-2"
            >
              {mode === 'login' ? tr.login : tr.register}
            </button>
          </form>

          <p className="text-center text-white/30 text-xs mt-5">
            {mode === 'login' ? tr.noAccount : tr.haveAccount}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
            >
              {mode === 'login' ? tr.register : tr.login}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

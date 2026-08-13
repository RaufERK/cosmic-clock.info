import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CosmicClock, getHandHour } from './components/CosmicClock';
import { CardForm } from './components/CardForm';
import { AuthModal } from './components/AuthModal';
import { LangProvider, useLang } from './contexts/LangContext';
import { languages } from './i18n';
import { Plus, Settings, LogOut, Lock, LockOpen, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface Toast { id: number; message: string; }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const show = useCallback((message: string) => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-rose-900/95 border border-rose-500/50 text-rose-100 text-base font-bold shadow-2xl shadow-rose-950/80 backdrop-blur-xl animate-[fadeInUp_0.25s_ease]">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          {t.message}
        </div>
      ))}
    </div>
  );
}

interface CardData {
  id: string;
  name: string;
  day: number;
  month: number;
  year: number;
  createdAt: number;
}

function AppInner() {
  const { lang, setLang, tr } = useLang();

  const [cards, setCards] = useState<CardData[]>([
    { id: '1', name: 'Персональная карта', day: 15, month: 5, year: 1995, createdAt: 1700000000000 },
    { id: '2', name: 'Транзиты 2026', day: 12, month: 2, year: 2026, createdAt: 1700000001000 },
  ]);
  const [isDragMode, setIsDragMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const { toasts, show: showToast } = useToast();

  useEffect(() => {
    if (!isDragMode) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsDragMode(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDragMode]);

  const moveCard = (from: number, to: number) => {
    if (to < 0 || to >= cards.length) return;
    const next = [...cards];
    const [card] = next.splice(from, 1);
    next.splice(to, 0, card);
    setCards(next);
  };

  const addCard = (data: Omit<CardData, 'id' | 'createdAt'>) => {
    const duplicate = cards.some(c => c.day === data.day && c.month === data.month && c.year === data.year);
    if (duplicate) {
      showToast('Карта с этой датой уже существует');
      return;
    }
    const now = Date.now();
    setCards([...cards, { ...data, id: now.toString(), createdAt: now }]);
    setIsAdding(false);
  };

  const updateCard = (id: string, data: Omit<CardData, 'id' | 'createdAt'>) => {
    setCards(cards.map(c => c.id === id ? { ...data, id, createdAt: c.createdAt } : c));
    setEditingId(null);
  };

  const removeCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-[#020205] text-white selection:bg-blue-500/30" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 mix-blend-screen bg-center bg-cover scale-110"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1580163238333-aeab3b0a112d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFyJTIwdHJhaWxzJTIwbmlnaHQlMjBza3klMjBkZWVwJTIwc3BhY2UlMjBwdXJwbGUlMjBibHVlfGVufDF8fHx8MTc3MDg5Nzg0NHww&ixlib=rb-4.1.0&q=80&w=1080')` }}
        />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 px-5 pt-6 pb-12 max-w-7xl mx-auto">

        {/* Mobile: flex column with equal spacing around title */}
        <div className="flex md:hidden flex-col gap-5">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3">
            {/* Language select */}
            <select
              value={lang}
              onChange={e => setLang(e.target.value as typeof lang)}
              className="bg-white/5 border border-white/25 rounded-xl px-3 py-2 text-sm font-bold text-white/70 focus:outline-none focus:border-blue-400/50 transition-all"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code} className="bg-[#0a0a20]">{l.label}</option>
              ))}
            </select>

            {/* Auth */}
            {user ? (
              <div className="flex items-center border border-white/25 rounded-xl overflow-hidden">
                <button onClick={() => setUser(null)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-blue-300 hover:text-white hover:bg-blue-500/30 transition-all">
                  <LogOut className="w-4 h-4" />
                  {tr.logout}
                </button>
              </div>
            ) : (
              <div className="flex items-center border border-white/25 rounded-xl overflow-hidden">
                <button onClick={() => setAuthModal('login')} className="px-3 py-2 text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all border-r border-white/25">
                  {tr.login}
                </button>
                <button onClick={() => setAuthModal('register')} className="px-3 py-2 text-sm font-bold text-blue-300 hover:text-white hover:bg-blue-500/30 transition-all">
                  {tr.register}
                </button>
              </div>
            )}
          </div>

          {/* Title — same gap above and below */}
          <motion.div initial="initial" whileHover="hover" className="text-center cursor-default -mx-5">
            <motion.svg
              variants={{ initial: { filter: 'drop-shadow(0 0 0px rgba(59,130,246,0))' }, hover: { filter: 'drop-shadow(0 0 18px rgba(59,130,246,0.65))' } }}
              viewBox="0 0 720 65" className="w-full mx-auto" overflow="visible"
              style={{ transition: 'filter 0.5s' }}
            >
              <defs><path id="titleArcMobile" d="M 10,58 A 3410,3410 0 0,1 710,58" /></defs>
              <text fill="white" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="800" fontSize="52" letterSpacing="5">
                <textPath href="#titleArcMobile" startOffset="50%" textAnchor="middle">{tr.title}</textPath>
              </text>
            </motion.svg>
          </motion.div>
        </div>

        {/* Desktop: three-column row */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Language segmented */}
          <div className="flex items-center border border-white/25 rounded-xl overflow-hidden">
            {languages.map((l, idx) => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`px-3 py-1.5 text-xs font-bold tracking-widest transition-all ${idx > 0 ? 'border-l border-white/25' : ''} ${lang === l.code ? 'bg-blue-500/25 text-blue-300' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <motion.div initial="initial" whileHover="hover" className="text-center cursor-default flex-1">
            <motion.svg
              variants={{ initial: { filter: 'drop-shadow(0 0 0px rgba(59,130,246,0))', scale: 1 }, hover: { filter: 'drop-shadow(0 0 18px rgba(59,130,246,0.65))', scale: 1.04 } }}
              viewBox="0 0 720 65" className="w-full max-w-xl mx-auto" overflow="visible"
              style={{ transition: 'filter 0.5s, transform 0.5s' }}
            >
              <defs><path id="titleArc" d="M 10,58 A 3410,3410 0 0,1 710,58" /></defs>
              <text fill="white" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="800" fontSize="57" letterSpacing="7">
                <textPath href="#titleArc" startOffset="50%" textAnchor="middle">{tr.title}</textPath>
              </text>
            </motion.svg>
          </motion.div>

          {/* Auth */}
          {user ? (
            <div className="flex items-center border border-white/25 rounded-xl overflow-hidden">
              <span className="px-4 py-2 text-sm font-bold text-white/70 border-r border-white/25 max-w-[130px] truncate">{user}</span>
              <button onClick={() => setUser(null)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-300 hover:text-white hover:bg-blue-500/30 transition-all">
                <LogOut className="w-4 h-4" />{tr.logout}
              </button>
            </div>
          ) : (
            <div className="flex items-center border border-white/25 rounded-xl overflow-hidden">
              <button onClick={() => setAuthModal('login')} className="px-4 py-2 text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all border-r border-white/25">{tr.login}</button>
              <button onClick={() => setAuthModal('register')} className="px-4 py-2 text-sm font-bold text-blue-300 hover:text-white hover:bg-blue-500/30 transition-all">{tr.register}</button>
            </div>
          )}
        </div>
      </nav>

      {/* Divider with lock button */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 mb-10">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          {cards.length > 1 && (
            <button
              onClick={() => setIsDragMode(d => !d)}
              title={isDragMode ? 'Зафиксировать порядок' : 'Изменить порядок'}
              className={`p-2.5 rounded-xl border transition-all flex-shrink-0 ${
                isDragMode
                  ? 'border-amber-400/50 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
                  : 'border-white/20 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
              }`}
            >
              {isDragMode ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          )}
          <div className="flex-1 h-px bg-white/10" />
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          <>
            {cards.map((card, idx) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                draggable={isDragMode}
                onDragStart={() => setDragIndex(idx)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== idx) moveCard(dragIndex, idx);
                  setDragIndex(null);
                }}
                className="group h-[580px] relative"
              >
                {editingId === card.id ? (
                  <CardForm
                    initialData={card}
                    onSave={(data) => updateCard(card.id, data)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => removeCard(card.id)}
                  />
                ) : (
                  <motion.div className={`w-full h-full bg-indigo-950/80 backdrop-blur-2xl border border-indigo-400/20 rounded-[2.5rem] p-8 transition-all duration-500 flex flex-col items-center shadow-2xl shadow-indigo-950 relative ${isDragMode ? 'cursor-grab active:cursor-grabbing' : 'hover:bg-indigo-950/90 group-hover:border-indigo-400/35'}`}>
                    {/* Name */}
                    <div className="text-center w-full min-h-[3rem] flex flex-col items-center justify-center">
                      <h3 className="text-2xl font-black tracking-tight text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-tight">
                        {card.name}
                      </h3>
                    </div>

                    {/* Date — one line under title */}
                    <div className="text-center mt-2 mb-1">
                      <p className="text-blue-300 font-black text-lg tracking-wider">
                        {card.day} {(tr.months[card.month - 1] ?? '').toLowerCase()} {card.year}
                      </p>
                    </div>

                    {/* Clock */}
                    <div className="flex-1 flex items-center justify-center py-2">
                      <CosmicClock day={card.day} month={card.month} year={card.year} size={284} />
                    </div>

                    {/* Footer — legend + settings */}
                    <div className="w-full pt-4 border-t border-white/10 flex justify-between items-end mt-auto">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.7)] flex-shrink-0" />
                          <p className="text-blue-300 font-black text-base tracking-wide">
                            <span className="text-white/60 font-bold">{tr.legendYear}:</span>{' '}
                            {getHandHour((card.year % 100) * 3.6)} {tr.legendHour}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.7)] flex-shrink-0" />
                          <p className="text-purple-300 font-black text-base tracking-wide">
                            <span className="text-white/60 font-bold">{tr.legendMonth}:</span>{' '}
                            {getHandHour((card.month - 1) * 30)} {tr.legendHour}
                          </p>
                        </div>
                      </div>
                      {!isDragMode && (
                        <button
                          onClick={() => setEditingId(card.id)}
                          className="p-2.5 bg-white/5 hover:bg-blue-500/15 text-white/25 hover:text-blue-400 transition-all rounded-xl border border-white/5 hover:border-blue-500/30"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Drag mode overlay */}
                {isDragMode && editingId !== card.id && (
                  <div className="absolute inset-0 z-20 rounded-[2.5rem] flex items-center justify-between px-4 pointer-events-none bg-indigo-950/15 backdrop-blur-[1px]">
                    <button
                      onClick={() => moveCard(idx, idx - 1)}
                      disabled={idx === 0}
                      className="pointer-events-auto p-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white/60 hover:text-white disabled:opacity-0 transition-all"
                    >
                      <ChevronLeft className="w-12 h-12" />
                    </button>
                    <button
                      onClick={() => moveCard(idx, idx + 1)}
                      disabled={idx === cards.length - 1}
                      className="pointer-events-auto p-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white/60 hover:text-white disabled:opacity-0 transition-all"
                    >
                      <ChevronRight className="w-12 h-12" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}

            <motion.div layout className="h-[580px] relative">
              {isAdding && !isDragMode ? (
                <CardForm onSave={addCard} onCancel={() => setIsAdding(false)} isNew />
              ) : (
                <button
                  onClick={() => !isDragMode && setIsAdding(true)}
                  className={`w-full h-full rounded-[2.5rem] border border-dashed border-indigo-400/30 bg-indigo-950/40 transition-all duration-500 flex flex-col items-center justify-center gap-6 text-indigo-300/60 backdrop-blur-sm ${!isDragMode ? 'hover:bg-indigo-900/50 hover:border-indigo-400/60 hover:text-indigo-200 group cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`p-7 rounded-full border border-indigo-400/25 bg-indigo-500/10 transition-all duration-500 ${!isDragMode ? 'group-hover:bg-indigo-500/20 group-hover:border-indigo-400/50 group-hover:scale-110' : ''}`}>
                    <Plus className="w-10 h-10" />
                  </div>
                  <span className={`font-bold tracking-[0.25em] text-base uppercase transition-colors ${!isDragMode ? 'text-indigo-300/80 group-hover:text-indigo-100' : 'text-indigo-300/80'}`}>{tr.addCard}</span>
                </button>
              )}
              {isDragMode && (
                <div className="absolute inset-0 rounded-[2.5rem] bg-indigo-950/15 backdrop-blur-[1px] pointer-events-none" />
              )}
            </motion.div>
          </>
        </div>
      </main>

      <footer className="relative z-10 py-20 text-center opacity-10">
        <p className="text-[9px] tracking-[0.5em] uppercase font-bold">Celestial Map Engine • 2026</p>
      </footer>

      {/* Auth Modal */}
      <>
        {authModal && (
          <AuthModal
            mode={authModal}
            onClose={() => setAuthModal(null)}
            onSuccess={(email) => { setUser(email); setAuthModal(null); }}
          />
        )}
      </>

      <ToastContainer toasts={toasts} />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}

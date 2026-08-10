import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CosmicClock, getHandHour } from './components/CosmicClock';
import { CardForm } from './components/CardForm';
import { AuthModal } from './components/AuthModal';
import { LangProvider, useLang } from './contexts/LangContext';
import { languages } from './i18n';
import { Plus, Settings, LogOut } from 'lucide-react';

interface CardData {
  id: string;
  name: string;
  day: number;
  month: number;
  year: number;
}

function AppInner() {
  const { lang, setLang, tr } = useLang();

  const [cards, setCards] = useState<CardData[]>([
    { id: '1', name: 'Персональная карта', day: 15, month: 5, year: 1995 },
    { id: '2', name: 'Транзиты 2026', day: 12, month: 2, year: 2026 },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const [user, setUser] = useState<string | null>(null);

  const addCard = (data: Omit<CardData, 'id'>) => {
    setCards([...cards, { ...data, id: Date.now().toString() }]);
    setIsAdding(false);
  };

  const updateCard = (id: string, data: Omit<CardData, 'id'>) => {
    setCards(cards.map(c => c.id === id ? { ...data, id } : c));
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
      <nav className="relative z-10 px-8 pt-8 pb-16 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Language switcher — segmented control */}
        <div className="flex items-center border border-white/25 rounded-xl overflow-hidden">
          {languages.map((l, idx) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-3 py-1.5 text-xs font-bold tracking-widest transition-all ${
                idx > 0 ? 'border-l border-white/25' : ''
              } ${
                lang === l.code
                  ? 'bg-blue-500/25 text-blue-300'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <motion.div
          initial="initial"
          whileHover="hover"
          className="text-center relative group cursor-default flex-1"
        >
          <motion.svg
            variants={{ initial: { filter: 'drop-shadow(0 0 0px rgba(59,130,246,0))', scale: 1 }, hover: { filter: 'drop-shadow(0 0 18px rgba(59,130,246,0.65))', scale: 1.04 } }}
            viewBox="0 0 720 65"
            className="w-full max-w-lg md:max-w-xl mx-auto"
            overflow="visible"
            style={{ transition: 'filter 0.5s, transform 0.5s' }}
          >
            <defs>
              <path id="titleArc" d="M 10,58 A 3410,3410 0 0,1 710,58" />
            </defs>
            <text
              fill="white"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="800"
              fontSize="57"
              letterSpacing="7"
            >
              <textPath href="#titleArc" startOffset="50%" textAnchor="middle">
                {tr.title}
              </textPath>
            </text>
          </motion.svg>
        </motion.div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center border border-white/25 rounded-xl overflow-hidden">
              <span className="px-4 py-2 text-sm font-bold text-white/70 border-r border-white/25 max-w-[130px] truncate hidden sm:block">
                {user}
              </span>
              <button
                onClick={() => setUser(null)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-300 hover:text-white hover:bg-blue-500/30 transition-all"
              >
                <LogOut className="w-4 h-4" />
                {tr.logout}
              </button>
            </div>
          ) : (
            <div className="flex items-center border border-white/25 rounded-xl overflow-hidden">
              <button
                onClick={() => setAuthModal('login')}
                className="px-4 py-2 text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all border-r border-white/25"
              >
                {tr.login}
              </button>
              <button
                onClick={() => setAuthModal('register')}
                className="px-4 py-2 text-sm font-bold text-blue-300 hover:text-white hover:bg-blue-500/30 transition-all"
              >
                {tr.register}
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          <AnimatePresence mode="popLayout">
            {cards.map((card) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
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
                  <motion.div className="w-full h-full bg-indigo-950/80 backdrop-blur-2xl border border-indigo-400/20 rounded-[2.5rem] p-8 hover:bg-indigo-950/90 transition-all duration-500 flex flex-col items-center group-hover:border-indigo-400/35 shadow-2xl shadow-indigo-950 relative">
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
                      <button
                        onClick={() => setEditingId(card.id)}
                        className="p-2.5 bg-white/5 hover:bg-blue-500/15 text-white/25 hover:text-blue-400 transition-all rounded-xl border border-white/5 hover:border-blue-500/30"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}

            <motion.div layout className="h-[580px]">
              {isAdding ? (
                <CardForm onSave={addCard} onCancel={() => setIsAdding(false)} isNew />
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full h-full rounded-[2.5rem] border border-dashed border-white/10 hover:border-blue-500/30 hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center gap-6 text-white/20 group"
                >
                  <div className="p-8 rounded-full bg-white/5 group-hover:bg-blue-500/10 transition-all group-hover:scale-105">
                    <Plus className="w-10 h-10" />
                  </div>
                  <span className="font-bold tracking-[0.3em] text-xs uppercase">{tr.addCard}</span>
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="relative z-10 py-20 text-center opacity-10">
        <p className="text-[9px] tracking-[0.5em] uppercase font-bold">Celestial Map Engine • 2026</p>
      </footer>

      {/* Auth Modal */}
      <AnimatePresence>
        {authModal && (
          <AuthModal
            mode={authModal}
            onClose={() => setAuthModal(null)}
            onSuccess={(email) => { setUser(email); setAuthModal(null); }}
          />
        )}
      </AnimatePresence>
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

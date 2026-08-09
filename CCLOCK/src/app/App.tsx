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
      <nav className="relative z-10 px-8 pt-8 pb-16 max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Language switcher */}
        <div className="flex items-center gap-1.5">
          {languages.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-bold tracking-widest transition-all ${
                lang === l.code
                  ? 'bg-blue-500/25 text-blue-300 border border-blue-400/50'
                  : 'text-white/55 hover:text-white/90 border border-white/15 hover:border-white/35'
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
          <motion.div
            variants={{ initial: { width: '40px', height: '1px', opacity: 0.4 }, hover: { width: '100%', height: '2px', opacity: 1 } }}
            className="bg-blue-500 mx-auto mb-4 transition-all duration-700"
          />
          <motion.h1
            variants={{ initial: { scale: 1, textShadow: '0 0 0px rgba(59,130,246,0)' }, hover: { scale: 1.05, textShadow: '0 0 30px rgba(59,130,246,0.6)' } }}
            className="text-3xl md:text-5xl font-extrabold tracking-[0.2em] text-white transition-all duration-500"
          >
            {tr.title}
          </motion.h1>
          <motion.div
            variants={{ initial: { width: '40px', height: '1px', opacity: 0.4 }, hover: { width: '100%', height: '2px', opacity: 1 } }}
            className="bg-blue-500 mx-auto mt-4 transition-all duration-700"
          />
        </motion.div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-white/60 text-sm hidden sm:block max-w-[120px] truncate">{user}</span>
              <button
                onClick={() => setUser(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white/60 hover:text-white border border-white/20 hover:border-white/40 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                {tr.logout}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setAuthModal('login')}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white/70 hover:text-white border border-white/20 hover:border-white/45 transition-all"
              >
                {tr.login}
              </button>
              <button
                onClick={() => setAuthModal('register')}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40 hover:bg-blue-500/35 hover:text-blue-200 transition-all"
              >
                {tr.register}
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-10">
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
                  <motion.div className="w-full h-full bg-white/[0.12] backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 hover:bg-white/[0.16] transition-all duration-500 flex flex-col items-center group-hover:border-white/30 shadow-2xl relative">
                    {/* Name */}
                    <div className="text-center w-full min-h-[3rem] flex flex-col items-center justify-center">
                      <h3 className="text-2xl font-black tracking-tight text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-tight">
                        {card.name}
                      </h3>
                    </div>

                    {/* Date — one line under title */}
                    <div className="text-center mt-2 mb-1">
                      <p className="text-blue-300 font-black text-sm uppercase tracking-wider">
                        {card.day} {tr.months[card.month - 1]} {card.year}
                      </p>
                    </div>

                    {/* Clock */}
                    <div className="flex-1 flex items-center justify-center py-2">
                      <CosmicClock day={card.day} month={card.month} year={card.year} size={284} />
                    </div>

                    {/* Footer — legend + settings */}
                    <div className="w-full pt-4 border-t border-white/10 flex justify-between items-end mt-auto">
                      <div className="flex flex-col gap-1">
                        <p className="text-blue-300 font-black text-base tracking-wide">
                          <span className="text-white/60 font-bold">{tr.legendYear}:</span>{' '}
                          {getHandHour((card.year % 100) * 3.6)} {tr.legendHour}
                        </p>
                        <p className="text-purple-300 font-black text-base tracking-wide">
                          <span className="text-white/60 font-bold">{tr.legendMonth}:</span>{' '}
                          {getHandHour((card.month - 1) * 30)} {tr.legendHour}
                        </p>
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

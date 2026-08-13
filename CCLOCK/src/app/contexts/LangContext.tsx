import React, { createContext, useContext, useState } from 'react';
import { Lang, t } from '../i18n';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: typeof t['ru'];
}

const LangContext = createContext<LangContextValue>({
  lang: 'ru',
  setLang: () => {},
  tr: t['ru'],
});

export const LangProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Lang>('ru');
  return (
    <LangContext.Provider value={{ lang, setLang, tr: t[lang] }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);

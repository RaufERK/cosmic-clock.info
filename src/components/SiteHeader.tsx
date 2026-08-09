"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

const localeLabel: Record<AppLocale, string> = {
  en: "EN",
  ru: "RU",
  es: "ES",
  pt: "PT",
};

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-8">
      <Link
        href="/"
        className="text-sm tracking-[0.35em] uppercase text-white/80 hover:text-white transition-colors"
      >
        Cosmic Clock
      </Link>

      <nav className="flex items-center gap-6 text-sm text-white/60">
        <Link href="/" className="hover:text-white transition-colors">
          {t("home")}
        </Link>
        <Link href="/cards" className="hover:text-white transition-colors">
          {t("cards")}
        </Link>
        <Link href="/login" className="hover:text-white transition-colors">
          {t("login")}
        </Link>

        <div className="flex gap-2 border-l border-white/10 pl-4">
          {routing.locales.map((item) => (
            <Link
              key={item}
              href={pathname}
              locale={item}
              className={
                item === locale
                  ? "text-blue-400"
                  : "hover:text-white transition-colors"
              }
            >
              {localeLabel[item]}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

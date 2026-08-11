"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LogOut, Plus, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { AuthModal } from "@/components/AuthModal";
import { CardForm, type CardFormValues } from "@/components/CardForm";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { CosmicClock } from "@/components/CosmicClock";
import { Toast, type ToastMessage, type ToastVariant } from "@/components/Toast";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  createCardAction,
  deleteCardAction,
  listMyCardsAction,
  mergeLocalCardsAction,
  updateCardAction,
  type CardActionResult,
  type MergeCardsResult,
} from "@/lib/card-actions";
import { touchLastSeenAction } from "@/lib/auth-actions";
import { type CardData } from "@/lib/cards";
import {
  addGuestCard,
  clearGuestCards,
  loadOrSeedGuestCards,
  readGuestCards,
  removeGuestCard,
  updateGuestCard,
} from "@/lib/guest-cards";
import {
  civilDate,
  computeHandRotations,
  getHandHourIndex,
} from "@/lib/cosmic-clock-math";

const LOCALE_ORDER: AppLocale[] = ["ru", "en", "es", "pt"];
const LOCALE_LABEL: Record<AppLocale, string> = {
  ru: "RU",
  en: "EN",
  es: "ES",
  pt: "PT",
};

const STARFIELD_URL =
  "https://images.unsplash.com/photo-1580163238333-aeab3b0a112d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFyJTIwdHJhaWxzJTIwbmlnaHQlMjBza3klMjBkZWVwJTIwc3BhY2UlMjBwdXJwbGUlMjBibHVlfGVufDF8fHx8MTc3MDg5Nzg0NHww&ixlib=rb-4.1.0&q=80&w=1080";

export function CosmicApp() {
  const t = useTranslations("app");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const months = t.raw("months") as string[];
  const clockHours = t.raw("clockHours") as string[];
  const { data: session, status, update } = useSession();
  const [logoutPending, startLogout] = useTransition();
  const [cardsPending, startCardsTransition] = useTransition();

  const [cards, setCards] = useState<CardData[]>([]);
  const [ready, setReady] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const userLogin = session?.user?.login ?? null;
  const isLoggedIn = Boolean(session?.user?.id && session?.user?.login);
  const sessionReady = status !== "loading";

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  function showToast(text: string, variant: ToastVariant) {
    setToast({ id: Date.now(), text, variant });
  }

  function cardErrorMessage(result: CardActionResult): string {
    if (result.ok) return "";
    switch (result.error) {
      case "unauthorized":
        return t("cardErrorUnauthorized");
      case "invalid":
        return t("cardErrorInvalid");
      case "not_found":
        return t("cardErrorNotFound");
      case "limit":
        return t("cardErrorLimit");
      case "duplicate_date":
        return t("cardErrorDuplicateDate");
      case "unknown":
        return t("cardErrorUnknown");
      default: {
        const _exhaustive: never = result.error;
        return _exhaustive;
      }
    }
  }

  function mergeInfoMessage(result: Extract<MergeCardsResult, { ok: true }>): string {
    const parts: string[] = [t("mergeDone")];
    if (result.added > 0) {
      parts.push(t("mergeAdded", { count: result.added }));
    }
    if (result.mergedDates > 0) {
      parts.push(t("mergeDeduped", { count: result.mergedDates }));
    }
    if (result.truncated > 0) {
      parts.push(t("mergeTruncated", { count: result.truncated }));
    }
    return parts.join(" ");
  }

  useEffect(() => {
    if (!sessionReady) return;

    let cancelled = false;

    queueMicrotask(() => {
      void (async () => {
        setEditingId(null);
        setIsAdding(false);
        setReady(false);

        if (!session?.user?.id || !session.user.login) {
          if (!cancelled) {
            setCards(loadOrSeedGuestCards(t("exampleSummit")));
            setReady(true);
          }
          return;
        }

        void touchLastSeenAction();

        const local = readGuestCards();
        if (local.length > 0) {
          const mergeResult = await mergeLocalCardsAction(
            local.map((c) => ({
              name: c.name,
              day: c.day,
              month: c.month,
              year: c.year,
              updatedAt: c.updatedAt,
            })),
          );
          if (cancelled) return;

          if (!mergeResult.ok) {
            showToast(t("mergeError"), "error");
            setCards([]);
            setReady(true);
            return;
          }

          clearGuestCards();
          setCards(mergeResult.cards);
          showToast(mergeInfoMessage(mergeResult), "success");
          setReady(true);
          return;
        }

        // Mark this browser as non-first-visit even if there was nothing to merge.
        clearGuestCards();

        const result = await listMyCardsAction();
        if (cancelled) return;

        if (!result.ok) {
          showToast(cardErrorMessage(result), "error");
          setCards([]);
          setReady(true);
          return;
        }

        setCards(result.cards ?? []);
        setReady(true);
      })();
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, session?.user?.id, locale]);

  function addCard(data: CardFormValues) {
    if (!isLoggedIn) {
      const next = addGuestCard(
        cards.map((c) => ({
          ...c,
          updatedAt: c.updatedAt ?? new Date().toISOString(),
        })),
        data,
      );
      if (next === "duplicate") {
        showToast(t("cardErrorDuplicateDate"), "error");
        return;
      }
      if (next === "invalid") {
        showToast(t("cardErrorInvalid"), "error");
        return;
      }
      setCards(next);
      setIsAdding(false);
      return;
    }

    startCardsTransition(async () => {
      const result = await createCardAction(data);
      if (!result.ok) {
        showToast(cardErrorMessage(result), "error");
        return;
      }
      if (result.card) {
        setCards((prev) => [...prev, result.card!]);
      }
      setIsAdding(false);
    });
  }

  function updateCard(id: string, data: CardFormValues) {
    if (!isLoggedIn) {
      const next = updateGuestCard(
        cards.map((c) => ({
          ...c,
          updatedAt: c.updatedAt ?? new Date().toISOString(),
        })),
        id,
        data,
      );
      if (next === "duplicate") {
        showToast(t("cardErrorDuplicateDate"), "error");
        return;
      }
      if (next === "invalid") {
        showToast(t("cardErrorInvalid"), "error");
        return;
      }
      if (next === "not_found") {
        showToast(t("cardErrorNotFound"), "error");
        return;
      }
      setCards(next);
      setEditingId(null);
      return;
    }

    startCardsTransition(async () => {
      const result = await updateCardAction(id, data);
      if (!result.ok) {
        showToast(cardErrorMessage(result), "error");
        return;
      }
      if (result.card) {
        setCards((prev) =>
          prev.map((card) => (card.id === id ? result.card! : card)),
        );
      }
      setEditingId(null);
    });
  }

  function removeCard(id: string) {
    if (!isLoggedIn) {
      setCards(
        removeGuestCard(
          cards.map((c) => ({
            ...c,
            updatedAt: c.updatedAt ?? new Date().toISOString(),
          })),
          id,
        ),
      );
      setEditingId(null);
      return;
    }

    startCardsTransition(async () => {
      const result = await deleteCardAction(id);
      if (!result.ok) {
        showToast(cardErrorMessage(result), "error");
        return;
      }
      setCards((prev) => prev.filter((card) => card.id !== id));
      setEditingId(null);
    });
  }

  function onSettingsClick(cardId: string) {
    setEditingId(cardId);
  }

  function onAddClick() {
    setIsAdding(true);
  }

  async function onAuthSuccess() {
    setAuthModal(null);
    await update();
  }

  function onLogout() {
    startLogout(async () => {
      await signOut({ redirect: false });
    });
  }

  const locales = LOCALE_ORDER.filter((code) =>
    routing.locales.includes(code),
  );

  return (
    <div className="min-h-screen bg-[#020205] text-white selection:bg-blue-500/30">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-30 mix-blend-screen"
          style={{ backgroundImage: `url('${STARFIELD_URL}')` }}
        />
        <div className="absolute top-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[60%] w-[60%] rounded-full bg-purple-600/10 blur-[150px]" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 pt-8 pb-16 md:flex-row">
        <div className="flex items-center overflow-hidden rounded-xl border border-white/25">
          {locales.map((code, idx) => (
            <Link
              key={code}
              href={pathname}
              locale={code}
              className={`px-3 py-1.5 text-xs font-bold tracking-widest transition-all ${
                idx > 0 ? "border-l border-white/25" : ""
              } ${
                locale === code
                  ? "bg-blue-500/25 text-blue-300"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {LOCALE_LABEL[code]}
            </Link>
          ))}
        </div>

        <motion.div
          initial="initial"
          whileHover="hover"
          className="group relative flex-1 cursor-default text-center"
        >
          <motion.svg
            variants={{
              initial: {
                filter: "drop-shadow(0 0 0px rgba(59,130,246,0))",
                scale: 1,
              },
              hover: {
                filter: "drop-shadow(0 0 18px rgba(59,130,246,0.65))",
                scale: 1.04,
              },
            }}
            viewBox="0 0 720 65"
            className="mx-auto w-full max-w-lg md:max-w-xl"
            overflow="visible"
            style={{ transition: "filter 0.5s, transform 0.5s" }}
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
                {t("title")}
              </textPath>
            </text>
          </motion.svg>
        </motion.div>

        <div className="flex items-center gap-2">
          {userLogin ? (
            <div className="flex items-center overflow-hidden rounded-xl border border-white/25">
              <button
                type="button"
                onClick={() => setChangePasswordOpen(true)}
                title={t("changePasswordTitle")}
                className="max-w-[7rem] truncate border-r border-white/25 px-3 py-2 text-sm font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white sm:max-w-[130px] sm:px-4"
              >
                {userLogin}
              </button>
              <button
                type="button"
                onClick={onLogout}
                disabled={logoutPending || status === "loading"}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-300 transition-all hover:bg-blue-500/30 hover:text-white disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {t("logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center overflow-hidden rounded-xl border border-white/25">
              <button
                type="button"
                onClick={() => setAuthModal("login")}
                className="border-r border-white/25 px-4 py-2 text-sm font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white"
              >
                {t("login")}
              </button>
              <button
                type="button"
                onClick={() => setAuthModal("register")}
                className="px-4 py-2 text-sm font-bold text-blue-300 transition-all hover:bg-blue-500/30 hover:text-white"
              >
                {t("register")}
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-8 pb-32">
        {!isLoggedIn && ready ? (
          <p className="mb-8 text-center text-sm text-white/40">
            {t("guestHint")}
          </p>
        ) : null}

        {!ready ? (
          <div className="py-24 text-center text-white/30">{t("loading")}</div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-3 ${
              cardsPending ? "opacity-70" : ""
            }`}
          >
            <AnimatePresence mode="popLayout">
              {cards.map((card) => {
                const hands = computeHandRotations(
                  civilDate(card.year, card.month, card.day),
                );
                return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative h-[580px]"
                >
                  {editingId === card.id ? (
                    <CardForm
                      initialData={card}
                      onSave={(data) => updateCard(card.id, data)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => removeCard(card.id)}
                    />
                  ) : (
                    <motion.div className="relative flex h-full w-full flex-col items-center rounded-[2.5rem] border border-indigo-400/20 bg-indigo-950/80 p-8 shadow-2xl shadow-indigo-950 backdrop-blur-2xl transition-all duration-500 group-hover:border-indigo-400/35 group-hover:bg-indigo-950/90">
                      <div className="flex min-h-[3rem] w-full flex-col items-center justify-center text-center">
                        <h3 className="line-clamp-2 text-2xl leading-tight font-black tracking-tight text-white/90 transition-colors group-hover:text-white">
                          {card.name}
                        </h3>
                      </div>

                      <div className="mt-2 mb-1 text-center">
                        <p className="text-lg font-black tracking-wider text-blue-300">
                          {card.day}{" "}
                          {(months[card.month - 1] ?? "").toLowerCase()}{" "}
                          {card.year}
                        </p>
                      </div>

                      <div className="flex flex-1 items-center justify-center py-2">
                        <CosmicClock
                          day={card.day}
                          month={card.month}
                          year={card.year}
                          size={284}
                        />
                      </div>

                      <div className="mt-auto flex w-full items-end justify-between border-t border-white/10 pt-4">
                        <div className="min-w-0 flex-1 flex flex-col gap-1 pr-2">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-sm bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.7)]" />
                            <p className="min-w-0 text-[13px] leading-snug font-medium tracking-wide text-blue-300/95 sm:text-sm">
                              <span className="font-semibold text-white/50">
                                {t("legendYear")}:
                              </span>{" "}
                              {clockHours[getHandHourIndex(hands.year)] ?? ""}
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-sm bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.7)]" />
                            <p className="min-w-0 text-[13px] leading-snug font-medium tracking-wide text-purple-300/95 sm:text-sm">
                              <span className="font-semibold text-white/50">
                                {t("legendMonth")}:
                              </span>{" "}
                              {clockHours[getHandHourIndex(hands.month)] ?? ""}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSettingsClick(card.id)}
                          className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-white/25 transition-all hover:border-blue-500/30 hover:bg-blue-500/15 hover:text-blue-400"
                        >
                          <Settings className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
                );
              })}

              <motion.div layout className="h-[580px]">
                {isAdding ? (
                  <CardForm
                    onSave={addCard}
                    onCancel={() => setIsAdding(false)}
                    isNew
                  />
                ) : (
                  <button
                    type="button"
                    onClick={onAddClick}
                    className="group flex h-full w-full flex-col items-center justify-center gap-6 rounded-[2.5rem] border border-dashed border-indigo-300/35 bg-indigo-950/45 text-white/65 shadow-lg shadow-indigo-950/30 backdrop-blur-md transition-all hover:border-blue-400/50 hover:bg-indigo-900/55 hover:text-white/90"
                  >
                    <div className="rounded-full border border-white/15 bg-white/12 p-8 text-blue-200/90 transition-all group-hover:scale-105 group-hover:border-blue-400/35 group-hover:bg-blue-500/20 group-hover:text-blue-100">
                      <Plus className="h-10 w-10" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-black tracking-[0.28em] text-white/75 uppercase drop-shadow-sm group-hover:text-white/95">
                      {t("addCard")}
                    </span>
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      <footer className="relative z-10 py-20 text-center opacity-10">
        <p className="text-[9px] font-bold tracking-[0.5em] uppercase">
          {t("footer")}
        </p>
      </footer>

      <AnimatePresence>
        {authModal ? (
          <AuthModal
            key={authModal}
            mode={authModal}
            onClose={() => setAuthModal(null)}
            onSuccess={onAuthSuccess}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {changePasswordOpen && userLogin ? (
          <ChangePasswordModal
            login={userLogin}
            onClose={() => setChangePasswordOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  LogOut,
  Plus,
  Settings,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { AuthModal } from "@/components/AuthModal";
import { CardForm, type CardFormValues } from "@/components/CardForm";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { CosmicClock } from "@/components/CosmicClock";
import { Toast, type ToastMessage, type ToastVariant } from "@/components/Toast";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  createCardAction,
  deleteCardAction,
  listMyCardsAction,
  mergeLocalCardsAction,
  reorderCardsAction,
  updateCardAction,
  type CardActionResult,
  type MergeCardsResult,
} from "@/lib/card-actions";
import { touchLastSeenAction } from "@/lib/auth-actions";
import { reportGuestCardCreate } from "@/lib/guest-card-stats";
import {
  type CardData,
  isGuestExampleSeedDate,
  moveCardInList,
  sortCardsBySortIndex,
  withDenseSortIndex,
} from "@/lib/cards";
import {
  addGuestCard,
  clearGuestCards,
  loadOrSeedGuestCards,
  readGuestCards,
  removeGuestCard,
  reorderGuestCards,
  updateGuestCard,
  type LocalCard,
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
  const router = useRouter();
  const months = t.raw("months") as string[];
  const clockHours = t.raw("clockHours") as string[];
  const { data: session, status, update } = useSession();
  const [logoutPending, startLogout] = useTransition();
  const [cardsPending, startCardsTransition] = useTransition();

  const [cards, setCards] = useState<CardData[]>([]);
  const [ready, setReady] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const userLogin = session?.user?.login ?? null;
  const isLoggedIn = Boolean(session?.user?.id && session?.user?.login);
  const sessionReady = status !== "loading";

  function toLocalCards(list: CardData[]): LocalCard[] {
    const stamped = new Date().toISOString();
    return list.map((c) => ({
      ...c,
      sortIndex: c.sortIndex,
      createdAt: c.createdAt ?? c.updatedAt ?? stamped,
      updatedAt: c.updatedAt ?? c.createdAt ?? stamped,
    }));
  }

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
        setIsDragMode(false);
        setReady(false);

        if (!session?.user?.id || !session.user.login) {
          if (!cancelled) {
            setCards(loadOrSeedGuestCards(t("exampleSummit")));
            setReady(true);
          }
          return;
        }

        void touchLastSeenAction();

        const local = readGuestCards().filter(
          (c) => !isGuestExampleSeedDate(c),
        );
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

  useEffect(() => {
    if (!isDragMode) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDragMode(false);
        setDragIndex(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDragMode]);

  useEffect(() => {
    if (cards.length > 1 || !isDragMode) return;
    setIsDragMode(false);
    setDragIndex(null);
  }, [cards.length, isDragMode]);

  useEffect(() => {
    if (!langMenuOpen) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (!langMenuRef.current?.contains(target)) {
        setLangMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [langMenuOpen]);

  function addCard(data: CardFormValues) {
    if (!isLoggedIn) {
      const next = addGuestCard(toLocalCards(cards), data);
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
      reportGuestCardCreate(data);
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
      const next = updateGuestCard(toLocalCards(cards), id, data);
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
          prev.map((card) => {
            if (card.id !== id) return card;
            // Keep local createdAt if server omits it — edits must not reshuffle.
            return {
              ...result.card!,
              createdAt: result.card!.createdAt ?? card.createdAt,
              sortIndex: result.card!.sortIndex ?? card.sortIndex,
            };
          }),
        );
      }
      setEditingId(null);
    });
  }

  function removeCard(id: string) {
    if (!isLoggedIn) {
      setCards(removeGuestCard(toLocalCards(cards), id));
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
    if (isDragMode) return;
    setEditingId(cardId);
  }

  function onAddClick() {
    if (isDragMode) return;
    setIsAdding(true);
  }

  function toggleDragMode() {
    setIsDragMode((open) => !open);
    setDragIndex(null);
    setEditingId(null);
    setIsAdding(false);
  }

  function moveCard(from: number, to: number) {
    const ordered = sortCardsBySortIndex(cards);
    const moved = withDenseSortIndex(moveCardInList(ordered, from, to));
    if (moved.length === 0 || moved.every((card, i) => card.id === ordered[i]?.id)) {
      return;
    }
    setCards(moved);
    const orderedIds = moved.map((card) => card.id);
    if (!isLoggedIn) {
      const result = reorderGuestCards(toLocalCards(moved), orderedIds);
      if (result === "invalid") {
        showToast(t("cardErrorUnknown"), "error");
      }
      return;
    }
    startCardsTransition(async () => {
      const result = await reorderCardsAction(orderedIds);
      if (!result.ok) {
        showToast(cardErrorMessage(result), "error");
        return;
      }
      if (result.cards) setCards(result.cards);
    });
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

      <nav className="relative z-40 mx-auto w-full max-w-7xl px-5 pt-4 pb-8 md:px-8 md:pt-8 md:pb-12 lg:px-10">
        {/* Mobile: language select + auth, then full-bleed title */}
        <div className="mb-8 flex items-center justify-between gap-3 md:hidden">
          <div ref={langMenuRef} className="relative">
            <button
              type="button"
              aria-label="Language"
              aria-expanded={langMenuOpen}
              aria-haspopup="listbox"
              onClick={() => setLangMenuOpen((open) => !open)}
              className="flex items-center gap-1 rounded-xl border border-white/25 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white"
            >
              {LOCALE_LABEL[locale]}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${langMenuOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {langMenuOpen ? (
              <ul
                role="listbox"
                className="absolute top-full left-0 z-50 mt-1.5 min-w-[4.5rem] overflow-hidden rounded-xl border border-white/25 bg-[#0a0a20] shadow-xl"
              >
                {locales.map((code) => (
                  <li key={code} role="option" aria-selected={locale === code}>
                    <button
                      type="button"
                      onClick={() => {
                        setLangMenuOpen(false);
                        if (code !== locale) {
                          router.replace(pathname, { locale: code });
                        }
                      }}
                      className={`block w-full px-2.5 py-1.5 text-left text-xs font-bold transition-all ${
                        locale === code
                          ? "bg-blue-500/25 text-blue-300"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {LOCALE_LABEL[code]}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex items-center overflow-hidden rounded-xl border border-white/25">
            {userLogin ? (
              <>
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(true)}
                  title={t("changePasswordTitle")}
                  className="max-w-[5.5rem] truncate border-r border-white/25 px-2.5 py-1.5 text-xs font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white"
                >
                  {userLogin}
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={logoutPending || status === "loading"}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-300 transition-all hover:bg-blue-500/30 hover:text-white disabled:opacity-60"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAuthModal("login")}
                  className="border-r border-white/25 px-2.5 py-1.5 text-xs font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white"
                >
                  {t("login")}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthModal("register")}
                  className="px-2.5 py-1.5 text-xs font-bold text-blue-300 transition-all hover:bg-blue-500/30 hover:text-white"
                >
                  {t("register")}
                </button>
              </>
            )}
          </div>
        </div>

        <motion.div
          initial="initial"
          whileHover="hover"
          className="-mx-5 cursor-default text-center md:hidden"
        >
          <motion.svg
            variants={{
              initial: {
                filter: "drop-shadow(0 0 0px rgba(59,130,246,0))",
              },
              hover: {
                filter: "drop-shadow(0 0 18px rgba(59,130,246,0.65))",
              },
            }}
            viewBox="0 0 720 65"
            className="mx-auto w-full"
            overflow="visible"
            style={{ transition: "filter 0.5s" }}
          >
            <defs>
              <path
                id="titleArcMobile"
                d="M 10,58 A 3410,3410 0 0,1 710,58"
              />
            </defs>
            <text
              fill="white"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="800"
              fontSize="52"
              letterSpacing="5"
            >
              <textPath
                href="#titleArcMobile"
                startOffset="50%"
                textAnchor="middle"
              >
                {t("title")}
              </textPath>
            </text>
          </motion.svg>
        </motion.div>

        {/* Desktop: language | title | auth */}
        <div className="hidden items-center justify-between gap-4 md:flex">
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
            className="flex-1 cursor-default text-center"
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
              className="mx-auto w-full max-w-xl"
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
                <textPath
                  href="#titleArc"
                  startOffset="50%"
                  textAnchor="middle"
                >
                  {t("title")}
                </textPath>
              </text>
            </motion.svg>
          </motion.div>

          <div className="flex items-center overflow-hidden rounded-xl border border-white/25">
            {userLogin ? (
              <>
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(true)}
                  title={t("changePasswordTitle")}
                  className="max-w-[130px] truncate border-r border-white/25 px-4 py-2 text-sm font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white"
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
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto mb-10 w-full max-w-7xl px-6 sm:px-8 lg:px-10">
        {ready && cards.length > 1 ? (
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <button
              type="button"
              onClick={toggleDragMode}
              title={isDragMode ? t("reorderLock") : t("reorderUnlock")}
              aria-label={isDragMode ? t("reorderLock") : t("reorderUnlock")}
              aria-pressed={isDragMode}
              className={`flex-shrink-0 rounded-xl border p-2.5 transition-all ${
                isDragMode
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
                  : "border-white/20 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
              }`}
            >
              {isDragMode ? (
                <LockOpen className="h-4 w-4" aria-hidden />
              ) : (
                <Lock className="h-4 w-4" aria-hidden />
              )}
            </button>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        ) : (
          <div className="h-px w-full bg-white/10" />
        )}
      </div>

      <main className="relative z-10 mx-auto w-full px-6 pb-32 sm:px-8 lg:px-10">
        {!ready ? (
          <div className="py-24 text-center text-white/30">{t("loading")}</div>
        ) : (
          <div
            className={`grid justify-center gap-8 [grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),380px))] ${
              cardsPending ? "opacity-70" : ""
            }`}
          >
            <AnimatePresence mode="popLayout">
              {sortCardsBySortIndex(cards).map((card, idx) => {
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
                  draggable={isDragMode}
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== idx) {
                      moveCard(dragIndex, idx);
                    }
                    setDragIndex(null);
                  }}
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
                    <motion.div
                      className={`relative flex h-full w-full flex-col items-center rounded-[2.5rem] border border-indigo-400/20 bg-indigo-950/80 p-8 shadow-2xl shadow-indigo-950 backdrop-blur-2xl transition-all duration-500 ${
                        isDragMode
                          ? "cursor-grab active:cursor-grabbing"
                          : "group-hover:border-indigo-400/35 group-hover:bg-indigo-950/90"
                      }`}
                    >
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
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 flex-shrink-0 rounded-sm bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.7)]" />
                            <p className="min-w-0 text-[13px] leading-snug font-medium tracking-wide text-blue-300/95 sm:text-sm">
                              <span className="font-semibold text-white/50">
                                {t("legendYear")}:
                              </span>{" "}
                              {clockHours[getHandHourIndex(hands.year)] ?? ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 flex-shrink-0 rounded-sm bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.7)]" />
                            <p className="min-w-0 text-[13px] leading-snug font-medium tracking-wide text-purple-300/95 sm:text-sm">
                              <span className="font-semibold text-white/50">
                                {t("legendMonth")}:
                              </span>{" "}
                              {clockHours[getHandHourIndex(hands.month)] ?? ""}
                            </p>
                          </div>
                        </div>
                        {!isDragMode ? (
                          <button
                            type="button"
                            onClick={() => onSettingsClick(card.id)}
                            className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-white/25 transition-all hover:border-blue-500/30 hover:bg-blue-500/15 hover:text-blue-400"
                          >
                            <Settings className="h-5 w-5" />
                          </button>
                        ) : null}
                      </div>
                    </motion.div>
                  )}

                  {isDragMode && editingId !== card.id ? (
                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between rounded-[2.5rem] bg-indigo-950/15 px-4 backdrop-blur-[1px]">
                      <button
                        type="button"
                        onClick={() => moveCard(idx, idx - 1)}
                        disabled={idx === 0}
                        className="pointer-events-auto rounded-2xl bg-white/15 p-4 text-white/60 transition-all hover:bg-white/25 hover:text-white disabled:opacity-0"
                      >
                        <ChevronLeft className="h-12 w-12" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCard(idx, idx + 1)}
                        disabled={idx === cards.length - 1}
                        className="pointer-events-auto rounded-2xl bg-white/15 p-4 text-white/60 transition-all hover:bg-white/25 hover:text-white disabled:opacity-0"
                      >
                        <ChevronRight className="h-12 w-12" />
                      </button>
                    </div>
                  ) : null}
                </motion.div>
                );
              })}

              <motion.div layout className="relative h-[580px]">
                {isAdding && !isDragMode ? (
                  <CardForm
                    onSave={addCard}
                    onCancel={() => setIsAdding(false)}
                    isNew
                  />
                ) : (
                  <button
                    type="button"
                    onClick={onAddClick}
                    className={`flex h-full w-full flex-col items-center justify-center gap-6 rounded-[2.5rem] border border-dashed border-indigo-400/30 bg-indigo-950/40 text-indigo-300/60 backdrop-blur-sm transition-all duration-500 ${
                      isDragMode
                        ? "cursor-default"
                        : "group hover:border-indigo-400/60 hover:bg-indigo-900/50 hover:text-indigo-200"
                    }`}
                  >
                    <div
                      className={`rounded-full border border-indigo-400/25 bg-indigo-500/10 p-7 transition-all duration-500 ${
                        isDragMode
                          ? ""
                          : "group-hover:scale-110 group-hover:border-indigo-400/50 group-hover:bg-indigo-500/20"
                      }`}
                    >
                      <Plus className="h-10 w-10" />
                    </div>
                    <span
                      className={`text-base font-bold tracking-[0.25em] text-indigo-300/80 uppercase transition-colors ${
                        isDragMode ? "" : "group-hover:text-indigo-100"
                      }`}
                    >
                      {t("addCard")}
                    </span>
                  </button>
                )}
                {isDragMode ? (
                  <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-indigo-950/15 backdrop-blur-[1px]" />
                ) : null}
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

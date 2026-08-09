import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CardsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cards");

  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-24 pt-6">
      <div className="mb-10 flex items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-wide text-white">
          {t("title")}
        </h1>
        <button
          type="button"
          disabled
          className="rounded-2xl border border-dashed border-white/15 px-5 py-2.5 text-sm text-white/35 cursor-not-allowed"
        >
          {t("add")}
        </button>
      </div>

      <div className="flex min-h-[320px] items-center justify-center rounded-[2.5rem] border border-dashed border-white/10 bg-white/[0.02]">
        <div className="max-w-sm text-center">
          <p className="text-lg text-white/50">{t("empty")}</p>
          <p className="mt-3 text-sm text-white/30">{t("comingSoon")}</p>
        </div>
      </div>
    </section>
  );
}

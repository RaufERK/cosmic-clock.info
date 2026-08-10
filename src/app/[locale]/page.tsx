import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClockPreview } from "@/components/ClockPreview";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-24 pt-10 text-center">
      <div className="mb-6 h-px w-10 bg-blue-500/70" />
      <h1 className="text-4xl md:text-6xl font-bold tracking-[0.12em] text-white">
        {t("headline")}
      </h1>
      <div className="mt-6 h-px w-10 bg-blue-500/70" />
      <p className="mt-8 max-w-xl text-lg text-white/55 leading-relaxed">
        {t("subtitle")}
      </p>
      <p className="mt-4 text-sm text-white/35">{t("status")}</p>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/cards"
          className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold tracking-wide text-black hover:bg-blue-50 transition-colors"
        >
          {t("ctaCards")}
        </Link>
        <Link
          href="/login"
          className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold tracking-wide text-white/80 hover:border-blue-500/40 hover:text-white transition-colors"
        >
          {t("ctaLogin")}
        </Link>
      </div>

      <ClockPreview />
    </section>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/LoginForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <section className="mx-auto w-full max-w-md px-6 pb-24 pt-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-center text-2xl font-bold tracking-wide text-white">
          {t("title")}
        </h1>
        <p className="mt-3 text-center text-sm text-white/40">{t("hint")}</p>
        <LoginForm />
      </div>
    </section>
  );
}

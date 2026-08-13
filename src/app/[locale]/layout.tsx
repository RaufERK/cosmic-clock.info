import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { UmamiScript } from "@/components/UmamiScript";
import { routing } from "@/i18n/routing";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
        { url: "/favicon-64.png", type: "image/png", sizes: "64x64" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full antialiased">
        <UmamiScript />
        <NextIntlClientProvider messages={messages}>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

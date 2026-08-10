import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Auth is a modal on the main prototype screen. */
export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}`);
}

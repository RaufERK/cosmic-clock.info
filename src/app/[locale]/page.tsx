import { setRequestLocale } from "next-intl/server";
import { CosmicApp } from "@/components/CosmicApp";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CosmicApp />;
}

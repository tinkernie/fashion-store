import { Metadata } from "next";

export const metadata: Metadata = {
  title: "درباره ما | ماوی MAVI",
  description:
    "آشنایی با خانه مد و پوشاک فاخر ماوی (MAVI)؛ رسالت ما در ارائه اصالت، طراحی مینیمال و متریال لوکس ارگانیک برای نسل جدید.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "درباره ما | فروشگاه تخصصی مد و پوشاک فاخر ماوی (MAVI)",
    description: "آشنایی با خانه مد و پوشاک فاخر ماوی (MAVI)",
    url: "/about",
    siteName: "ماوی MAVI",
    locale: "fa_IR",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

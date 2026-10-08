import { Metadata } from "next";

export const metadata: Metadata = {
  title: "جستجوی محصولات | ماوی MAVI",
  description:
    "جستجو و فیلتر پیشرفته محصولات، استایل‌ها و کالکشن‌های مد و پوشاک فاخر ماوی (MAVI)",
  alternates: {
    canonical: "/search",
  },
  robots: {
    index: false, // Search result pages should not be indexed by default per Google guidelines to prevent crawl bloat
    follow: true,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

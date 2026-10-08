import SearchPage from "@/app/search/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "کاتالوگ و لیست محصولات | ماوی MAVI",
  description:
    "مشاهده، جستجو و خرید آنلاین جدیدترین کالکشن‌های پوشاک، پیراهن، شومیز، اکسسوری و استایل مدرن در فروشگاه ماوی (MAVI)",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "کاتالوگ و لیست محصولات | ماوی MAVI",
    description:
      "مشاهده، جستجو و خرید آنلاین جدیدترین کالکشن‌های پوشاک، پیراهن و اکسسوری در ماوی (MAVI)",
    url: "/products",
    siteName: "ماوی MAVI",
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "کاتالوگ و لیست محصولات | ماوی MAVI",
    description:
      "مشاهده، جستجو و خرید آنلاین جدیدترین کالکشن‌های پوشاک، پیراهن و اکسسوری در ماوی (MAVI)",
  },
};

export default function ProductsPage() {
  return <SearchPage />;
}

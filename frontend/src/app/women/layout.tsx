import { Metadata } from "next";

export const metadata: Metadata = {
  title: "کالکشن پوشاک و استایل زنانه | ماوی MAVI",
  description:
    "مشاهده و خرید جدیدترین کالکشن‌های مد و پوشاک فاخر زنانه، پیراهن، شومیز، پالتو، بارانی و اکسسوری مدرن با بهترین کیفیت در فروشگاه ماوی (MAVI)",
  alternates: {
    canonical: "/women",
  },
  openGraph: {
    title: "کالکشن پوشاک و استایل زنانه | ماوی MAVI",
    description:
      "جدیدترین کالکشن‌های مد و پوشاک فاخر زنانه در فروشگاه ماوی (MAVI)",
    url: "/women",
    siteName: "ماوی MAVI",
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "کالکشن پوشاک و استایل زنانه | ماوی MAVI",
    description:
      "جدیدترین کالکشن‌های مد و پوشاک فاخر زنانه در فروشگاه ماوی (MAVI)",
  },
};

export default function WomenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

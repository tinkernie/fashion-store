import { Metadata } from "next";

export const metadata: Metadata = {
  title: "تماس با ما | ماوی MAVI",
  description:
    "راه‌های ارتباطی، پشتیبانی مشتریان، آدرس شوروم و پاسخ به پرسش‌های متداول در فروشگاه تخصصی مد و پوشاک فاخر ماوی (MAVI)",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "تماس با ما | ماوی MAVI",
    description: "راه‌های ارتباطی و پشتیبانی فروشگاه ماوی (MAVI)",
    url: "/contact",
    siteName: "ماوی MAVI",
    locale: "fa_IR",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/layout-shell";
import { Toaster } from "@/components/ui/sonner";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: {
    template: "%s | ماوی MAVI",
    default: "ماوی (MAVI) — فروشگاه تخصصی مد و پوشاک فاخر",
  },
  description: "فروشگاه تخصصی مد و پوشاک فاخر ماوی (MAVI)؛ جدیدترین کالکشن‌های پوشاک، پیراهن، شومیز، اکسسوری و استایل مدرن زنانه و مردانه",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#FAFCFE] text-[#0B192C] font-sans selection:bg-[#0082CA] selection:text-white">
        <LayoutShell>{children}</LayoutShell>
        <Toaster 
          position="bottom-center" 
          toastOptions={{
            className: "bg-white border border-sky-100 text-[#0B192C] shadow-xl shadow-sky-900/10",
            descriptionClassName: "text-slate-500 font-sans"
          }} 
        />
      </body>
    </html>
  );
}
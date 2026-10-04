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
  title: "Fashion Store",
  description: "فروشگاه لباس",
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
      className={`${vazirmatn.variable} antialiased dark`}
    >
      <body className="min-h-screen flex flex-col bg-[#0a0a0a] text-white font-sans selection:bg-[#0082CA] selection:text-white">
        <LayoutShell>{children}</LayoutShell>
        <Toaster 
          position="bottom-center" 
          toastOptions={{
            className: "bg-[#0B1B2F] border border-[#0082CA]/30 text-white shadow-lg shadow-[#0082CA]/10",
            descriptionClassName: "text-sky-200/70 font-sans"
          }} 
        />
      </body>
    </html>
  );
}
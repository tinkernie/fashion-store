import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "فروشگاه لباس زنانه",
  description: "طراحی مینیمال و باکلاس برای بانوان",
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
      <body className="min-h-screen flex flex-col bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <Toaster 
          position="bottom-center" 
          toastOptions={{
            className: "bg-[#111111] border border-white/10 text-white",
            descriptionClassName: "text-gray-400 font-sans"
          }} 
        />
      </body>
    </html>
  );
}
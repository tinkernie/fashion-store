import Link from "next/link";
import { Instagram, Twitter, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#111111] border-t border-white/5 py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Section */}
        <div className="md:col-span-2 space-y-4">
          <Link href="/" className="text-2xl font-black tracking-widest uppercase text-white">
            فشن استور
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            تولید و عرضه پوشاک با کیفیت پریمیوم. طراحی شده برای استایل خیابانی و روزمره شما با استفاده از بهترین متریال‌ها.
          </p>
        </div>
        
        {/* Quick Links */}
        <div className="space-y-4">
          <h4 className="text-white font-bold text-lg">دسترسی سریع</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/women" className="hover:text-white transition-colors">کالکشن بانوان</Link></li>
            <li><Link href="/men" className="hover:text-white transition-colors">کالکشن آقایان</Link></li>
            <li><Link href="/profile" className="hover:text-white transition-colors">پیگیری سفارش</Link></li>
            <li><Link href="/auth" className="hover:text-white transition-colors">حساب کاربری</Link></li>
          </ul>
        </div>

        {/* Contact & Socials */}
        <div className="space-y-4">
          <h4 className="text-white font-bold text-lg">ارتباط با ما</h4>
          <div className="flex items-center gap-4 text-gray-400">
            <a href="#" className="hover:text-white transition-colors outline-none"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="hover:text-white transition-colors outline-none"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="hover:text-white transition-colors outline-none"><Send className="w-5 h-5" /></a>
          </div>
          <p className="text-gray-500 text-sm mt-4 font-sans" dir="ltr">support@fashionstore.com</p>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="max-w-7xl mx-auto border-t border-white/10 mt-12 pt-6 text-center flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs">
        <p>© 2026 Fashion Store. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="#" className="hover:text-white transition-colors">قوانین و مقررات</Link>
          <Link href="#" className="hover:text-white transition-colors">حریم خصوصی</Link>
        </div>
      </div>
    </footer>
  );
}
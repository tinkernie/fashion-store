"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="bg-[#0B192C] text-white border-t border-sky-900/50 pt-16 sm:pt-20 pb-28 md:pb-12 px-4 sm:px-6 mt-16 sm:mt-24 shadow-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Column 1: Brand & Contact */}
          <div className="md:col-span-5 flex flex-col space-y-6">
            <Link href="/" className="text-3xl font-black tracking-widest uppercase text-white hover:text-sky-200 transition-colors drop-shadow-sm">
              فشن استور
            </Link>
            <p className="text-sky-100/80 text-sm leading-relaxed max-w-sm">
              مجموعه‌ای از بهترین طراحی‌های مینیمال و استایل خیابانی. ما به کیفیت متریال و اصالت در طراحی باور داریم.
            </p>
            
            <div className="flex flex-col space-y-4 pt-2">
              <div className="flex items-start gap-3 text-sky-100/90">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-[#5CAFE7] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-sm leading-relaxed">شعبه ۱: تهران، خیابان ولیعصر، بالاتر از پارک وی، پلاک ۱۲۳</span>
              </div>
              <div className="flex items-start gap-3 text-sky-100/90">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-[#5CAFE7] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-sm leading-relaxed">شعبه ۲: تهران، بلوار اندرزگو، مجتمع تجاری سانا، طبقه همکف</span>
              </div>
              <div className="flex items-center gap-3 text-sky-100/90">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-[#5CAFE7] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm font-sans" dir="ltr">021 - 8888 8888</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 flex flex-col space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-sky-800/60 pb-2 inline-block w-fit">دسترسی سریع</h3>
            <div className="flex flex-col space-y-3.5 text-sm text-sky-200/85">
              <Link href="/women" className="hover:text-white hover:-translate-x-1 transition-all">فروش ویژه</Link>
              <Link href="/women" className="hover:text-white hover:-translate-x-1 transition-all">جدیدترین محصولات</Link>
              <Link href="/women" className="hover:text-white hover:-translate-x-1 transition-all">پرفروش‌ترین‌ها</Link>
              <Link href="/about" className="hover:text-white hover:-translate-x-1 transition-all">درباره ما</Link>
              <Link href="/contact" className="hover:text-white hover:-translate-x-1 transition-all">تماس با ما</Link>
              <Link href="#" className="hover:text-white hover:-translate-x-1 transition-all">قوانین و مقررات</Link>
            </div>
          </div>

          {/* Column 3: Newsletter */}
          <div className="md:col-span-4 flex flex-col space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-sky-800/60 pb-2 inline-block w-fit">عضویت در خبرنامه</h3>
            <p className="text-sky-100/80 text-sm">
              برای اطلاع از جدیدترین محصولات و تخفیف‌های ویژه، ایمیل خود را وارد کنید.
            </p>
            <div className="flex items-stretch gap-2">
              <Input 
                type="email" 
                placeholder="ایمیل شما..." 
                className="bg-white/10 border-sky-800/80 text-white placeholder:text-sky-300/50 h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA] font-sans flex-1 min-w-0"
                dir="ltr"
              />
              <Button className="h-12 w-12 rounded-xl bg-[#0082CA] text-white hover:bg-[#5CAFE7] shadow-lg shadow-[#0082CA]/30 shrink-0 p-0 flex items-center justify-center cursor-pointer transition-colors">
                <Send className="w-5 h-5 rtl:-scale-x-100" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-sky-900/60 gap-4 text-sky-300/60">
          <p className="text-xs font-sans">
            © 2026 Fashion Store. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sky-300/70">
            <Link href="https://instagram.com/your_username" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </Link>
            <Link href="mailto:your_email@example.com" className="hover:text-white transition-colors">
              <Mail className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
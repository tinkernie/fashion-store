"use client";

import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { MaviWordmark } from "@/components/ui/mavi-wordmark";

export default function Footer() {
  return (
    <footer className="bg-[#0B192C] text-white border-t border-sky-900/50 pt-16 sm:pt-20 pb-28 md:pb-12 px-4 sm:px-6 mt-6 sm:mt-10 shadow-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-8 mb-16">
          
          {/* Column 1: Brand & Contact */}
          <div className="md:col-span-6 lg:col-span-6 flex flex-col space-y-6">
            <Link href="/" className="flex items-center gap-3 text-white hover:text-sky-200 transition-colors drop-shadow-sm group">
              <MaviWordmark className="h-7 sm:h-8 w-auto text-white group-hover:scale-105 transition-transform" />
              <span className="text-sm font-bold text-sky-300">ماوی</span>
            </Link>
            <p className="text-sky-100/80 text-sm leading-relaxed max-w-lg">
              فروشگاه تخصصی مد و پوشاک فاخر ماوی (MAVI)؛ پیشرو در ارائه جدیدترین طراحی‌های مدرن و متریال‌های باکیفیت جهانی.
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
          <div className="md:col-span-3 lg:col-span-3 flex flex-col space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-sky-800/60 pb-2 inline-block w-fit">دسترسی سریع</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-y-3.5 text-sm text-sky-200/85">
              <Link href="/women" className="hover:text-white hover:-translate-x-1 transition-all">فروش ویژه</Link>
              <Link href="/women" className="hover:text-white hover:-translate-x-1 transition-all">جدیدترین محصولات</Link>
              <Link href="/women" className="hover:text-white hover:-translate-x-1 transition-all">پرفروش‌ترین‌ها</Link>
              <Link href="/blog" className="hover:text-white hover:-translate-x-1 transition-all">وبلاگ و مجله مد</Link>
              <Link href="/about" className="hover:text-white hover:-translate-x-1 transition-all">درباره ما</Link>
              <Link href="/contact" className="hover:text-white hover:-translate-x-1 transition-all">تماس با ما</Link>
              <Link href="#" className="hover:text-white hover:-translate-x-1 transition-all">قوانین و مقررات</Link>
            </div>
          </div>

          {/* Column 3: Trust Badges */}
          <div className="md:col-span-3 lg:col-span-3 flex flex-col space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-sky-800/60 pb-2 inline-block w-fit">نماد اعتماد</h3>
            <p className="text-xs text-sky-200/80 leading-relaxed">
              خرید امن و تضمین‌شده با نماد رسمی اعتماد الکترونیکی کسب‌وکارهای اینترنتی.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="bg-white rounded-2xl p-3 shadow-lg shadow-sky-950/40 border border-sky-100/30 flex items-center justify-center hover:shadow-sky-500/20 transition-all hover:scale-105">
                <a
                  referrerPolicy="origin"
                  target="_blank"
                  rel="noreferrer"
                  href="https://trustseal.enamad.ir/?id=8347882&Code=1Yev5tmcIPdMjoXc7qvOUYCpFiei0NRw"
                  title="نماد اعتماد الکترونیکی ماوی"
                  className="block cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    referrerPolicy="origin"
                    src="https://trustseal.enamad.ir/logo.aspx?id=8347882&Code=1Yev5tmcIPdMjoXc7qvOUYCpFiei0NRw"
                    alt="نماد اعتماد الکترونیکی ماوی"
                    width={96}
                    height={96}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-sky-900/60 gap-4 text-sky-300/60">
          <p className="text-xs font-sans">
            © 2026 MAVI (ماوی). All rights reserved.
          </p>
          <div className="text-xs text-sky-300/70 font-medium">
            <span>ساخته شده توسط </span>
            <span className="text-sky-200 font-bold">besporman</span>
          </div>
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
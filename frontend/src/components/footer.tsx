import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 px-6 mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Column 1: Brand & Contact */}
          <div className="md:col-span-5 flex flex-col space-y-6">
            <Link href="/" className="text-3xl font-black tracking-widest uppercase text-white">
              فشن استور
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              مجموعه‌ای از بهترین طراحی‌های مینیمال و استایل خیابانی. ما به کیفیت متریال و اصالت در طراحی باور داریم.
            </p>
            
            <div className="flex flex-col space-y-4 pt-4">
              <div className="flex items-start gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">شعبه ۱: تهران، خیابان ولیعصر، بالاتر از پارک وی، پلاک ۱۲۳</span>
              </div>
              <div className="flex items-start gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">شعبه ۲: تهران، بلوار اندرزگو، مجتمع تجاری سانا، طبقه همکف</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-gray-500 shrink-0" />
                <span className="text-sm font-sans" dir="ltr">021 - 8888 8888</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 flex flex-col space-y-6">
            <h3 className="text-lg font-bold text-white">دسترسی سریع</h3>
            <div className="flex flex-col space-y-4 text-sm text-gray-400">
              <Link href="/women" className="hover:text-white transition-colors">کالکشن بانوان</Link>
              <Link href="/men" className="hover:text-white transition-colors">کالکشن آقایان</Link>
              <Link href="#" className="hover:text-white transition-colors">درباره ما</Link>
              <Link href="#" className="hover:text-white transition-colors">پیگیری سفارش</Link>
              <Link href="#" className="hover:text-white transition-colors">قوانین و مقررات</Link>
            </div>
          </div>

          {/* Column 3: Newsletter */}
          <div className="md:col-span-4 flex flex-col space-y-6">
            <h3 className="text-lg font-bold text-white">عضویت در خبرنامه</h3>
            <p className="text-gray-400 text-sm">
              برای اطلاع از جدیدترین محصولات و تخفیف‌های ویژه، ایمیل خود را وارد کنید.
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="ایمیل شما..." 
                className="bg-[#111111] border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white/30 font-sans"
                dir="ltr"
              />
              <Button className="h-12 w-12 rounded-xl bg-white text-black hover:bg-gray-200 shrink-0 p-0">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 gap-4">
          <p className="text-gray-600 text-xs font-sans">
            © 2026 Fashion Store. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-gray-500">
            <Link href="https://instagram.com/your_username" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Instagram className="w-5 h-5" />
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
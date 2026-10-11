import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#FAFCFE] flex flex-col items-center justify-center px-6 text-center" dir="rtl">
      <div className="space-y-6 max-w-md">
        <h1 className="text-8xl md:text-9xl font-black text-sky-200/70 tracking-widest font-sans select-none">
          ۴۰۴
        </h1>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900">
          صفحه مورد نظر پیدا نشد
        </h2>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
          متاسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد، حذف شده یا نام آن تغییر کرده است.
        </p>
        
        <div className="pt-6">
          <Button asChild className="h-12 px-8 rounded-2xl bg-[#0082CA] text-white hover:bg-[#0072B5] text-sm md:text-base font-bold transition-all shadow-lg shadow-[#0082CA]/25 inline-flex items-center gap-2 cursor-pointer">
            <Link href="/">
              <span>بازگشت به صفحه اصلی</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
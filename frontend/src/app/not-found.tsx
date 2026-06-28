import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-8xl md:text-9xl font-black text-white tracking-widest font-sans">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-300">
          صفحه مورد نظر پیدا نشد
        </h2>
        <p className="text-gray-500 text-sm md:text-base leading-relaxed">
          متاسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد، حذف شده یا نام آن تغییر کرده است.
        </p>
        
        <div className="pt-8">
          <Button asChild className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] inline-flex gap-2">
            <Link href="/">
              بازگشت به صفحه اصلی
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
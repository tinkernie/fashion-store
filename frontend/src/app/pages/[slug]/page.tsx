"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, FileText, ArrowRight, Sparkles, Clock, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { HoneycombLoader } from "@/components/ui/honeycomb-loader";

export default function DynamicCMSPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchPage = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/api/pages/${slug}/`);
        setPage(res.data);
      } catch {
        try {
          const res = await api.get(`/api/admin/cms/pages/${slug}/`);
          setPage(res.data);
        } catch {
          setPage(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("لینک این صفحه در کلیپ‌بورد کپی شد");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen pt-32 pb-24 px-4 flex items-center justify-center bg-background" dir="rtl">
        <HoneycombLoader 
          size="default" 
          text="در حال بارگذاری برگه..." 
        />
      </main>
    );
  }

  if (!page) {
    return (
      <main className="min-h-screen pt-32 pb-24 px-4 flex flex-col items-center justify-center text-center space-y-4 bg-background" dir="rtl">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900">برگه مورد نظر یافت نشد</h1>
        <p className="text-slate-500 text-xs md:text-sm max-w-md">برگه‌ای با این آدرس وجود ندارد یا توسط مدیر سایت منتشر نشده است.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0082CA] text-white hover:bg-[#0072B5] font-bold text-sm transition-all shadow-md shadow-[#0082CA]/20"
        >
          <span>بازگشت به صفحه اصلی</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-32 pb-24 px-4 md:px-12 max-w-4xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-8">
        <Link href="/" className="hover:text-[#0082CA] transition-colors">
          صفحه نخست
        </Link>
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="text-slate-500">برگه‌های سایت</span>
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold">{page?.title}</span>
      </div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 border-b border-sky-100 pb-8 mb-10"
      >
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-[#0082CA] border border-sky-200 text-xs font-bold shadow-sm">
            <FileText className="w-3.5 h-3.5" />
            اطلاعات و راهنمای فروشگاه
          </div>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl border border-sky-200 bg-white text-slate-600 hover:text-[#0082CA] hover:bg-sky-50 transition-colors shadow-sm"
            title="اشتراک‌گذاری برگه"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
          {page?.title}
        </h1>

        {page?.updated_at && (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-sans">
            <Clock className="w-3.5 h-3.5" />
            <span>آخرین بروزرسانی: {new Date(page.updated_at).toLocaleDateString("fa-IR")}</span>
          </div>
        )}
      </motion.div>

      {/* Content Blocks */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-8 text-slate-700 leading-relaxed text-sm md:text-base font-sans"
      >
        {page?.content && Array.isArray(page.content) && page.content.length > 0 ? (
          page.content.map((block: any, idx: number) => (
            <div
              key={idx}
              className="bg-white border border-sky-100 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl shadow-sky-950/5"
            >
              {block.heading && (
                <h2 className="text-xl md:text-2xl font-black text-slate-900 border-r-4 border-[#0082CA] pr-3">
                  {block.heading}
                </h2>
              )}
              {block.body && (
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {block.body}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white border border-sky-100 rounded-3xl p-8 text-center text-slate-400 shadow-sm">
            محتوایی برای این برگه ثبت نشده است.
          </div>
        )}

        {/* Back Link */}
        <div className="pt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0082CA] text-white hover:bg-[#0072B5] font-bold text-sm transition-all shadow-md shadow-[#0082CA]/20"
          >
            <span>بازگشت به صفحه اصلی فروشگاه</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

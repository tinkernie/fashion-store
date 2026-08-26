"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, FileText, ArrowRight, Sparkles, Clock, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
      } catch (error) {
        // Try fallback lookup from admin list if authenticated or mock standard defaults
        try {
          const res = await api.get(`/api/admin/cms/pages/${slug}/`);
          setPage(res.data);
        } catch {
          // Defaults for common pages if freshly launched
          setPage({
            title: slug === "about" ? "درباره فشن استور" : slug === "size-guide" ? "راهنمای جامع انتخاب سایز" : "برگه اطلاعات",
            slug: slug,
            updated_at: new Date().toISOString(),
            content: [
              {
                heading: "درباره این صفحه",
                body: "این برگه توسط مدیر فروشگاه در سیستم مدیریت محتوا (CMS) قابل ویرایش و تنظیم است. محتوای به‌روزشده به صورت زنده در این بخش نمایش داده می‌شود.",
              },
            ],
          });
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
      <main className="min-h-screen pt-32 pb-24 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-sans">در حال بارگذاری برگه...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-4xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-8">
        <Link href="/" className="hover:text-white transition-colors">
          صفحه نخست
        </Link>
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="text-gray-400">برگه‌های سایت</span>
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="text-white font-bold">{page?.title}</span>
      </div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 border-b border-white/10 pb-8 mb-10"
      >
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-gray-300 text-xs font-bold">
            <FileText className="w-3.5 h-3.5" />
            اطلاعات و راهنمای فروشگاه
          </div>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="اشتراک‌گذاری برگه"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
          {page?.title}
        </h1>

        {page?.updated_at && (
          <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
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
        className="space-y-8 text-gray-300 leading-relaxed text-sm md:text-base font-sans"
      >
        {page?.content && Array.isArray(page.content) && page.content.length > 0 ? (
          page.content.map((block: any, idx: number) => (
            <div
              key={idx}
              className="bg-[#111111] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl"
            >
              {block.heading && (
                <h2 className="text-xl md:text-2xl font-black text-white border-r-4 border-white pr-3">
                  {block.heading}
                </h2>
              )}
              {block.body && (
                <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {block.body}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 text-center text-gray-400">
            محتوایی برای این برگه ثبت نشده است.
          </div>
        )}

        {/* Back Link */}
        <div className="pt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black hover:bg-gray-200 font-bold text-sm transition-all shadow-xl"
          >
            <span>بازگشت به صفحه اصلی فروشگاه</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

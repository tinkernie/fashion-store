"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Share2,
  ChevronLeft,
  ChevronRight,
  Tag as TagIcon,
  AlertCircle,
  Copy,
  Check,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getBlogPostDetail,
  getBlogPostSlugLookup,
  BlogPostDetail,
  BlogLanguage,
} from "@/lib/blog-api";
import { formatShamsiDate } from "@/lib/jalali";
import { HoneycombLoader } from "@/components/ui/honeycomb-loader";
import { toast } from "sonner";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const langParam = (searchParams.get("lang") as BlogLanguage) || "fa";
  const [currentLang, setCurrentLang] = useState<BlogLanguage>(langParam);
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const rawSlug = resolvedParams.slug;
  const decodedSlug = decodeURIComponent(rawSlug);

  useEffect(() => {
    let cancelled = false;
    getBlogPostDetail(decodedSlug, currentLang)
      .then((data) => {
        if (!cancelled) {
          setPost(data);
          setNotFound(false);
        }
      })
      .catch(async (err: unknown) => {
        if (cancelled) return;
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr?.response?.status === 404) {
          try {
            const lookup = await getBlogPostSlugLookup(decodedSlug, currentLang);
            if (lookup?.redirect_to && lookup.redirect_to !== decodedSlug) {
              router.replace(
                `/blog/${encodeURIComponent(lookup.redirect_to)}${
                  currentLang !== "fa" ? `?lang=${currentLang}` : ""
                }`
              );
              return;
            }
          } catch {
            // ignore lookup error
          }
        }
        if (!cancelled) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [decodedSlug, currentLang, router]);

  const handleLanguageSwitch = (targetLang: BlogLanguage) => {
    if (!post) return;
    setCurrentLang(targetLang);

    // If an alternate slug exists for this language, navigate to that slug
    const alternateSlug = post.slugs?.[targetLang];
    if (alternateSlug) {
      router.push(`/blog/${encodeURIComponent(alternateSlug)}?lang=${targetLang}`);
    } else {
      router.push(`/blog/${encodeURIComponent(post.slug)}?lang=${targetLang}`);
    }
  };

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("لینک مقاله در حافظه کپی شد");
    setTimeout(() => setCopied(false), 2000);
  };

  const isRtl = currentLang === "fa" || currentLang === "ar";

  if (isLoading) {
    return (
      <div className="min-h-screen pt-36 pb-24 flex flex-col items-center justify-center space-y-4">
        <HoneycombLoader size="lg" color="#0082CA" />
        <p className="text-xs text-slate-400">در حال بارگذاری مقاله...</p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen pt-36 pb-24 font-sans" dir="rtl">
        <div className="max-w-md mx-auto text-center bg-white rounded-3xl border border-sky-100 p-8 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">مقاله مورد نظر یافت نشد</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            ممکن است این مقاله حذف شده باشد یا آدرس آن تغییر یافته باشد.
          </p>
          <Button asChild className="rounded-xl bg-[#0082CA] text-white hover:bg-[#006CA8]">
            <Link href="/blog">بازگشت به مقالات وبلاگ</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formattedDate = post.published_at
    ? currentLang === "fa"
      ? formatShamsiDate(post.published_at, { mode: "full" })
      : new Date(post.published_at).toLocaleDateString(
          currentLang === "ar" ? "ar-EG" : "en-US",
          { year: "numeric", month: "long", day: "numeric" }
        )
    : null;

  return (
    <article
      className="min-h-screen bg-gradient-to-b from-sky-50/30 via-white to-white pt-24 md:pt-32 pb-24 font-sans"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Breadcrumb & Language Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100 pb-4">
          <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link href="/" className="hover:text-[#0082CA] transition-colors">
              {currentLang === "en" ? "Home" : currentLang === "ar" ? "الرئيسية" : "صفحه اصلی"}
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-[#0082CA] transition-colors">
              {currentLang === "en" ? "Journal" : currentLang === "ar" ? "المجلة" : "وبلاگ و مقالات"}
            </Link>
            <span>/</span>
            <span className="text-slate-700 truncate max-w-[200px] sm:max-w-xs">{post.title}</span>
          </nav>

          {/* Language Switcher */}
          <div className="inline-flex items-center p-1 rounded-full bg-white border border-sky-100 shadow-sm text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleLanguageSwitch("fa")}
              className={`px-3 py-1 rounded-full transition-all ${
                currentLang === "fa"
                  ? "bg-[#0082CA] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              فارسی (FA)
            </button>
            <button
              type="button"
              onClick={() => handleLanguageSwitch("en")}
              className={`px-3 py-1 rounded-full transition-all ${
                currentLang === "en"
                  ? "bg-[#0082CA] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English (EN)
            </button>
            <button
              type="button"
              onClick={() => handleLanguageSwitch("ar")}
              className={`px-3 py-1 rounded-full transition-all ${
                currentLang === "ar"
                  ? "bg-[#0082CA] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              العربية (AR)
            </button>
          </div>
        </div>

        {/* Missing Translation Fallback Warning */}
        {post.has_language === false && currentLang !== "fa" && (
          <div
            className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs leading-relaxed"
            dir={currentLang === "ar" ? "rtl" : "ltr"}
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {currentLang === "en"
                  ? "English translation is not available yet"
                  : "الترجمة العربية غير متوفرة بعد"}
              </p>
              <p className="text-amber-800 mt-0.5">
                {currentLang === "en"
                  ? "You are currently viewing the original Persian version of this article."
                  : "أنت تشاهد حالياً النسخة الأصلية الفارسية من هذا المقال."}
              </p>
            </div>
          </div>
        )}

        {/* Article Header */}
        <header className="space-y-4">
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.slug}`}
                  className="px-3 py-1 rounded-full bg-sky-50 text-[#0082CA] hover:bg-sky-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <TagIcon className="w-3 h-3 opacity-60" />
                  <span>
                    {currentLang === "en" && tag.name_en
                      ? tag.name_en
                      : currentLang === "ar" && tag.name_ar
                      ? tag.name_ar
                      : tag.name}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              {post.excerpt}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-sky-100 text-xs text-slate-500">
            <div className="flex items-center gap-4 flex-wrap">
              {post.author_name && (
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <User className="w-3.5 h-3.5 text-[#0082CA]" />
                  <span>{post.author_name}</span>
                </div>
              )}

              {formattedDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formattedDate}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>
                  {post.reading_minutes} {currentLang === "en" ? "min read" : "دقیقه مطالعه"}
                </span>
              </div>
            </div>

            {/* Share / Copy button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="rounded-xl border-sky-100 text-slate-700 hover:bg-sky-50 gap-1.5 text-xs h-9"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "کپی شد" : "اشتراک‌گذاری"}</span>
            </Button>
          </div>
        </header>

        {/* Cover Hero Image */}
        {post.cover_image && (
          <div className="rounded-3xl overflow-hidden aspect-[16/9] bg-slate-100 shadow-md border border-sky-100">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body Content */}
        <div
          className="prose prose-slate max-w-none bg-white rounded-3xl border border-sky-100 p-6 sm:p-10 shadow-sm leading-relaxed text-slate-800 font-sans text-sm sm:text-base space-y-4"
          dir={isRtl ? "rtl" : "ltr"}
          dangerouslySetInnerHTML={{ __html: post.body_html }}
        />

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-sky-100 flex items-center justify-between">
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-sky-200 text-[#0082CA] hover:bg-sky-50 font-bold text-xs gap-2"
          >
            <Link href="/blog">
              {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>
                {currentLang === "en"
                  ? "Back to all articles"
                  : currentLang === "ar"
                  ? "العودة إلى جميع المقالات"
                  : "بازگشت به همه مقالات وبلاگ"}
              </span>
            </Link>
          </Button>

          <Button
            onClick={handleCopyLink}
            className="rounded-xl bg-[#0082CA] hover:bg-[#006CA8] text-white font-bold text-xs gap-1.5 shadow-md shadow-[#0082CA]/20"
          >
            <Share2 className="w-4 h-4" />
            <span>
              {currentLang === "en" ? "Share" : currentLang === "ar" ? "مشاركة" : "اشتراک‌گذاری"}
            </span>
          </Button>
        </div>
      </div>
    </article>
  );
}

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tag as TagIcon,
  X,
  Compass,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getBlogPosts,
  getBlogTags,
  BlogPostCard,
  BlogTag,
  BlogLanguage,
} from "@/lib/blog-api";
import { formatShamsiDate } from "@/lib/jalali";
import { HoneycombLoader } from "@/components/ui/honeycomb-loader";

function BlogListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialLang = (searchParams.get("lang") as BlogLanguage) || "fa";
  const initialTag = searchParams.get("tag") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialPage = Number(searchParams.get("page")) || 1;

  const [language, setLanguage] = useState<BlogLanguage>(initialLang);
  const [activeTag, setActiveTag] = useState<string>(initialTag);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  const [posts, setPosts] = useState<BlogPostCard[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const pageSize = 9;

  // Sync state to URL search parameters
  const updateUrl = useCallback(
    (newLang: BlogLanguage, newTag: string, newSearch: string, newPage: number) => {
      const params = new URLSearchParams();
      if (newLang !== "fa") params.set("lang", newLang);
      if (newTag) params.set("tag", newTag);
      if (newSearch) params.set("search", newSearch);
      if (newPage > 1) params.set("page", String(newPage));

      const qs = params.toString();
      router.replace(`/blog${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router]
  );

  // Load tags once
  useEffect(() => {
    getBlogTags()
      .then((tagsData) => setTags(tagsData))
      .catch((e) => console.error("Failed to fetch tags:", e));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getBlogPosts({
      lang: language,
      tag: activeTag || undefined,
      search: searchQuery.trim() || undefined,
      page: currentPage,
      page_size: pageSize,
    })
      .then((res) => {
        if (!cancelled) {
          setPosts(res.results || []);
          setTotalCount(res.count || 0);
        }
      })
      .catch((e) => {
        if (!cancelled) console.error("Failed to fetch blog posts:", e);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    updateUrl(language, activeTag, searchQuery, currentPage);

    return () => {
      cancelled = true;
    };
  }, [language, activeTag, searchQuery, currentPage, pageSize, updateUrl]);

  const handleLanguageChange = (lang: BlogLanguage) => {
    setIsLoading(true);
    setLanguage(lang);
    setCurrentPage(1);
  };

  const handleTagClick = (slug: string) => {
    setIsLoading(true);
    setActiveTag((prev) => (prev === slug ? "" : slug));
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setIsLoading(true);
    setActiveTag("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const isRtl = language === "fa" || language === "ar";
  const totalPages = Math.ceil(totalCount / pageSize);

  // Localization labels
  const labels = {
    fa: {
      badge: "مجله تخصصی مد و سبک زندگی",
      title: "وبلاگ و دانستنی‌های ماوی",
      subtitle: "جدیدترین ترندهای پوشاک، راهنمای استایل، متریال‌های فاخر و پشت‌صحنه دنیای فشن",
      searchPlaceholder: "جستجو در مقالات و ترندها...",
      allTags: "همه موضوعات",
      minRead: "دقیقه مطالعه",
      readMore: "مطالعه مقاله",
      noResults: "هیچ مقاله‌ای یافت نشد",
      noResultsDesc: "عبارت دیگری را جستجو کنید یا فیلترهای اعمال‌شده را پاک نمایید.",
      clearFilters: "پاک کردن فیلترها",
    },
    en: {
      badge: "Fashion & Lifestyle Journal",
      title: "MAVI Journal & Editorial",
      subtitle: "Latest trends, styling guides, fabric craftsmanship, and modern luxury lifestyle insights.",
      searchPlaceholder: "Search journal articles...",
      allTags: "All Topics",
      minRead: "min read",
      readMore: "Read Article",
      noResults: "No articles found",
      noResultsDesc: "Try adjusting your search terms or clearing active filters.",
      clearFilters: "Clear Filters",
    },
    ar: {
      badge: "مجلة الموضة ونمط الحياة الفاخر",
      title: "مدونة ماوی ومجلة الأزياء",
      subtitle: "أحدث صيحات الموضة، إرشادات الأناقة، الحرفية الراقية، وكل ما يلهم إطلالتك العصرية.",
      searchPlaceholder: "ابحث في المقالات والمواضيع...",
      allTags: "جميع المواضيع",
      minRead: "دقائق للقراءة",
      readMore: "قراءة المقال",
      noResults: "لم يتم العثور على مقالات",
      noResultsDesc: "يرجى تجربة كلمات بحث أخرى أو مسح الفلاتر النشطة.",
      clearFilters: "مسح الفلاتر",
    },
  }[language];

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-sky-50/40 via-white to-white pt-24 md:pt-32 pb-20 font-sans"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-sky-100 shadow-sm text-xs font-bold text-[#0082CA]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{labels.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {labels.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {labels.subtitle}
          </p>
        </div>

        {/* Filter and Search Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
              <Input
                type="text"
                placeholder={labels.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`rounded-2xl border-sky-100 bg-white shadow-sm h-12 text-xs focus-visible:ring-2 focus-visible:ring-[#0082CA] ${
                  isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
                }`}
              />
              <button
                type="submit"
                aria-label="Search articles"
                className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0082CA] transition-colors p-2 ${
                  isRtl ? "right-1.5" : "left-1.5"
                }`}
              >
                <Search className="w-4 h-4" />
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 ${
                    isRtl ? "left-2" : "right-2"
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Total Results Count */}
            <div className="text-xs text-slate-500 font-medium">
              <span>{totalCount}</span> {isRtl ? "مقاله یافت شد" : "articles published"}
            </div>
          </div>

          {/* Tag Pills */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => handleTagClick("")}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  activeTag === ""
                    ? "bg-[#0082CA] text-white border-[#0082CA] shadow-sm shadow-[#0082CA]/25"
                    : "bg-white text-slate-700 border-sky-100 hover:border-sky-300 hover:bg-sky-50/50"
                }`}
              >
                {labels.allTags}
              </button>
              {tags.map((tag) => {
                const isSelected = activeTag === tag.slug;
                const tagName =
                  language === "en" && tag.name_en
                    ? tag.name_en
                    : language === "ar" && tag.name_ar
                    ? tag.name_ar
                    : tag.name;

                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagClick(tag.slug)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#0082CA] text-white border-[#0082CA] shadow-sm shadow-[#0082CA]/25"
                        : "bg-white text-slate-700 border-sky-100 hover:border-sky-300 hover:bg-sky-50/50"
                    }`}
                  >
                    <TagIcon className="w-3 h-3 opacity-60" />
                    <span>{tagName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <HoneycombLoader size="default" color="#0082CA" />
            <p className="text-xs text-slate-400">
              {isRtl ? "در حال دریافت مقالات..." : "Loading articles..."}
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-sky-100 p-8 shadow-sm space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0082CA] flex items-center justify-center mx-auto">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{labels.noResults}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{labels.noResultsDesc}</p>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="rounded-xl border-sky-200 text-[#0082CA] hover:bg-sky-50 text-xs"
            >
              {labels.clearFilters}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((post, idx) => {
              const formattedDate = post.published_at
                ? language === "fa"
                  ? formatShamsiDate(post.published_at, { mode: "full" })
                  : new Date(post.published_at).toLocaleDateString(
                      language === "ar" ? "ar-EG" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                    )
                : null;

              const postHref = `/blog/${post.slug}${language !== "fa" ? `?lang=${language}` : ""}`;

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="group bg-white rounded-3xl border border-sky-100 hover:border-sky-200 shadow-sm hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Card Cover Image */}
                  <Link href={postHref} className="relative aspect-[16/10] overflow-hidden bg-slate-100 block">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-sky-100 text-[#0082CA] font-bold text-lg">
                        MAVI JOURNAL
                      </div>
                    )}

                    {/* Reading time badge */}
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-300" />
                      <span>
                        {post.reading_minutes} {labels.minRead}
                      </span>
                    </div>
                  </Link>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      {/* Tags & Date row */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {post.tags && post.tags.slice(0, 2).map((t) => (
                            <span
                              key={t.id}
                              className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0082CA] font-medium"
                            >
                              {language === "en" && t.name_en
                                ? t.name_en
                                : language === "ar" && t.name_ar
                                ? t.name_ar
                                : t.name}
                            </span>
                          ))}
                        </div>

                        {formattedDate && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>{formattedDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#0082CA] transition-colors line-clamp-2 leading-snug">
                        <Link href={postHref}>{post.title}</Link>
                      </h2>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Bottom CTA Link */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={postHref}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0082CA] hover:text-[#006CA8] transition-colors group/cta"
                      >
                        <span>{labels.readMore}</span>
                        <ChevronLeft
                          className={`w-4 h-4 transition-transform group-hover/cta:-translate-x-1 ${
                            !isRtl ? "rotate-180 group-hover/cta:translate-x-1" : ""
                          }`}
                        />
                      </Link>

                      {post.author_name && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {post.author_name}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border-sky-100 text-slate-700"
            >
              <ChevronRight className={`w-4 h-4 ${!isRtl ? "rotate-180" : ""}`} />
            </Button>

            <span className="text-xs font-bold text-slate-700 px-3">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl border-sky-100 text-slate-700"
            >
              <ChevronLeft className={`w-4 h-4 ${!isRtl ? "rotate-180" : ""}`} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlogListingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
          <HoneycombLoader size="lg" color="#0082CA" />
        </div>
      }
    >
      <BlogListingContent />
    </Suspense>
  );
}

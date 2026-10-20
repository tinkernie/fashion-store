"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import {
  getHomepageBlogSection,
  HomepageBlogSectionData,
} from "@/lib/blog-api";
import { formatShamsiDate } from "@/lib/jalali";

export default function HomeBlogSection() {
  const [data, setData] = useState<HomepageBlogSectionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getHomepageBlogSection()
      .then((res) => {
        setData(res);
      })
      .catch((e) => {
        console.error("Failed to fetch homepage blog section:", e);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading || !data || !data.enabled || !data.posts || data.posts.length === 0) {
    return null;
  }

  const posts = data.posts.slice(0, data.max_items || 3);
  const title = data.titles?.fa || "آخرین مقالات و مجله مد";

  return (
    <section id="home-blog-section" className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white via-sky-50/20 to-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sky-100 pb-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-[#0082CA] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مجله مد و سبک زندگی ماوی</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              جدیدترین ترندها، راهنماهای استایلینگ و مقالات تخصصی دنیای مد را بخوانید.
            </p>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-sky-100 hover:border-sky-300 hover:bg-sky-50 text-[#0082CA] text-xs font-bold transition-all shadow-sm group self-start sm:self-auto shrink-0"
          >
            <span>مشاهده همه مقالات</span>
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {posts.map((post, idx) => {
            const formattedDate = post.published_at
              ? formatShamsiDate(post.published_at, { mode: "full" })
              : null;

            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.35 }}
                className="group bg-white rounded-3xl border border-sky-100 hover:border-sky-200 shadow-sm hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Cover Image */}
                <Link
                  href={`/blog/${post.slug}`}
                  className="relative aspect-[16/10] overflow-hidden bg-slate-100 block"
                >
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-sky-100 text-[#0082CA] font-bold text-base">
                      MAVI JOURNAL
                    </div>
                  )}

                  {/* Reading time */}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-300" />
                    <span>{post.reading_minutes} دقیقه مطالعه</span>
                  </div>
                </Link>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Tags & Date */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {post.tags && post.tags.slice(0, 2).map((t, tIdx) => (
                          <span
                            key={t.slug || tIdx}
                            className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0082CA] font-medium"
                          >
                            {t.name}
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
                    <h3 className="text-base font-black text-slate-900 group-hover:text-[#0082CA] transition-colors line-clamp-2 leading-snug">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Read More Link */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0082CA] hover:text-[#006CA8] transition-colors group/cta"
                    >
                      <span>مطالعه مقاله</span>
                      <ChevronLeft className="w-4 h-4 transition-transform group-hover/cta:-translate-x-1" />
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
      </div>
    </section>
  );
}

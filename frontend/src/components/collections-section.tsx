"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Layers } from "lucide-react";

export function CollectionsSection({ initialCollections }: { initialCollections?: any[] } = {}) {
  const [collections, setCollections] = useState<any[]>(initialCollections || []);

  useEffect(() => {
    if (initialCollections && initialCollections.length > 0) return;
    const fetchCollections = async () => {
      try {
        const response = await api.get('/api/collections/');
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        setCollections(data);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };
    fetchCollections();
  }, [initialCollections]);

  if (collections.length === 0) return null;

  return (
    <section className="pt-6 sm:pt-8 pb-4 sm:pb-6 px-4 md:px-12 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-8 border-b border-sky-100 pb-6">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0082CA] text-white flex items-center justify-center shadow-md shadow-[#0082CA]/25">
            <Layers className="w-4 h-4" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#0B192C]">کالکشن‌های ویژه</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {collections.map((collection, index) => {
          const bannerUrl =
            collection.hero_banner ||
            collection.image_url ||
            collection.image ||
            (collection as any).seo_metadata?.hero_banner;

          return (
            <motion.div 
              key={collection.slug || collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/collections/${collection.slug || collection.id}`}
                className="block group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-sky-100 hover:border-[#0082CA] aspect-[4/3] transition-all shadow-md hover:shadow-xl"
              >
                {/* Background Banner or Fallback Gradient */}
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt={collection.name || collection.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-sky-100 via-sky-50 to-white" />
                )}

                {/* Gentle Aegean Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/85 via-[#0B192C]/25 to-transparent z-10 transition-opacity duration-300" />

                {/* Bottom Card Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 md:p-6 z-20 flex items-end justify-between gap-2 sm:gap-4">
                  <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                    <h3 className="text-xs sm:text-base md:text-xl font-black text-white group-hover:text-sky-200 transition-colors line-clamp-1">
                      {collection.name || collection.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-sky-100/90 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                      {collection.description || "مشاهده محصولات و تخفیف‌های این کالکشن"}
                    </p>
                  </div>
                  <div className="w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-[#0082CA] border border-sky-300/40 text-white flex items-center justify-center backdrop-blur-md group-hover:bg-[#006CA8] group-hover:scale-110 transition-all shrink-0 shadow-lg shadow-[#0082CA]/30">
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
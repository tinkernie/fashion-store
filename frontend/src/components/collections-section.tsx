"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export function CollectionsSection() {
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
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
  }, []);

  if (collections.length === 0) return null;

  return (
    <section className="py-16 px-4 md:px-12 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-white">کالکشن‌های ویژه</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection, index) => {
          const bannerUrl = collection.hero_banner || collection.image_url || collection.image;
          const prodCount = collection.products?.length || 0;

          return (
            <motion.div 
              key={collection.slug || collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/collections/${collection.slug || collection.id}`}
                className="block group relative overflow-hidden rounded-3xl bg-[#111111] border border-white/10 hover:border-white/20 aspect-[4/3] transition-all shadow-xl"
              >
                {/* Background Banner or Fallback Gradient */}
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt={collection.name || collection.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-stone-950 via-zinc-900 to-[#141414]" />
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 transition-opacity duration-300" />

                {/* Top Badge: Product Count */}
                {prodCount > 0 && (
                  <div className="absolute top-4 right-4 z-20">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/20 shadow-lg">
                      {prodCount.toLocaleString("fa-IR")} محصول
                    </span>
                  </div>
                )}

                {/* Bottom Card Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg md:text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                      {collection.name || collection.title}
                    </h3>
                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                      {collection.description || "مشاهده محصولات و تخفیف‌های این کالکشن"}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-md group-hover:bg-white group-hover:text-black transition-all shrink-0 shadow-lg">
                    <ChevronLeft className="w-5 h-5" />
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
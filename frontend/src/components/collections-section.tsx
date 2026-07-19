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
        {collections.map((collection, index) => (
          <motion.div 
            key={collection.slug || collection.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={`/collections/${collection.slug || collection.id}`} className="block group relative overflow-hidden rounded-3xl bg-[#111111] border border-white/5 aspect-[4/3]">
              {/* Optional: Add collection.image_url if your API returns it */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{collection.name || collection.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{collection.description || "مشاهده محصولات این کالکشن"}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white group-hover:text-black transition-colors shrink-0">
                  <ChevronLeft className="w-5 h-5" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
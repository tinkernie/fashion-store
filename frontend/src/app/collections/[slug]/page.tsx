"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice, getDiscountInfo } from "@/lib/price-utils";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [collection, setCollection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await api.get(`/api/collections/${slug}/`);
        setCollection(res.data);
      } catch (err) {
        console.error("Error fetching collection:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchCollection();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <main className="min-h-screen pt-24 md:pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto flex items-center justify-center text-white" dir="rtl">
        <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full" />
      </main>
    );
  }

  if (!collection) {
    return (
      <main className="min-h-screen pt-24 md:pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto text-center text-white" dir="rtl">
        <h1 className="text-2xl font-bold mb-4">کالکشن مورد نظر یافت نشد</h1>
        <Link href="/" className="text-amber-400 hover:underline">بازگشت به صفحه اصلی</Link>
      </main>
    );
  }

  const products = collection.products || [];

  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4">{collection.name || collection.title}</h1>
        {collection.description && <p className="text-gray-400 max-w-2xl mx-auto">{collection.description}</p>}
      </div>

      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-12">محصولی در این کالکشن وجود ندارد.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product: any) => {
            const disc = getDiscountInfo(product);
            return (
              <Link key={product.id} href={`/products/${product.slug || product.id}`} className="group">
                <div className="bg-[#111111] rounded-2xl overflow-hidden aspect-[3/4] mb-4 border border-white/5 group-hover:border-white/20 transition-colors relative">
                  {disc.hasDiscount && (
                    <div className="absolute top-2.5 right-2.5 z-20">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black shadow-[0_2px_10px_rgba(16,185,129,0.5)]">
                        ٪{disc.discountPercent} تخفیف
                      </span>
                    </div>
                  )}
                  {/* Fallback image if product image is not populated */}
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-xs text-gray-600">بدون تصویر</div>
                  )}
                </div>
                <h3 className="text-sm md:text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-amber-400 transition-colors">{product.name || product.title}</h3>
                {disc.hasDiscount ? (
                  <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs text-gray-500 line-through">
                      {formatPrice(disc.basePrice)}
                    </span>
                    <span className="text-xs md:text-sm font-black text-emerald-400">
                      {formatPrice(disc.discountPrice)}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-gray-400">{formatPrice(product.price)}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
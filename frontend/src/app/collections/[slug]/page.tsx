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
      <main className="min-h-screen pt-24 md:pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto flex items-center justify-center text-foreground bg-background" dir="rtl">
        <div className="animate-spin w-8 h-8 border-4 border-[#0082CA] border-t-transparent rounded-full" />
      </main>
    );
  }

  if (!collection) {
    return (
      <main className="min-h-screen pt-24 md:pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto text-center text-foreground bg-background" dir="rtl">
        <h1 className="text-2xl font-bold mb-4 text-slate-900">کالکشن مورد نظر یافت نشد</h1>
        <Link href="/" className="text-[#0082CA] hover:underline font-bold">بازگشت به صفحه اصلی</Link>
      </main>
    );
  }

  const products = collection.products || [];

  const bannerImg = collection.hero_banner || collection.image_url || collection.image;

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 md:pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto" dir="rtl">
      {/* Responsive Event Banner (Fixed & Proportional on Phone, Tablet, & Desktop) */}
      {bannerImg ? (
        <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-sky-100 mb-8 md:mb-12 aspect-[2/1] sm:aspect-[16/7] md:aspect-[21/8] bg-sky-50 shadow-xl shadow-sky-950/5">
          <img
            src={bannerImg}
            alt={collection.name || collection.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] sm:text-xs text-white font-bold w-max mb-2">
              رویداد ویژه و کالکشن
            </span>
            <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white mb-1 sm:mb-2">
              {collection.name || collection.title}
            </h1>
            {collection.description && (
              <p className="text-xs sm:text-sm md:text-base text-gray-200 max-w-2xl line-clamp-2 sm:line-clamp-3">
                {collection.description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">{collection.name || collection.title}</h1>
          {collection.description && <p className="text-slate-500 max-w-2xl mx-auto">{collection.description}</p>}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center text-slate-400 py-12">محصولی در این کالکشن وجود ندارد.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product: any) => {
            const disc = getDiscountInfo(product);
            return (
              <Link key={product.id} href={`/products/${product.slug || product.id}`} className="group">
                <div className="bg-white rounded-2xl overflow-hidden aspect-[3/4] mb-4 border border-sky-100 group-hover:border-sky-300 shadow-sm group-hover:shadow-md transition-all relative">
                  {disc.hasDiscount && (
                    <div className="absolute top-2.5 right-2.5 z-20">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-md">
                        ٪{disc.discountPercent} تخفیف
                      </span>
                    </div>
                  )}
                  {/* Fallback image if product image is not populated */}
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-sky-50 flex items-center justify-center text-xs text-slate-400">بدون تصویر</div>
                  )}
                </div>
                <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-[#0082CA] transition-colors">{product.name || product.title}</h3>
                {disc.hasDiscount ? (
                  <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs text-slate-400 line-through">
                      {formatPrice(disc.basePrice)}
                    </span>
                    <span className="text-xs md:text-sm font-black text-[#0082CA]">
                      {formatPrice(disc.discountPrice)}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm font-black text-[#0082CA]">{formatPrice(product.price)}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
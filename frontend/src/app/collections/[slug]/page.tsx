"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/price-utils";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [collection, setCollection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        const response = await api.get(`/api/collections/${slug}/`);
        setCollection(response.data);
      } catch (error) {
        console.error("Error fetching collection details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (slug) fetchCollectionData();
  }, [slug]);

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-white">در حال بارگذاری...</div>;
  if (!collection) return <div className="min-h-screen pt-32 text-center text-white">کالکشن یافت نشد.</div>;

  // Assume API returns products inside a 'products' array within the collection object
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
          {products.map((product: any) => (
            <Link key={product.id} href={`/products/${product.slug || product.id}`} className="group">
              <div className="bg-[#111111] rounded-2xl overflow-hidden aspect-[3/4] mb-4 border border-white/5 group-hover:border-white/20 transition-colors relative">
                {/* Fallback image if product image is not populated */}
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-xs text-gray-600">بدون تصویر</div>
                )}
              </div>
              <h3 className="text-sm md:text-base font-bold text-white mb-1 line-clamp-1">{product.name || product.title}</h3>
              <p className="text-xs md:text-sm text-gray-400">{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
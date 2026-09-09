"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { formatPrice, getDiscountInfo } from "@/lib/price-utils";

interface ProductCardProps {
  id: string;
  name: string;
  price: string | number;
  category: string;
  imageUrl: string;
  discountPrice?: string | number | null;
  discountPercent?: number | null;
  remainingTime?: string | null;
  metadata?: any;
}

export default function ProductCard({
  id,
  name,
  price,
  category,
  imageUrl,
  discountPrice,
  discountPercent,
  remainingTime,
  metadata,
}: ProductCardProps) {
  const disc = getDiscountInfo({
    price,
    discount_price: discountPrice,
    discount_percent: discountPercent,
    discount_remaining: remainingTime,
    metadata,
  });

  return (
    <Link href={`/products/${id}`} className="group block cursor-pointer">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#111111] rounded-2xl border border-white/5">
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
        
        {/* Discount Percentage Badge on Banner/Photo */}
        {disc.hasDiscount && (
          <div className="absolute top-3 right-3 z-20">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-black shadow-[0_2px_10px_rgba(16,185,129,0.5)] flex items-center gap-1">
              ٪{disc.discountPercent} تخفیف
            </span>
          </div>
        )}

        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover object-center opacity-90 group-hover:opacity-100 transition-opacity"
          loading="lazy"
        />
      </div>

      {/* Product Metadata */}
      <div className="mt-5 flex flex-col space-y-1.5 px-2">
        <span className="text-[11px] font-bold text-gray-500">
          {category}
        </span>
        <h3 className="text-base font-bold tracking-wide text-gray-200 group-hover:text-white transition-colors">
          {name}
        </h3>
        
        {/* Price display: Strikethrough real price & Green discounted price */}
        {disc.hasDiscount ? (
          <div className="flex flex-col pt-0.5 space-y-0.5">
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(disc.basePrice)}
            </span>
            <span className="text-sm font-black text-emerald-400">
              {formatPrice(disc.discountPrice)}
            </span>
          </div>
        ) : (
          <p className="text-sm font-medium text-white/70">
            {formatPrice(price)}
          </p>
        )}
      </div>
    </Link>
  );
}
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
      <div className="relative aspect-[3/4] overflow-hidden bg-white rounded-2xl border border-sky-100 shadow-sm group-hover:shadow-xl group-hover:border-[#0082CA] transition-all">
        <div className="absolute inset-0 bg-[#0B192C]/5 group-hover:bg-transparent transition-colors duration-500 z-10" />
        
        {/* Discount Percentage Badge on Banner/Photo */}
        {disc.hasDiscount && (
          <div className="absolute top-3 right-3 z-20">
            <span className="px-2.5 py-1 rounded-full bg-[#0082CA] text-white text-[10px] font-bold shadow-md shadow-[#0082CA]/25 flex items-center gap-1">
              ٪{disc.discountPercent} تخفیف
            </span>
          </div>
        )}

        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover object-center transition-transform"
          loading="lazy"
        />
      </div>

      {/* Product Metadata */}
      <div className="mt-4 flex flex-col space-y-1 px-1">
        <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-[#0072B3] text-[11px] font-bold w-fit">
          {category}
        </span>
        <h3 className="text-base font-bold tracking-wide text-[#0B192C] group-hover:text-[#0082CA] transition-colors line-clamp-1">
          {name}
        </h3>
        
        {/* Price display: Strikethrough real price & Mavi blue discounted price */}
        {disc.hasDiscount ? (
          <div className="flex flex-col pt-0.5 space-y-0.5">
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(disc.basePrice)}
            </span>
            <span className="text-sm font-black text-[#0082CA]">
              {formatPrice(disc.discountPrice)}
            </span>
          </div>
        ) : (
          <p className="text-sm font-bold text-[#0B192C]">
            {formatPrice(price)}
          </p>
        )}
      </div>
    </Link>
  );
}
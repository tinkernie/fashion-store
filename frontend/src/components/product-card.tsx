"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  category: string;
  imageUrl: string;
}

export default function ProductCard({ id, name, price, category, imageUrl }: ProductCardProps) {
  return (
    <Link href={`/products/${id}`} className="group block cursor-pointer">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#111111] rounded-2xl border border-white/5">
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
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
        <p className="text-sm font-medium text-white/70">
          {price}
        </p>
      </div>
    </Link>
  );
}
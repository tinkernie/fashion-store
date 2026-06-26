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
      {/* Image Container with Premium Zoom Animation */}
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        <motion.img
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover object-center mix-blend-multiply"
          loading="lazy"
        />
      </div>

      {/* Product Metadata */}
      <div className="mt-4 flex flex-col space-y-1">
        <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">
          {category}
        </span>
        <h3 className="text-sm font-light tracking-wide text-neutral-800 group-hover:text-black transition-colors">
          {name}
        </h3>
        <p className="text-sm font-medium text-neutral-900 mt-0.5">
          {price}
        </p>
      </div>
    </Link>
  );
}
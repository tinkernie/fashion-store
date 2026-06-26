"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product-card";

const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Classic Silk Wrap Dress",
    price: "$240.00",
    category: "Dresses",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Minimalist Wool Trench Coat",
    price: "$420.00",
    category: "Outerwear",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Oversized Linen Button-Down",
    price: "$110.00",
    category: "Shirts",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "4",
    name: "Tailored High-Waist Trousers",
    price: "$180.00",
    category: "Pants",
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop",
  },
];

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#fcfcfc] px-6">
        <div className="max-w-4xl text-center space-y-6">
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] text-gray-400 font-semibold"
          >
            Summer Collection 2026
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-5xl md:text-7xl font-light tracking-tight text-gray-900 uppercase"
          >
            Elegance in <span className="font-serif italic">Simplicity</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-md mx-auto text-sm text-gray-500 leading-relaxed tracking-wide"
          >
            Designed for the modern woman who values clean silhouettes, premium fabrics, and timeless design.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="pt-4"
          >
            <Button className="rounded-none bg-black text-white hover:bg-neutral-800 px-8 py-6 text-xs uppercase tracking-widest transition-all duration-300">
              Shop the Look
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Product Grid Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col space-y-2 mb-12">
          <h2 className="text-xl font-light uppercase tracking-widest text-neutral-900">Featured Pieces</h2>
          <div className="h-[1px] w-12 bg-neutral-900" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>
    </div>
  );
}
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
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
  );
}
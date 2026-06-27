"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { ALL_PRODUCTS } from "@/lib/mock-data";

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  
  // Find the exact product based on the URL ID
  const product = ALL_PRODUCTS.find((p) => p.id === id);

  // Initialize selected size state (default to an empty string initially to prevent hydration errors)
  const [selectedSize, setSelectedSize] = useState("");
  const addItem = useCart((state) => state.addItem);

  // Set the default size once the product loads
  useEffect(() => {
    if (product && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product]);

  // If the user navigates to an ID that doesn't exist in our mock data
  if (!product) {
    return (
      <main className="min-h-screen pt-40 text-center flex flex-col items-center">
        <h1 className="text-4xl font-bold text-white mb-4">محصول پیدا نشد</h1>
        <p className="text-gray-400">محصولی با این شناسه در سیستم وجود ندارد.</p>
      </main>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.rawPrice,
      imageUrl: product.imageUrl,
      size: selectedSize,
      quantity: 1,
    });
  };

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
        
        {/* Image Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative aspect-[3/4] bg-[#111111] rounded-3xl overflow-hidden border border-white/5"
        >
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover opacity-90"
          />
        </motion.div>

        {/* Details Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col justify-center space-y-10"
        >
          <div className="space-y-4">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              {product.category}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
              {product.name}
            </h1>
            <p className="text-2xl font-medium text-gray-300">
              {product.price}
            </p>
          </div>

          <p className="text-gray-400 text-base leading-relaxed">
            {product.description}
          </p>

          <div className="space-y-5">
            <span className="text-sm font-bold text-white">انتخاب سایز: {selectedSize}</span>
            <div className="flex gap-4">
              {product.sizes.map((size) => (
                <button 
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-14 h-14 rounded-2xl border text-lg font-sans transition-all ${
                    selectedSize === size 
                      ? "bg-white text-black border-white" 
                      : "border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleAddToCart}
            className="w-full h-16 rounded-2xl bg-white text-black hover:bg-gray-200 text-lg font-bold transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            افزودن به سبد خرید
          </Button>
        </motion.div>
        
      </div>
    </main>
  );
}
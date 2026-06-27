"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";

// Added rawPrice for mathematical calculations
const MOCK_PRODUCT = {
  id: "1",
  name: "کت چرم اورسایز مشکی",
  price: "۶,۵۰۰,۰۰۰ تومان",
  rawPrice: 6500000, 
  category: "پوشاک زمستانه",
  description: "طراحی شده با بهترین چرم مصنوعی، دارای استایل دارک مینیمال مناسب برای استفاده روزمره و استایل‌های خیابانی. دوخت دقیق و متریال پرمیوم.",
  imageUrl: "https://images.unsplash.com/photo-1550614000-4b95d466f128?q=80&w=1000&auto=format&fit=crop",
  sizes: ["S", "M", "L", "XL"],
};

export default function ProductPage() {
  const [selectedSize, setSelectedSize] = useState(MOCK_PRODUCT.sizes[0]);
  const addItem = useCart((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: MOCK_PRODUCT.id,
      name: MOCK_PRODUCT.name,
      price: MOCK_PRODUCT.rawPrice,
      imageUrl: MOCK_PRODUCT.imageUrl,
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
            src={MOCK_PRODUCT.imageUrl}
            alt={MOCK_PRODUCT.name}
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
              {MOCK_PRODUCT.category}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
              {MOCK_PRODUCT.name}
            </h1>
            <p className="text-2xl font-medium text-gray-300">
              {MOCK_PRODUCT.price}
            </p>
          </div>

          <p className="text-gray-400 text-base leading-relaxed">
            {MOCK_PRODUCT.description}
          </p>

          <div className="space-y-5">
            <span className="text-sm font-bold text-white">انتخاب سایز: {selectedSize}</span>
            <div className="flex gap-4">
              {MOCK_PRODUCT.sizes.map((size) => (
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
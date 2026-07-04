"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ALL_PRODUCTS } from "@/lib/mock-data";
import { useCart } from "@/store/cart";
import { ArrowRight, ShoppingBag, Plus, Minus, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const SIZES = ["S", "M", "L", "XL"];

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  const product = ALL_PRODUCTS.find((p) => p.id === id);

  if (!mounted) return null;

  if (!product) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-3xl font-bold text-white mb-4">محصول پیدا نشد</h1>
        <Button asChild className="h-12 px-8 rounded-xl bg-white text-black hover:bg-gray-200 font-bold">
          <Link href="/women">بازگشت به فروشگاه</Link>
        </Button>
      </main>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("لطفاً یک سایز انتخاب کنید.", {
        position: "top-center",
        className: "bg-red-500/10 border-red-500/20 text-red-500"
      });
      return;
    }

    const numericPrice = Number(product.price.replace(/\D/g, ''));

    addItem({
      id: product.id,
      name: product.name,
      price: numericPrice,
      imageUrl: product.imageUrl,
      size: selectedSize,
      quantity: quantity,
    });

    toast.success("محصول به سبد خرید اضافه شد.");
  };

  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-40 md:pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      
      {/* Back Button */}
      <button 
        onClick={() => router.back()} 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 md:mb-8 text-sm outline-none"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        
        {/* Product Image */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden bg-[#111111] border border-white/5"
        >
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Product Details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col"
        >
          <span className="text-gray-500 text-sm md:text-base mb-2">{product.category}</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">{product.name}</h1>
          <div className="text-2xl md:text-3xl font-bold text-white mb-8">
            {product.price} <span className="text-sm md:text-lg text-gray-500 font-normal">تومان</span>
          </div>

          <div className="space-y-8 flex-1">
            
            {/* Size Selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">انتخاب سایز</h3>
                <button className="text-xs text-gray-500 underline underline-offset-4 hover:text-white transition-colors">راهنمای سایز</button>
              </div>
              <div className="flex items-center gap-3">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-sm md:text-base font-bold transition-all outline-none ${
                      selectedSize === size 
                        ? "bg-white text-black border-2 border-white" 
                        : "bg-[#111111] text-gray-400 border border-white/10 hover:border-white/30"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-4 hidden md:block">
              <h3 className="text-white font-bold">تعداد</h3>
              <div className="flex items-center gap-4 bg-[#111111] border border-white/10 rounded-xl w-fit p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors outline-none"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-white font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors outline-none"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Features list */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-gray-400">
                <ShieldCheck className="w-5 h-5 text-gray-500" />
                <span className="text-sm">ضمانت اصالت کالا</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Truck className="w-5 h-5 text-gray-500" />
                <span className="text-sm">ارسال سریع به سراسر کشور</span>
              </div>
            </div>

          </div>

          {/* Sticky Mobile / Standard Desktop Add to Cart Block */}
          {/* Note: bottom-16 to sit right above the MobileNav component */}
          <div className="fixed bottom-16 left-0 right-0 p-4 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 z-40 md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:bg-transparent md:border-none md:z-auto mt-8">
            <div className="max-w-7xl mx-auto flex items-center gap-4">
              
              {/* Mobile Quantity (only shows in sticky bar) */}
              <div className="md:hidden flex items-center gap-2 bg-[#111111] border border-white/20 rounded-2xl p-1 shrink-0 h-14">
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-full flex items-center justify-center text-white outline-none"><Plus className="w-4 h-4" /></button>
                <span className="w-4 text-center text-white font-bold text-sm">{quantity}</span>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center text-white outline-none"><Minus className="w-4 h-4" /></button>
              </div>

              <Button 
                onClick={handleAddToCart}
                className="flex-1 h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base md:text-lg font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                افزودن به سبد خرید
              </Button>
            </div>
          </div>

        </motion.div>
      </div>
    </main>
  );
}
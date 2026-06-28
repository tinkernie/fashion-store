"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ALL_PRODUCTS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { ShoppingBag, Star, ShieldCheck, Truck, ArrowRight, Heart } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const params = useParams();
  const product = ALL_PRODUCTS.find((p) => p.id === params.id);
  
  const [selectedSize, setSelectedSize] = useState<string>("");
  const { addItem: addToCart } = useCart();
  
  // Wishlist Hooks
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">محصول پیدا نشد</h1>
          <Link href="/" className="text-gray-400 hover:text-white underline">بازگشت به صفحه اصلی</Link>
        </div>
      </div>
    );
  }

  const isSaved = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("لطفاً سایز مورد نظر خود را انتخاب کنید.");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      quantity: 1,
      imageUrl: product.imageUrl,
    });

    toast.success("به سبد خرید اضافه شد", {
      description: `${product.name} - سایز ${selectedSize}`,
    });
  };

  const toggleWishlist = () => {
    if (isSaved) {
      removeFromWishlist(product.id);
      toast.success("از علاقه‌مندی‌ها حذف شد");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
      });
      toast.success("به علاقه‌مندی‌ها اضافه شد");
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8">
        <ArrowRight className="w-4 h-4" />
        بازگشت
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Product Image Gallery */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="w-full aspect-[3/4] bg-[#111111] rounded-3xl overflow-hidden border border-white/5">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover object-center"
            />
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold text-white mt-1">4.8</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
            {product.name}
          </h1>
          
          <p className="text-xl md:text-2xl font-bold text-gray-300 mb-8 font-sans">
            {product.price.toLocaleString('fa-IR')} <span className="text-sm text-gray-500 font-normal">تومان</span>
          </p>

          <p className="text-gray-400 leading-relaxed mb-10 text-sm md:text-base">
            طراحی مینیمال و دوخت پریمیوم. این محصول با استفاده از بهترین متریال‌ها تولید شده تا راحتی و استایل را به صورت همزمان به شما ارائه دهد. مناسب برای استفاده روزمره و استایل‌های خیابانی.
          </p>

          {/* Size Selector */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-bold">انتخاب سایز</span>
              <button className="text-xs text-gray-500 underline hover:text-white transition-colors">راهنمای سایز</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {['S', 'M', 'L', 'XL'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-14 h-14 rounded-xl font-bold font-sans transition-all flex items-center justify-center border ${
                    selectedSize === size 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent text-white border-white/20 hover:border-white/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-10">
            <Button 
              onClick={handleAddToCart}
              className="flex-1 h-16 rounded-2xl bg-white text-black hover:bg-gray-200 text-lg font-bold transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              افزودن به سبد خرید
            </Button>
            <Button 
              onClick={toggleWishlist}
              variant="outline"
              className={`w-16 h-16 rounded-2xl border transition-colors flex items-center justify-center shrink-0 ${
                isSaved 
                  ? 'border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                  : 'border-white/20 bg-transparent text-white hover:bg-white/5'
              }`}
            >
              <Heart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Badges */}
          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
            <div className="flex items-center gap-3 text-gray-400">
              <ShieldCheck className="w-5 h-5 text-gray-500" />
              <span className="text-sm">تضمین اصالت کالا</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Truck className="w-5 h-5 text-gray-500" />
              <span className="text-sm">ارسال سریع به سراسر ایران</span>
            </div>
          </div>

        </motion.div>
      </div>
    </main>
  );
}
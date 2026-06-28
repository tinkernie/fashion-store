"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ALL_PRODUCTS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { ShoppingBag, Star, ShieldCheck, Truck, ArrowRight, Heart, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Mock Reviews
const MOCK_REVIEWS = [
  { id: 1, user: "امیرحسین م.", rating: 5, date: "۲۴ اردیبهشت ۱۴۰۵", text: "کیفیت دوخت و متریال واقعا عالیه. دقیقا همون چیزی بود که تو عکس دیدم." },
  { id: 2, user: "سارا ت.", rating: 4, date: "۱۸ فروردین ۱۴۰۵", text: "طراحیش خیلی خاصه، فقط ارسالش یکم طول کشید." },
];

export default function ProductDetailPage() {
  const params = useParams();
  const product = ALL_PRODUCTS.find((p) => p.id === params.id);
  
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [reviewText, setReviewText] = useState("");
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

  const numericPrice = typeof product.price === 'number' 
    ? product.price 
    : Number(
        String(product.price)
          .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
          .replace(/\D/g, '')
      );

  const isSaved = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("لطفاً سایز مورد نظر خود را انتخاب کنید.");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: numericPrice,
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
        price: numericPrice,
        imageUrl: product.imageUrl,
        category: product.category,
      });
      toast.success("به علاقه‌مندی‌ها اضافه شد");
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewText.trim().length < 10) {
      toast.error("متن نظر باید حداقل ۱۰ کاراکتر باشد.");
      return;
    }
    toast.success("نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده می‌شود.");
    setReviewText("");
  };

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8">
        <ArrowRight className="w-4 h-4" />
        بازگشت
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-20">
        
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
            {numericPrice.toLocaleString('fa-IR')} <span className="text-sm text-gray-500 font-normal">تومان</span>
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

      {/* Reviews Section */}
      <div className="border-t border-white/10 pt-16">
        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
          <MessageSquare className="w-6 h-6" />
          نظرات کاربران
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Review List */}
          <div className="lg:col-span-7 space-y-6">
            {MOCK_REVIEWS.map((review) => (
              <div key={review.id} className="bg-[#111111] border border-white/5 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                      {review.user.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{review.user}</h4>
                      <span className="text-gray-500 text-xs">{review.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-700'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {review.text}
                </p>
              </div>
            ))}
          </div>

          {/* Add Review Form */}
          <div className="lg:col-span-5">
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 sticky top-24">
              <h3 className="text-lg font-bold text-white mb-6">ثبت نظر جدید</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">امتیاز شما</label>
                  <div className="flex items-center gap-1 text-gray-600 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-6 h-6 hover:text-yellow-500 transition-colors" />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">دیدگاه شما</label>
                  <textarea 
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="نظرتان در مورد این محصول چیست؟" 
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30 min-h-[120px] resize-none"
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-bold transition-all gap-2">
                  <Send className="w-4 h-4" />
                  ثبت دیدگاه
                </Button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
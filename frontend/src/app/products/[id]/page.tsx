"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  Truck,
  ArrowRight,
  Heart,
  MessageSquare,
  Send,
  Plus,
  Minus,
  Check,
  Boxes,
  Tag,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-utils";
import { getStoredAuth } from "@/lib/auth";
import { HoneycombLoader } from "@/components/ui/honeycomb-loader";
import { formatShamsiDate } from "@/lib/jalali";
import { getColorBackground } from "@/lib/color-utils";




interface ProductOptionValue {
  id: string;
  value: string;
  extra_data?: any;
}

interface ProductOption {
  id: string;
  name: string;
  position?: number;
  values: ProductOptionValue[];
}

interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: string | number;
  availability: "in_stock" | "out_of_stock" | "pre_order" | string;
  status: string;
  options: Array<{
    option_id: string;
    option_name: string;
    value_id: string;
    value: string;
  }>;
  inventory?: {
    available_quantity?: number;
    quantity?: number;
  };
  metadata?: any;
}

const PRESET_COLORS: Record<string, string> = {
  مشکی: "#000000",
  سفید: "#FFFFFF",
  طوسی: "#6B7280",
  خاکستری: "#4B5563",
  کرم: "#E5D3B3",
  شتری: "#C19A6B",
  زیتونی: "#556B2F",
  سرمه‌ای: "#1E293B",
  آبی: "#3B82F6",
  قرمز: "#EF4444",
  سبز: "#10B981",
  خردلی: "#EAB308",
  صورتی: "#EC4899",
  بنفش: "#8B5CF6",
  قهوه‌ای: "#78350F",
};

const getNormalizedOptions = (options: any): Array<{ option_name: string; value: string }> => {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options
      .map((o: any) => {
        if (typeof o === "object" && o !== null) {
          return {
            option_name: String(o.option_name || o.name || o.key || ""),
            value: String(o.value || o.val || ""),
          };
        }
        return { option_name: "", value: String(o) };
      })
      .filter((o) => o.option_name);
  }
  if (typeof options === "object" && options !== null) {
    return Object.entries(options).map(([k, v]) => ({
      option_name: k,
      value: String(v),
    }));
  }
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return getNormalizedOptions(parsed);
    } catch {
      return [];
    }
  }
  return [];
};

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Option Values Map: { [optionName]: optionValueString }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchProductFullData = async () => {
      try {
        const prodIdOrSlug = params.id;
        const [prodRes, optRes, varRes, revRes] = await Promise.allSettled([
          api.get(`/api/products/${prodIdOrSlug}/`),
          api.get(`/api/products/${prodIdOrSlug}/options/`),
          api.get(`/api/products/${prodIdOrSlug}/variants/`),
          api.get(`/api/products/${prodIdOrSlug}/reviews/`),
        ]);

        if (prodRes.status === "fulfilled") {
          setProduct(prodRes.value.data);
        }

        let loadedOptions: ProductOption[] = [];
        if (optRes.status === "fulfilled") {
          loadedOptions = Array.isArray(optRes.value.data)
            ? optRes.value.data
            : optRes.value.data.results || [];
          setOptions(loadedOptions);
        }

        let loadedVariants: ProductVariant[] = [];
        if (varRes.status === "fulfilled") {
          loadedVariants = Array.isArray(varRes.value.data)
            ? varRes.value.data
            : varRes.value.data.results || [];
          setVariants(loadedVariants);
        }

        if (revRes.status === "fulfilled") {
          setReviews(
            Array.isArray(revRes.value.data)
              ? revRes.value.data
              : revRes.value.data.results || []
          );
        }

        // Initialize default option selections
        const initialSelected: Record<string, string> = {};
        if (loadedOptions.length > 0) {
          loadedOptions.forEach((opt) => {
            if (opt.values && opt.values.length > 0) {
              initialSelected[opt.name] = opt.values[0].value;
            }
          });
        } else if (loadedVariants.length > 0) {
          const firstVariantOpts = getNormalizedOptions(loadedVariants[0].options);
          firstVariantOpts.forEach((o: any) => {
            if (o.option_name) {
              initialSelected[o.option_name] = o.value;
            }
          });
        }
        setSelectedOptions(initialSelected);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductFullData();
  }, [params.id]);

  // Find the exact matching variant based on currently selected options
  const matchedVariant = useMemo(() => {
    if (!variants || variants.length === 0) return null;

    // Filter variants that match all selected option values
    return (
      variants.find((v) => {
        const vOpts = getNormalizedOptions(v.options);
        if (vOpts.length === 0) return false;
        return Object.entries(selectedOptions).every(([optName, optVal]) => {
          return vOpts.some(
            (o: any) =>
              o.option_name.toLowerCase() === optName.toLowerCase() &&
              o.value.toLowerCase() === String(optVal).toLowerCase()
          );
        });
      }) || variants[0]
    );
  }, [variants, selectedOptions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white" dir="rtl">
        <HoneycombLoader 
          size="default" 
          text="در حال دریافت مشخصات و گالری کالا..." 
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white px-4" dir="rtl">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-black">محصول مورد نظر یافت نشد</h1>
          <p className="text-xs text-gray-400">ممکن است این کالا حذف یا ناموجود شده باشد.</p>
          <Button asChild className="h-11 px-6 rounded-xl bg-white text-black font-bold text-xs">
            <Link href="/products">بازگشت به کاتالوگ فروشگاه</Link>
          </Button>
        </div>
      </div>
    );
  }

  const basePrice =
    typeof product.price === "number"
      ? product.price
      : Number(String(product.price || "0").replace(/\D/g, ""));

  const currentPrice = matchedVariant ? Number(matchedVariant.price) : basePrice;
  const isSaved = isInWishlist(product.id);

  const isOutOfStock =
    matchedVariant?.availability === "out_of_stock" ||
    (matchedVariant?.inventory?.available_quantity !== undefined &&
      matchedVariant.inventory.available_quantity <= 0);

  const isPreOrder = matchedVariant?.availability === "pre_order";

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleAddToCart = async () => {
    if (options.length > 0) {
      const missingOption = options.find((opt) => !selectedOptions[opt.name]);
      if (missingOption) {
        toast.error(`لطفاً گزینه "${missingOption.name}" را انتخاب کنید.`);
        return;
      }
    }

    if (isOutOfStock) {
      toast.error("تنوع انتخابی در حال حاضر ناموجود است.");
      return;
    }

    const optionsSummary =
      Object.entries(selectedOptions)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ") || (selectedOptions["سایز"] || selectedOptions["Size"] || "Free");

    try {
      await addToCart({
        id: product.id,
        name: product.name || product.title,
        price: currentPrice,
        size: optionsSummary,
        quantity: quantity,
        imageUrl: product.imageUrl || product.image_url || "/globe.svg",
        variant_id: matchedVariant?.id || product.id,
      });

      toast.success("به سبد خرید اضافه شد", {
        description: `${product.name || product.title} (${optionsSummary}) - ${quantity.toLocaleString("fa-IR")} عدد`,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "افزودن به سبد خرید با خطا مواجه شد."));
    }
  };

  const toggleWishlist = () => {
    if (isSaved) {
      removeFromWishlist(product.id);
      toast.success("از علاقه‌مندی‌ها حذف شد");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name || product.title,
        price: currentPrice,
        imageUrl: product.imageUrl || product.image_url,
        category: product.category,
      });
      toast.success("به علاقه‌مندی‌ها اضافه شد");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewText.trim().length < 4) {
      toast.error("متن دیدگاه باید حداقل ۴ کاراکتر باشد.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const { user } = getStoredAuth();
      const displayName = user
        ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
        : undefined;

      await api.post(`/api/products/${params.id}/reviews/`, {
        rating,
        text: reviewText.trim(),
        user_name: displayName,
      });
      toast.success(
        "دیدگاه شما با موفقیت ثبت شد و پس از بازبینی ادمین نمایش داده خواهد شد.",
        { duration: 5000 }
      );
      setReviewText("");
      setRating(5);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در ثبت دیدگاه. لطفاً دوباره تلاش کنید."));
    } finally {
      setIsSubmittingReview(false);
    }
  };


  return (
    <main className="min-h-screen pt-28 pb-36 px-4 md:px-6 max-w-7xl mx-auto text-white" dir="rtl">
      {/* Back Link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به کاتالوگ لباس‌ها
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-16">
        {/* Product Image Gallery */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="w-full aspect-[3/4] bg-[#111111] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
            <img
              src={product.imageUrl || product.image_url || "/globe.svg"}
              alt={product.name || product.title}
              className="w-full h-full object-cover object-center"
            />
            {matchedVariant?.sku && (
              <span className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-gray-300 border border-white/10" dir="ltr">
                SKU: {matchedVariant.sku}
              </span>
            )}
          </div>
        </motion.div>

        {/* Product Info & Options */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col justify-center space-y-6">
          {/* Header Badges & Rating */}
          <div className="flex items-center gap-3">
            <span className="bg-white/10 text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-wider">
              {product.category || product.category_name || "پوشاک لوکس"}
            </span>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-bold text-white mt-0.5">۴.۹</span>
            </div>
            {isOutOfStock ? (
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                ناموجود
              </span>
            ) : isPreOrder ? (
              <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                پیش‌سفارش
              </span>
            ) : (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                موجود در انبار
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
            {product.name || product.title}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-amber-400">
              {currentPrice.toLocaleString("fa-IR")}
            </span>
            <span className="text-xs text-gray-400">تومان</span>
          </div>

          {/* Description */}
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
            {product.description ||
              "طراحی اختصاصی با برترین متریال‌های ارگانیک و دوخت سفارشی پریمیوم، مناسب برای استایل‌های روزمره، رسمی و ترند روز."}
          </p>

          {/* Dynamic Product Options (Colors, Sizes, etc.) */}
          {options.length > 0 && (
            <div className="space-y-5 pt-4 border-t border-white/10">
              {options.map((opt) => {
                const isColorOption =
                  opt.name.toLowerCase().includes("color") || opt.name.includes("رنگ");
                const currentSelectedVal = selectedOptions[opt.name] || "";

                return (
                  <div key={opt.id || opt.name} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        {opt.name}:
                        <span className="text-gray-300 font-normal">
                          {currentSelectedVal || "انتخاب نشده"}
                        </span>
                      </span>
                    </div>

                    {/* Option Values List */}
                    <div className="flex flex-wrap gap-2.5">
                      {opt.values?.map((valItem) => {
                        const val = valItem.value;
                        const isSelected = currentSelectedVal === val;
                        const colorBg = valItem.extra_data?.hex || (isColorOption ? getColorBackground(val) : null);

                        if (isColorOption && colorBg) {
                          return (
                            <button
                              key={valItem.id || val}
                              onClick={() => handleOptionChange(opt.name, val)}
                              title={val}
                              className={`relative w-9 h-9 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                                isSelected
                                  ? "border-amber-400 ring-2 ring-amber-400/50 scale-110"
                                  : "border-white/20 hover:border-white/60"
                              }`}
                              style={{ background: colorBg }}
                            >
                              {isSelected && (
                                <Check
                                  className={`w-4 h-4 ${
                                    val === "سفید" || val === "کرم" ? "text-black" : "text-white"
                                  }`}
                                />
                              )}
                            </button>
                          );
                        }


                        return (
                          <button
                            key={valItem.id || val}
                            onClick={() => handleOptionChange(opt.name, val)}
                            className={`min-w-12 h-10 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center border cursor-pointer ${
                              isSelected
                                ? "bg-white text-black border-white shadow-lg"
                                : "bg-[#141414] text-gray-300 border-white/10 hover:border-white/30"
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quantity & Stock Control */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-300">تعداد سفارش:</span>
              <div className="flex items-center gap-3 bg-[#141414] border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-white">
                  {quantity.toLocaleString("fa-IR")}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-3 pt-2">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-sm font-black transition-all shadow-xl gap-2 disabled:opacity-30 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                {isOutOfStock ? "ناموجود در این تنوع" : "افزودن به سبد خرید"}
              </Button>

              <Button
                onClick={toggleWishlist}
                variant="outline"
                className={`w-14 h-14 rounded-2xl border transition-colors flex items-center justify-center shrink-0 cursor-pointer ${
                  isSaved
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                    : "border-white/15 bg-transparent text-white hover:bg-white/10"
                }`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ضمانت اصالت و سلامت فیزیکی</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>ارسال اکسپرس پستی در سراسر کشور</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reviews & Social Proof */}
      <div className="border-t border-white/10 pt-12 space-y-8">
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-amber-400" />
          دیدگاه‌ها و نظرات خریداران ({reviews.length})
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Review List */}
          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 text-center space-y-2">
                <p className="text-gray-400 text-xs md:text-sm">
                  هنوز نظری برای این محصول ثبت نشده است. اولین نفری باشید که نظر خود را ثبت می‌کند!
                </p>
              </div>
            ) : (
              reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {r.user_name || "کاربر خریدار"}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (r.rating || 5) ? "fill-current text-amber-400" : "text-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                    {r.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* New Review Form */}
          <div className="lg:col-span-5 bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl sticky top-28">
            <h3 className="text-sm font-black text-white">ثبت تجربه خرید شما</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">امتیاز به کیفیت لباس</label>
                <div className="flex items-center gap-1 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() => setRating(star)}
                      className={`w-5 h-5 transition-colors ${
                        star <= rating ? "text-amber-400 fill-current" : "text-gray-600 hover:text-amber-400"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">متن دیدگاه</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="کیفیت دوخت، رنگ و تن‌خور لباس چگونه بود؟"
                  rows={4}
                  required
                  className="w-full bg-[#181818] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-400/50 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full h-11 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmittingReview ? "در حال ثبت..." : "ارسال دیدگاه"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Add to Cart Bottom Bar */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 z-40 md:hidden flex items-center gap-3">
        <Button
          onClick={toggleWishlist}
          variant="outline"
          className={`w-12 h-12 rounded-xl border transition-colors flex items-center justify-center shrink-0 ${
            isSaved
              ? "border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
              : "border-white/15 bg-transparent text-white"
          }`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
        </Button>
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1 h-12 rounded-xl bg-white text-black hover:bg-gray-200 text-xs font-black transition-all shadow-xl gap-2 disabled:opacity-30"
        >
          <ShoppingBag className="w-4 h-4" />
          {isOutOfStock ? "ناموجود" : `افزودن به سبد (${currentPrice.toLocaleString("fa-IR")} تومان)`}
        </Button>
      </div>
    </main>
  );
}
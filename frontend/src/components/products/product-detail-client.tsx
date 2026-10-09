"use client";

import { useState, useEffect, useMemo } from "react";
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
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-utils";
import { getStoredAuth } from "@/lib/auth";
import { HoneycombLoader } from "@/components/ui/honeycomb-loader";
import { getColorBackground } from "@/lib/color-utils";
import { formatPrice, formatPriceNumber, parsePrice, getDiscountInfo } from "@/lib/price-utils";
import ProductGallery from "@/components/products/product-gallery";
import RelatedProductsSlider, { RelatedProductItem } from "@/components/products/related-products-slider";

export interface ProductOptionValue {
  id: string;
  value: string;
  extra_data?: any;
}

export interface ProductOption {
  id: string;
  name: string;
  position?: number;
  values: ProductOptionValue[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: string | number;
  weight?: number;
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
  stock?: number;
  metadata?: any;
}

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

function getInitialSelectedOptions(
  options: ProductOption[],
  variants: ProductVariant[]
): Record<string, string> {
  const selected: Record<string, string> = {};
  if (options && options.length > 0) {
    options.forEach((opt) => {
      if (opt.values && opt.values.length > 0) {
        selected[opt.name] = opt.values[0].value;
      }
    });
  } else if (variants && variants.length > 0) {
    const firstVariantOpts = getNormalizedOptions(variants[0].options);
    firstVariantOpts.forEach((o: any) => {
      if (o.option_name) {
        selected[o.option_name] = o.value;
      }
    });
  }
  return selected;
}

interface ProductDetailClientProps {
  initialProduct: any;
  initialOptions?: ProductOption[];
  initialVariants?: ProductVariant[];
  initialReviews?: any[];
  initialRelated?: RelatedProductItem[];
  productIdOrSlug: string;
}

export default function ProductDetailClient({
  initialProduct,
  initialOptions = [],
  initialVariants = [],
  initialReviews = [],
  initialRelated = [],
  productIdOrSlug,
}: ProductDetailClientProps) {
  const [product, setProduct] = useState<any>(initialProduct);
  const [options, setOptions] = useState<ProductOption[]>(initialOptions);
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProductItem[]>(
    initialRelated.length > 0
      ? initialRelated
      : initialProduct?.related_products || []
  );
  const [completeLook, setCompleteLook] = useState<RelatedProductItem[]>(
    initialProduct?.complete_look || []
  );
  const [isRelatedLoading, setIsRelatedLoading] = useState(
    initialRelated.length === 0 && !initialProduct?.related_products
  );
  const [isLoading, setIsLoading] = useState(!initialProduct);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    getInitialSelectedOptions(initialOptions, initialVariants)
  );
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();

  // Client-side fallback if initial product wasn't provided or changed
  useEffect(() => {
    if (!initialProduct && productIdOrSlug) {
      const fetchProductFullData = async () => {
        setIsLoading(true);
        try {
          const [prodRes, optRes, varRes, revRes, relRes] = await Promise.allSettled([
            api.get(`/api/products/${productIdOrSlug}/`),
            api.get(`/api/products/${productIdOrSlug}/options/`),
            api.get(`/api/products/${productIdOrSlug}/variants/`),
            api.get(`/api/products/${productIdOrSlug}/reviews/`),
            api.get(`/api/products/${productIdOrSlug}/related/?limit=8`),
          ]);

          let loadedProd = null;
          if (prodRes.status === "fulfilled") {
            loadedProd = prodRes.value.data;
            setProduct(loadedProd);
            if (Array.isArray(loadedProd?.complete_look)) {
              setCompleteLook(loadedProd.complete_look);
            }
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

          if (
            relRes.status === "fulfilled" &&
            Array.isArray(relRes.value.data) &&
            relRes.value.data.length > 0
          ) {
            setRelatedProducts(relRes.value.data);
          } else if (
            loadedProd &&
            Array.isArray(loadedProd?.related_products) &&
            loadedProd.related_products.length > 0
          ) {
            setRelatedProducts(loadedProd.related_products);
          }

          setSelectedOptions(getInitialSelectedOptions(loadedOptions, loadedVariants));
        } catch (error) {
          console.error("Error fetching product details on client:", error);
        } finally {
          setIsLoading(false);
          setIsRelatedLoading(false);
        }
      };

      fetchProductFullData();
    }
  }, [initialProduct, productIdOrSlug]);

  // Find matching variant based on currently selected options
  const matchedVariant = useMemo(() => {
    if (!variants || variants.length === 0) return null;

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

  // Calculate actual rating average and count
  const ratingStats = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      const backendAvg = Number(product?.average_rating ?? product?.rating);
      const backendCount = Number(product?.reviews_count ?? product?.review_count ?? 0);
      if (!isNaN(backendAvg) && backendAvg > 0 && backendCount > 0) {
        return {
          average: Math.round(backendAvg * 10) / 10,
          count: backendCount,
        };
      }
      return { average: null, count: 0 };
    }

    const validRatings = reviews
      .map((r) => Number(r.rating))
      .filter((r) => !isNaN(r) && r >= 1 && r <= 5);

    if (validRatings.length === 0) {
      return { average: null, count: reviews.length };
    }

    const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
    const avg = Math.round((sum / validRatings.length) * 10) / 10;

    return {
      average: avg,
      count: reviews.length,
    };
  }, [reviews, product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-800" dir="rtl">
        <HoneycombLoader 
          size="default" 
          text="در حال دریافت مشخصات و گالری کالا..." 
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-800 px-4" dir="rtl">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-black text-[#0B192C]">محصول مورد نظر یافت نشد</h1>
          <p className="text-xs text-slate-500">ممکن است این کالا حذف یا ناموجود شده باشد.</p>
          <Button asChild className="h-11 px-6 rounded-xl bg-[#0082CA] text-white font-bold text-xs hover:bg-[#006CA8] shadow-md shadow-[#0082CA]/25">
            <Link href="/products">بازگشت به کاتالوگ فروشگاه</Link>
          </Button>
        </div>
      </div>
    );
  }

  const basePrice = parsePrice(product.price);
  const currentPrice = matchedVariant ? parsePrice(matchedVariant.price) : basePrice;
  const discInfo = getDiscountInfo({
    ...product,
    price: currentPrice,
  });
  const finalPayablePrice = discInfo.hasDiscount ? discInfo.discountPrice : currentPrice;
  const isSaved = isInWishlist(product.id);

  const totalProductStock =
    product?.stock_quantity ??
    product?.inventory_count ??
    (variants && variants.length > 0
      ? variants.reduce(
          (sum, v) => sum + (v.stock ?? v.inventory?.available_quantity ?? v.inventory?.quantity ?? 0),
          0
        )
      : 0);

  const isOutOfStock = (() => {
    if (product?.status && product.status !== "published" && product.status !== "active") return true;
    if (totalProductStock <= 0) return true;
    if (options.length > 0 && (!variants || variants.length === 0)) return true;
    if (variants && variants.length > 0) {
      if (!matchedVariant) return true;
      if (matchedVariant.availability === "out_of_stock") return true;
      const variantQty =
        matchedVariant.inventory?.available_quantity ??
        matchedVariant.inventory?.quantity ??
        matchedVariant.stock;
      if (variantQty !== undefined && variantQty <= 0) return true;
    }
    return false;
  })();

  const isPreOrder =
    matchedVariant?.availability === "pre_order" ||
    product?.availability === "pre_order";

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      toast.error("این محصول در حال حاضر در انبار موجود نمی‌باشد.");
      return;
    }

    if (options.length > 0) {
      const missingOption = options.find((opt) => !selectedOptions[opt.name]);
      if (missingOption) {
        toast.error(`لطفاً گزینه "${missingOption.name}" را انتخاب کنید.`);
        return;
      }
    }

    const optionsSummary =
      Object.entries(selectedOptions)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ") || (selectedOptions["سایز"] || selectedOptions["Size"] || "Free");

    const itemWeight =
      matchedVariant?.weight ||
      (product?.metadata && (product.metadata.weight || product.metadata.product_weight)) ||
      product?.weight ||
      500;

    try {
      await addToCart({
        id: product.id,
        name: product.name || product.title,
        price: finalPayablePrice,
        size: optionsSummary,
        quantity: quantity,
        imageUrl: product.imageUrl || product.image_url || "/placeholder-product.svg",
        variant_id: matchedVariant?.id || product.id,
        weight: Number(itemWeight) || 500,
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
        price: finalPayablePrice,
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

      await api.post(`/api/products/${productIdOrSlug}/reviews/`, {
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
    <main className="min-h-screen w-full max-w-7xl min-w-0 mx-auto pt-24 sm:pt-28 pb-32 sm:pb-36 px-4 md:px-6 text-slate-800 overflow-x-hidden" dir="rtl">
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        {product?.breadcrumbs && product.breadcrumbs.length > 0 ? (
          <nav aria-label="مسیر راهنما" className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {product.breadcrumbs.map((bc: { name: string; url: string }, idx: number) => {
              const localUrl = bc.url ? bc.url.replace(/^https?:\/\/[^\/]+/, "") : "/";
              return (
                <span key={bc.url || idx} className="flex items-center gap-2">
                  <Link
                    href={localUrl || "/"}
                    className="hover:text-[#0082CA] transition-colors"
                  >
                    {bc.name}
                  </Link>
                  <span className="text-slate-300">/</span>
                </span>
              );
            })}
            <span className="text-[#0B192C] font-bold truncate max-w-[200px] md:max-w-xs">
              {product.title || product.name}
            </span>
          </nav>
        ) : (
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs md:text-sm text-slate-500 hover:text-[#0082CA] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به کاتالوگ لباس‌ها
          </Link>
        )}

        <Link
          href="/products"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0082CA] transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          مشاهده همه محصولات
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-16 mb-12 sm:mb-16">
        {/* Product Image Gallery Slideshow */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <ProductGallery
            product={product}
            discountInfo={discInfo}
            matchedVariant={matchedVariant}
          />
        </motion.div>

        {/* Product Info & Options */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col justify-center space-y-4 sm:space-y-6">
          {/* Header Badges & Rating */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="bg-sky-50 text-[#0082CA] border border-sky-200 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider">
              {product.category || product.category_name || "پوشاک لوکس"}
            </span>
            {/* Rating or New/No Review Indicator */}
            {ratingStats.average !== null ? (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("reviews-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-1.5 text-amber-500 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors hover:bg-amber-100 cursor-pointer"
                title={`${ratingStats.count.toLocaleString("fa-IR")} دیدگاه خریداران`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-amber-600 font-bold">
                  {ratingStats.average.toLocaleString("fa-IR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({ratingStats.count.toLocaleString("fa-IR")})
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 bg-sky-50/50 border border-sky-100 px-2.5 py-0.5 rounded-full text-xs">
                <Star className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500 font-medium">بدون امتیاز</span>
              </div>
            )}
            {isOutOfStock ? (
              <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                ناموجود در انبار
              </span>
            ) : isPreOrder ? (
              <span className="bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                پیش‌سفارش
              </span>
            ) : (
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                موجود در انبار
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-[#0B192C] leading-snug sm:leading-tight">
            {product.name || product.title}
          </h1>

          {/* Price: Strikethrough original and discounted price */}
          {discInfo.hasDiscount ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2.5 sm:gap-3 flex-wrap">
                <span className="text-sm sm:text-base md:text-lg text-slate-400 line-through decoration-rose-400/50 font-medium">
                  {formatPriceNumber(currentPrice)}
                </span>
                <span className="text-xl sm:text-2xl md:text-4xl font-black text-[#0082CA]">
                  {formatPriceNumber(discInfo.discountPrice)}
                </span>
                <span className="text-xs text-[#0082CA] font-bold">تومان</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-sky-50 text-[#0082CA] border border-sky-200 text-xs font-bold shadow-sm">
                  سود شما از این خرید: {formatPriceNumber(discInfo.savings)} تومان ({discInfo.discountPercent}٪ تخفیف)
                </span>
                {discInfo.remainingTime && (
                  <span className="text-xs text-slate-500">
                    مهلت باقی‌مانده: <strong className="text-slate-800">{discInfo.remainingTime}</strong>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl md:text-4xl font-black text-[#0B192C]">
                {formatPriceNumber(currentPrice)}
              </span>
              <span className="text-xs text-slate-500">تومان</span>
            </div>
          )}

          {/* Description */}
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            {product.description ||
              "طراحی اختصاصی با برترین متریال‌های ارگانیک و دوخت سفارشی پریمیوم، مناسب برای استایل‌های روزمره، رسمی و ترند روز."}
          </p>

          {/* Dynamic Product Options (Colors, Sizes, etc.) */}
          {options.length > 0 && (
            <div className="space-y-5 pt-4 border-t border-sky-100">
              {options.map((opt) => {
                const isColorOption =
                  opt.name.toLowerCase().includes("color") || opt.name.includes("رنگ");
                const currentSelectedVal = selectedOptions[opt.name] || "";

                return (
                  <div key={opt.id || opt.name} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#0082CA]" />
                        {opt.name}:
                        <span className="text-slate-600 font-normal">
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
                              className={`relative w-11 h-11 rounded-full border transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                                isSelected
                                  ? "border-[#0082CA] ring-2 ring-[#0082CA]/40 scale-105 shadow-md"
                                  : "border-slate-200 hover:border-slate-400"
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
                            className={`min-w-12 h-11 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center border cursor-pointer active:scale-95 ${
                              isSelected
                                ? "bg-[#0082CA] text-white border-[#0082CA] shadow-md"
                                : "bg-white text-slate-700 border-sky-200 hover:border-[#0082CA] hover:bg-sky-50"
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
          <div className="pt-4 border-t border-sky-100 space-y-4">
            {isOutOfStock ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="space-y-0.5 text-right">
                  <span className="text-xs font-bold text-rose-700 block">
                    این کالا در حال حاضر در انبار موجود نمی‌باشد
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    به محض شارژ مجدد کالا در انبار، امکان ثبت سفارش مجدداً فعال خواهد شد.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700">تعداد سفارش:</span>
                <div className="flex items-center gap-3 bg-sky-50/60 border border-sky-200 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="کاهش تعداد"
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#0082CA] hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-[#0B192C]">
                    {quantity.toLocaleString("fa-IR")}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="افزایش تعداد"
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#0082CA] hover:bg-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-3 pt-2">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 h-14 rounded-2xl bg-[#0082CA] text-white hover:bg-[#006CA8] text-sm font-black transition-all shadow-md shadow-[#0082CA]/25 gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                {isOutOfStock ? "ناموجود در انبار" : "افزودن به سبد خرید"}
              </Button>

              <Button
                onClick={toggleWishlist}
                variant="outline"
                className={`w-14 h-14 rounded-2xl border transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-sm ${
                  isSaved
                    ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "border-sky-200 bg-white text-slate-600 hover:text-[#0082CA] hover:bg-sky-50"
                }`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-sky-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0082CA]" />
              <span>ضمانت اصالت و سلامت فیزیکی</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#0082CA]" />
              <span>ارسال اکسپرس پستی در سراسر کشور</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Complete the Look (تکمیل استایل) */}
      {completeLook && completeLook.length > 0 && (
        <RelatedProductsSlider
          products={completeLook}
          isLoading={isLoading}
          currentProductId={product?.id || productIdOrSlug}
          title="تکمیل استایل (ست این لباس)"
          subtitle="پیشنهاد استایلیست‌ها برای ست کردن و تکمیل این لباس"
          badgeLabel="آیتم ست"
          headingId="complete-look-heading"
          icon={<Sparkles className="w-4 h-4 text-[#0082CA]" />}
          className="border-sky-100 bg-sky-50/40 rounded-2xl p-4 md:p-6"
        />
      )}

      {/* Related Products Slider Section */}
      <RelatedProductsSlider
        products={relatedProducts}
        isLoading={isRelatedLoading}
        currentProductId={product?.id || productIdOrSlug}
      />

      {/* Reviews & Social Proof */}
      <div id="reviews-section" className="border-t border-sky-100 pt-12 space-y-8 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-black text-[#0B192C] flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0082CA] text-white flex items-center justify-center shadow-md shadow-[#0082CA]/25">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            دیدگاه‌ها و نظرات خریداران ({ratingStats.count.toLocaleString("fa-IR")})
          </h2>
          {ratingStats.average !== null && (
            <div className="flex items-center gap-2 bg-white border border-sky-200 px-3.5 py-1.5 rounded-2xl self-start sm:self-auto shadow-sm">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i <= Math.round(ratingStats.average!) ? "fill-current text-amber-400" : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-black text-[#0B192C]">
                {ratingStats.average.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} از ۵
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Review List */}
          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-white border border-sky-100 rounded-3xl p-8 text-center space-y-2 shadow-sm">
                <p className="text-slate-500 text-xs md:text-sm">
                  هنوز نظری برای این محصول ثبت نشده است. اولین نفری باشید که نظر خود را ثبت می‌کند!
                </p>
              </div>
            ) : (
              reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-sky-100 rounded-2xl p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B192C]">
                      {r.user_name || "کاربر خریدار"}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (r.rating || 5) ? "fill-current text-amber-400" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {r.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* New Review Form */}
          <div className="lg:col-span-5 bg-white border border-sky-100 rounded-3xl p-6 space-y-4 shadow-sm sticky top-28">
            <h3 className="text-sm font-black text-[#0B192C]">ثبت تجربه خرید شما</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">امتیاز به کیفیت لباس</label>
                <div className="flex items-center gap-1 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() => setRating(star)}
                      className={`w-5 h-5 transition-colors ${
                        star <= rating ? "text-amber-400 fill-current" : "text-slate-300 hover:text-amber-400"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">متن دیدگاه</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="کیفیت دوخت، رنگ و تن‌خور لباس چگونه بود؟"
                  rows={4}
                  required
                  className="w-full bg-sky-50/60 border border-sky-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0082CA] resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full h-11 rounded-xl bg-[#0082CA] text-white hover:bg-[#006CA8] font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#0082CA]/25 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmittingReview ? "در حال ثبت..." : "ارسال دیدگاه"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Add to Cart Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-xl border-t border-sky-100 z-40 md:hidden flex items-center gap-3 shadow-[0_-8px_30px_rgba(0,130,202,0.08)]">
        <Button
          onClick={toggleWishlist}
          variant="outline"
          aria-label={isSaved ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
          className={`w-12 h-12 rounded-xl border transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-sm ${
            isSaved
              ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "border-sky-200 bg-white text-slate-700 hover:text-[#0082CA] hover:bg-sky-50"
          }`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
        </Button>
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1 h-12 rounded-xl bg-[#0082CA] text-white hover:bg-[#006CA8] text-xs sm:text-sm font-black transition-all shadow-md shadow-[#0082CA]/25 gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          {isOutOfStock ? "ناموجود در انبار" : `افزودن به سبد (${formatPrice(currentPrice)})`}
        </Button>
      </div>
    </main>
  );
}

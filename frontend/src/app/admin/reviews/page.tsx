"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Star,
  RefreshCw,
  Clock,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { adminApi, ProductReview } from "@/lib/admin-api";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reviewsData, productsData] = await Promise.allSettled([
        adminApi.getReviews(),
        adminApi.getProducts(),
      ]);

      if (reviewsData.status === "fulfilled") {
        setReviews(reviewsData.value);
      }
      if (productsData.status === "fulfilled") {
        setProducts(productsData.value);
      }
    } catch (e) {
      console.error("Error loading reviews data:", e);
      toast.error("خطا در دریافت لیست نظرات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      await adminApi.approveReview(id);
      toast.success("نظر کاربر با موفقیت تایید و منتشر شد.");
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
      );
    } catch {
      toast.error("خطا در تایید نظر");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      await adminApi.rejectReview(id);
      toast.success("نظر کاربر رد شد و نمایش داده نخواهد شد.");
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
      );
    } catch {
      toast.error("خطا در رد نظر");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این دیدگاه مطمئن هستید؟")) return;
    setActionLoadingId(id);
    try {
      await adminApi.deleteReview(id);
      toast.success("دیدگاه مورد نظر حذف گردید.");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("خطا در حذف نظر");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Stats calculation
  const totalCount = reviews.length;
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const rejectedCount = reviews.filter((r) => r.status === "rejected").length;

  // Filtered reviews
  const filteredReviews = reviews.filter((review) => {
    // Tab filter
    if (activeTab !== "all" && review.status !== activeTab) {
      return false;
    }
    // Product filter
    if (selectedProduct !== "all" && review.product_id !== selectedProduct) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (review.text || "").toLowerCase().includes(q);
      const matchUser = (review.user_name || "").toLowerCase().includes(q);
      const matchProduct = (review.product_title || "").toLowerCase().includes(q);
      if (!matchText && !matchUser && !matchProduct) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-sky-400" />
            مدیریت و تایید نظرات کاربران
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            بررسی و تعیین وضعیت دیدگاه‌های ارسال‌شده قبل از انتشار در فروشگاه
          </p>
        </div>

        <Button
          onClick={loadData}
          variant="outline"
          className="h-11 px-5 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-xs flex items-center gap-2 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          بروزرسانی لیست
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab("pending")}
          className={`p-5 rounded-2xl border text-right transition-all ${
            activeTab === "pending"
              ? "bg-amber-500/10 border-amber-500/40 shadow-lg"
              : "bg-[#111111] border-white/5 hover:border-white/10"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-amber-400 font-bold">در انتظار بررسی</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-white font-sans">
            {pendingCount.toLocaleString("fa-IR")}
          </p>
          <span className="text-[11px] text-gray-500 mt-1 block">دیدگاه جدید نیازمند تایید</span>
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={`p-5 rounded-2xl border text-right transition-all ${
            activeTab === "approved"
              ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg"
              : "bg-[#111111] border-white/5 hover:border-white/10"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-emerald-400 font-bold">تایید و منتشر شده</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-white font-sans">
            {approvedCount.toLocaleString("fa-IR")}
          </p>
          <span className="text-[11px] text-gray-500 mt-1 block">دیدگاه‌های فعال در سایت</span>
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`p-5 rounded-2xl border text-right transition-all ${
            activeTab === "rejected"
              ? "bg-rose-500/10 border-rose-500/40 shadow-lg"
              : "bg-[#111111] border-white/5 hover:border-white/10"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-rose-400 font-bold">رد شده</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-white font-sans">
            {rejectedCount.toLocaleString("fa-IR")}
          </p>
          <span className="text-[11px] text-gray-500 mt-1 block">نظرات غیرقابل انتشار</span>
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`p-5 rounded-2xl border text-right transition-all ${
            activeTab === "all"
              ? "bg-white/10 border-white/30 shadow-lg"
              : "bg-[#111111] border-white/5 hover:border-white/10"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-300 font-bold">کل دیدگاه‌ها</span>
            <MessageSquare className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-white font-sans">
            {totalCount.toLocaleString("fa-IR")}
          </p>
          <span className="text-[11px] text-gray-500 mt-1 block">مجموع نظرات ثبت‌شده</span>
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[#111111] border border-white/10 rounded-2xl p-3">
        {/* Search */}
        <div className="flex items-center gap-3 bg-[#161616] border border-white/5 rounded-xl px-4 py-2 flex-1">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس متن نظر، نام مشتری یا نام محصول..."
            className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder:text-gray-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-500 hover:text-white text-xs"
            >
              پاک کردن
            </button>
          )}
        </div>

        {/* Product Dropdown */}
        <div className="flex items-center gap-2 bg-[#161616] border border-white/5 rounded-xl px-3 py-2 shrink-0">
          <ShoppingBag className="w-4 h-4 text-gray-500" />
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            aria-label="فیلتر بر اساس محصول"
            className="bg-transparent border-none outline-none text-white text-xs cursor-pointer"
          >
            <option value="all" className="bg-[#111111] text-white">
              همه محصولات ({products.length})
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#111111] text-white">
                {p.name || p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-12 text-center space-y-4">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">هیچ دیدگاهی در این بخش یافت نشد</h3>
            <p className="text-xs md:text-sm text-gray-400 max-w-sm mx-auto">
              با تغییر فیلترها یا پاک کردن عبارت جستجو، نتایج دیگری را مشاهده کنید.
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const isPending = review.status === "pending";
            const isApproved = review.status === "approved";
            const isRejected = review.status === "rejected";
            const isActing = actionLoadingId === review.id;

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[#111111] border rounded-3xl p-5 md:p-6 transition-all ${
                  isPending
                    ? "border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.03)]"
                    : "border-white/5"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                  {/* Left: User & Product info */}
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold shrink-0">
                      {review.user_name?.charAt(0) || "ک"}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-white font-bold text-sm md:text-base">
                          {review.user_name}
                        </h4>

                        {/* Status Badge */}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            در انتظار بررسی
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            تایید شده (منتشر در سایت)
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            رد شده
                          </span>
                        )}
                      </div>

                      {/* Product details & date */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <Link
                          href={`/products/${review.product_slug || review.product_id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-gray-300 hover:text-white font-medium underline"
                        >
                          <span>محصول: {review.product_title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <span>•</span>
                        <span className="text-gray-500 font-sans">
                          {new Date(review.created_at).toLocaleDateString("fa-IR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 bg-[#161616] border border-white/5 px-3 py-1.5 rounded-xl self-start">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating ? "text-yellow-500 fill-current" : "text-gray-700"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-white mr-1.5 font-sans">
                      {review.rating} از ۵
                    </span>
                  </div>
                </div>

                {/* Comment Text Body */}
                <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 my-4">
                  <p className="text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                    {review.text}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    {!isApproved && (
                      <Button
                        onClick={() => handleApprove(review.id)}
                        disabled={isActing}
                        className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تایید و انتشار نظر
                      </Button>
                    )}

                    {!isRejected && (
                      <Button
                        onClick={() => handleReject(review.id)}
                        disabled={isActing}
                        variant="outline"
                        className="h-9 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 text-gray-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        رد کردن دیدگاه
                      </Button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={isActing}
                    className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="حذف دیدگاه"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

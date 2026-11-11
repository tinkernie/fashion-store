"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  FileText,
  Percent,
  Layers,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Hash,
  UserPlus,
  ExternalLink,
  Edit3,
  Loader2,
  X,
  Barcode,
} from "lucide-react";
import { PosTerminal } from "@/components/admin/pos-terminal";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin-api";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatPriceNumber, parsePrice } from "@/lib/price-utils";
import { getApiErrorMessage } from "@/lib/error-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShamsiDatePicker } from "@/components/ui/shamsi-date-picker";

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    avgOrderValue: 0,
    productsCount: 0,
    pagesCount: 0,
    couponsCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [recentPages, setRecentPages] = useState<any[]>([]);

  // Instagram Code Search States
  const [instaCodeQuery, setInstaCodeQuery] = useState("");
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [searchedProduct, setSearchedProduct] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Quick Customer Registration Modal States
  const [isQuickUserOpen, setIsQuickUserOpen] = useState(false);
  const [quickPhone, setQuickPhone] = useState("");
  const [quickBirthDate, setQuickBirthDate] = useState("");
  const [isSubmittingQuickCreate, setIsSubmittingQuickCreate] = useState(false);

  // Quick POS & Barcode Scanner Modal State
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [salesRes, ordersRes, productsRes, pagesRes, couponsRes, popProductsRes] =
        await Promise.allSettled([
          adminApi.getSalesSummary(),
          adminApi.getOrders(),
          adminApi.getProducts(),
          adminApi.getPages(),
          adminApi.getCoupons(),
          adminApi.getPopularProducts(5),
        ]);

      const sales = salesRes.status === "fulfilled" ? salesRes.value : { total_revenue: 0, order_count: 0 };
      const orders = ordersRes.status === "fulfilled" ? ordersRes.value : [];
      const products = productsRes.status === "fulfilled" ? productsRes.value : [];
      const pages = pagesRes.status === "fulfilled" ? pagesRes.value : [];
      const coupons = couponsRes.status === "fulfilled" ? couponsRes.value : [];
      const popProducts = popProductsRes.status === "fulfilled" ? popProductsRes.value : [];

      const totalRevenue = parsePrice(sales.total_revenue) || orders.reduce((sum: number, o: any) => sum + parsePrice(o.total), 0);
      const orderCount = orders.length || sales.order_count || 0;
      const avg = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

      setStats({
        totalSales: totalRevenue,
        orderCount,
        avgOrderValue: avg,
        productsCount: products.length,
        pagesCount: pages.length,
        couponsCount: coupons.length,
      });

      setRecentOrders(orders.slice(0, 5));
      setPopularProducts(popProducts.length > 0 ? popProducts : products.slice(0, 5));
      setRecentPages(pages.slice(0, 4));
    } catch (e) {
      console.error("Dashboard data load error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (val: any) => {
    return formatPriceNumber(val);
  };

  const handleSearchByInstaCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = instaCodeQuery
      .trim()
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

    if (!cleanCode) {
      toast.error("لطفاً کد اینستاگرام محصول را وارد کنید");
      return;
    }

    setIsSearchingCode(true);
    setSearchError(null);
    setSearchedProduct(null);

    try {
      let found: any = null;

      // 1. Direct public/admin by-code lookup
      try {
        const directRes = await api.get(`/api/products/by-code/${cleanCode}/`);
        if (directRes?.data && (directRes.data.id || directRes.data.name || directRes.data.title)) {
          found = directRes.data;
        }
      } catch {
        // Fall back to admin product list query
      }

      // 2. Fall back to adminApi.getProducts with code filter
      if (!found) {
        const list = await adminApi.getProducts({ code: cleanCode });
        if (Array.isArray(list) && list.length > 0) {
          found = list.find((p: any) => String(p.insta_id) === cleanCode) || list[0];
        }
      }

      if (found) {
        setSearchedProduct(found);
        toast.success(`محصول با کد #${cleanCode} پیدا شد`);
      } else {
        const msg = `محصولی با کد اینستاگرام «${cleanCode}» یافت نشد.`;
        setSearchError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      console.error("Error searching by insta code:", err);
      const msg = getApiErrorMessage(err, `خطا در جستجوی محصول با کد ${cleanCode}`);
      setSearchError(msg);
      toast.error(msg);
    } finally {
      setIsSearchingCode(false);
    }
  };

  const handleClearCodeSearch = () => {
    setInstaCodeQuery("");
    setSearchedProduct(null);
    setSearchError(null);
  };

  const handleQuickCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = quickPhone
      .trim()
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
    const birthDate = quickBirthDate
      .trim()
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

    if (!/^09\d{9}$/.test(phone)) {
      toast.error("شماره موبایل نامعتبر است (باید ۱۱ رقم و با 09 آغاز شود)");
      return;
    }

    if (!birthDate) {
      toast.error("لطفاً تاریخ تولد مشتری را مشخص فرمایید");
      return;
    }

    const jalaliPattern = /^1[34]\d{2}[/\-.](0[1-9]|1[0-2])[/\-.](0[1-9]|[12]\d|3[01])$/;
    if (!jalaliPattern.test(birthDate)) {
      toast.error("فرمت تاریخ تولد باید به صورت 1370/05/21 باشد");
      return;
    }

    setIsSubmittingQuickCreate(true);
    try {
      await adminApi.quickCreateUser({
        phone_number: phone,
        birth_date: birthDate,
      });
      toast.success("مشتری با موفقیت ثبت شد", {
        description: `رمز عبور اولیه: 12345 | موبایل: ${phone}`,
      });
      setIsQuickUserOpen(false);
      setQuickPhone("");
      setQuickBirthDate("");
    } catch (err: any) {
      console.error("Quick create user error:", err);
      toast.error(getApiErrorMessage(err, "خطا در ثبت سریع کاربر"));
    } finally {
      setIsSubmittingQuickCreate(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-l from-[#141414] via-[#111111] to-[#0d0d0d] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              مرکز مدیریت و کنترل هوشمند فروشگاه
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              سلام مدیر گرامی، به پنل مدیریت خوش آمدید
            </h1>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
              از اینجا می‌توانید بدون نیاز به کدنویسی، بنرها، اطلاعیه‌ها، برگه‌ها، کاتالوگ محصولات و وضعیت سفارشات را به آسانی مدیریت کنید.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="h-11 px-5 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Link href="/admin/products">
                <Plus className="w-4 h-4" />
                افزودن محصول جدید
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 px-5 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Link href="/admin/cms">
                <FileText className="w-4 h-4" />
                مدیریت بنر و CMS
              </Link>
            </Button>
            <button
              onClick={loadDashboardData}
              className="p-3 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="بروزرسانی آمار"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Quick Operations Row (Instagram Code Search & Quick Add User) */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Instagram Code Search Bar */}
          <div className="flex-1 max-w-xl">
            <form onSubmit={handleSearchByInstaCode} className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center bg-[#181818] border border-amber-400/25 focus-within:border-amber-400/70 rounded-2xl px-3.5 py-1.5 transition-all shadow-inner">
                <Hash className="w-4 h-4 text-amber-400 shrink-0 ml-1.5" />
                <input
                  type="text"
                  value={instaCodeQuery}
                  onChange={(e) => {
                    setInstaCodeQuery(e.target.value);
                    if (searchError) setSearchError(null);
                  }}
                  placeholder="جستجوی سریع محصول با کد اینستاگرام (مثلاً: ۲۵ یا 104)..."
                  className="flex-1 bg-transparent border-none outline-none text-amber-300 font-mono text-xs placeholder:text-gray-500 placeholder:font-sans placeholder:text-right"
                  dir="ltr"
                />
                {instaCodeQuery && (
                  <button
                    type="button"
                    onClick={handleClearCodeSearch}
                    className="text-gray-500 hover:text-amber-300 text-xs px-1 cursor-pointer"
                    aria-label="پاک کردن"
                  >
                    ✕
                  </button>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSearchingCode || !instaCodeQuery.trim()}
                className="h-10 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-400/10 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSearchingCode ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>جستجوی کد</span>
              </Button>
            </form>

            {/* Search Error Notice */}
            {searchError && (
              <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 flex items-center justify-between">
                <span>{searchError}</span>
                <button
                  type="button"
                  onClick={() => setSearchError(null)}
                  className="text-rose-400 hover:text-white cursor-pointer px-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions (Add Customer & Barcode Scanner) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Button
              type="button"
              onClick={() => setIsPosModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Barcode className="w-4 h-4 text-black" />
              <span>بارکد خوان (صندوق حضوری)</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsQuickUserOpen(true)}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>افزودن سریع مشتری</span>
            </Button>
          </div>
        </div>

        {/* Live Product Preview Card */}
        {searchedProduct && (
          <div className="relative z-10 mt-4 p-4 rounded-2xl bg-[#161616] border border-amber-400/40 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={
                      searchedProduct.imageUrl ||
                      searchedProduct.image_url ||
                      searchedProduct.image ||
                      (Array.isArray(searchedProduct.images) &&
                        (typeof searchedProduct.images[0] === "string"
                          ? searchedProduct.images[0]
                          : searchedProduct.images[0]?.url)) ||
                      "/placeholder.webp"
                    }
                    alt={searchedProduct.name || searchedProduct.title || "تصویر محصول"}
                    className="w-14 h-16 object-cover rounded-xl border border-white/10"
                  />
                  <span
                    className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-black text-[10px] shadow"
                    dir="ltr"
                  >
                    #{searchedProduct.insta_id}
                  </span>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm truncate max-w-xs">
                      {searchedProduct.name || searchedProduct.title}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md">
                      کد اینستا: {searchedProduct.insta_id}
                    </span>
                    {searchedProduct.category_name && (
                      <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                        {searchedProduct.category_name}
                      </span>
                    )}
                  </div>

                  {/* Price & Stock info */}
                  <div className="flex items-center gap-3 text-xs text-gray-300 flex-wrap">
                    <div className="flex items-center gap-1 font-bold text-emerald-400">
                      <span>قیمت:</span>
                      <span>
                        {formatPrice(
                          searchedProduct.discount_price || searchedProduct.price || 0
                        )}{" "}
                        تومان
                      </span>
                      {searchedProduct.discount_price && searchedProduct.price && (
                        <span className="line-through text-gray-500 text-[10px] mr-1">
                          {formatPrice(searchedProduct.price)}
                        </span>
                      )}
                    </div>

                    <span className="text-gray-500">•</span>

                    <span className="text-xs text-gray-300">
                      موجودی کل:{" "}
                      <strong className="text-white font-mono">
                        {(
                          searchedProduct.stock_quantity ??
                          searchedProduct.inventory_count ??
                          (Array.isArray(searchedProduct.variants)
                            ? searchedProduct.variants.reduce(
                                (acc: number, v: any) =>
                                  acc + (v.stock ?? v.inventory?.quantity ?? 0),
                                0
                              )
                            : 0)
                        ).toLocaleString("fa-IR")}
                      </strong>{" "}
                      عدد
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Close */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Link
                    href={`/products/${searchedProduct.slug || searchedProduct.insta_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    <span>مشاهده در سایت</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="h-9 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-400/20 cursor-pointer"
                >
                  <Link href={`/admin/products?search=${searchedProduct.insta_id}`}>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>ویرایش در پنل</span>
                  </Link>
                </Button>

                <button
                  type="button"
                  onClick={() => setSearchedProduct(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="بستن پیش‌نمایش"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Variants Breakdown if available */}
            {Array.isArray(searchedProduct.variants) && searchedProduct.variants.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-gray-400 font-medium ml-1">تنوع‌ها و موجودی:</span>
                {searchedProduct.variants.map((v: any, idx: number) => {
                  const vStock = v.stock ?? v.inventory?.quantity ?? 0;
                  const label =
                    Array.isArray(v.options) && v.options.length > 0
                      ? v.options.map((o: any) => o.value || o.name).join(" / ")
                      : v.sku || `تنوع #${idx + 1}`;

                  return (
                    <span
                      key={v.id || idx}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border ${
                        vStock > 0
                          ? "bg-white/5 text-gray-200 border-white/10"
                          : "bg-rose-500/10 text-rose-300 border-rose-500/20 opacity-60"
                      }`}
                    >
                      <span className="font-bold">{label}:</span>
                      <span className={vStock > 0 ? "text-amber-400 font-bold" : "text-rose-400"}>
                        {vStock > 0 ? `${vStock} عدد` : "ناموجود"}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Sales */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111111] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400">مجموع فروش و درآمد</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-white mb-1">
            {formatPrice(stats.totalSales)} <span className="text-xs font-normal text-gray-400">تومان</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <span>میانگین سفارش:</span>
            <span>{formatPrice(stats.avgOrderValue)} تومان</span>
          </div>
        </motion.div>

        {/* Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#111111] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400">تعداد کل سفارشات</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-white mb-1">
            {stats.orderCount.toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-normal text-gray-400">سفارش</span>
          </div>
          <Link
            href="/admin/orders"
            className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>مشاهده لیست سفارشات</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>

        {/* Active Products */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111111] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400">محصولات کاتالوگ</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-white mb-1">
            {stats.productsCount.toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-normal text-gray-400">کالا</span>
          </div>
          <Link
            href="/admin/products"
            className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
          >
            <span>مدیریت محصولات</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>

        {/* CMS Pages */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#111111] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400">برگه‌های محتوایی (CMS)</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-white mb-1">
            {stats.pagesCount.toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-normal text-gray-400">برگه</span>
          </div>
          <Link
            href="/admin/cms"
            className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>مدیریت صفحات و بنرها</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>
      </div>

      {/* Main Two Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">آخرین سفارشات مشتریان</h2>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>مشاهده همه</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 md:p-6 shadow-xl space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                هنوز سفارشی ثبت نشده است
              </div>
            ) : (
              recentOrders.map((order) => {
                const orderId = order.order_number || order.id?.substring(0, 8) || "سفارش";
                const amount = parsePrice(order.total);
                const status = order.status || "pending";

                const getStatusBadge = (st: string) => {
                  switch (st) {
                    case "delivered":
                      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    case "shipped":
                      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
                    case "processing":
                    case "paid":
                      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
                    case "cancelled":
                      return "bg-red-500/10 text-red-400 border-red-500/20";
                    default:
                      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
                  }
                };

                return (
                  <div
                    key={order.id || order.order_number}
                    className="p-4 rounded-xl bg-[#161616] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/10 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white text-sm" dir="ltr">
                          #{orderId}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {order.shipping_address?.full_name || "مشتری فروشگاه"} •{" "}
                        {order.items?.length || 1} کالا
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t border-white/5 sm:border-0">
                      <span className="font-bold text-sm text-white">
                        {formatPrice(amount)} تومان
                      </span>
                      <Button
                        asChild
                        variant="ghost"
                        className="h-8 px-3 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/10"
                      >
                        <Link href="/admin/orders">
                          مدیریت
                          <ArrowLeftIcon className="w-3 h-3 mr-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: CMS Quick Pages & Popular Products */}
        <div className="lg:col-span-5 space-y-6">
          {/* CMS Quick Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">برگه‌های محتوا (CMS)</h2>
              </div>
              <Link
                href="/admin/cms"
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>مدیریت CMS</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 md:p-6 shadow-xl space-y-3">
              {recentPages.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  برگه‌ای هنوز ساخته نشده است. در بخش CMS برگه ایجاد کنید.
                </div>
              ) : (
                recentPages.map((page) => (
                  <div
                    key={page.slug}
                    className="p-3 rounded-xl bg-[#161616] border border-white/5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{page.title}</h4>
                      <span className="text-[10px] text-gray-500 font-mono" dir="ltr">
                        /{page.slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          page.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {page.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                      </span>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                      >
                        <Link href="/admin/cms" title="ویرایش">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <Button
                asChild
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white font-bold text-xs transition-all mt-2"
              >
                <Link href="/admin/cms">+ ساخت یا ویرایش برگه جدید</Link>
              </Button>
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 md:p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white mb-2">دسترسی سریع مدیر</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/admin/cms"
                className="p-3 rounded-xl bg-[#161616] border border-white/5 hover:border-white/20 transition-all flex flex-col gap-1.5 group"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-gray-200 group-hover:text-white">
                  متن بنرها و اطلاعیه
                </span>
                <span className="text-[10px] text-gray-500">ویرایش فوری بدون کد</span>
              </Link>

              <Link
                href="/admin/products"
                className="p-3 rounded-xl bg-[#161616] border border-white/5 hover:border-white/20 transition-all flex flex-col gap-1.5 group"
              >
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-gray-200 group-hover:text-white">
                  افزودن لباس یا قیمت
                </span>
                <span className="text-[10px] text-gray-500">مدیریت موجودی کالا</span>
              </Link>

              <Link
                href="/admin/coupons"
                className="p-3 rounded-xl bg-[#161616] border border-white/5 hover:border-white/20 transition-all flex flex-col gap-1.5 group"
              >
                <Percent className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-gray-200 group-hover:text-white">
                  کد تخفیف جشنواره
                </span>
                <span className="text-[10px] text-gray-500">تعریف تخفیف جدید</span>
              </Link>

              <Link
                href="/admin/orders"
                className="p-3 rounded-xl bg-[#161616] border border-white/5 hover:border-white/20 transition-all flex flex-col gap-1.5 group"
              >
                <Package className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-gray-200 group-hover:text-white">
                  ارسال بسته‌ها
                </span>
                <span className="text-[10px] text-gray-500">تغییر وضعیت به ارسال</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Create Customer Modal */}
      <Dialog open={isQuickUserOpen} onOpenChange={setIsQuickUserOpen}>
        <DialogContent className="bg-[#111111] border border-white/10 text-white w-[95vw] sm:max-w-lg md:max-w-xl p-6 rounded-3xl shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2.5 text-white">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              افزودن سریع مشتری جدید
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQuickCreateUser} className="space-y-4 mt-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400 leading-relaxed">
              این فرم برای ثبت سریع مشتریان حضوری و تلفنی طراحی شده است. مشتری با رمز عبور اولیه <strong className="text-white font-mono" dir="ltr">12345</strong> ایجاد می‌شود و در آینده می‌تواند از طریق فراموشی رمز عبور آن را تغییر دهد.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">شماره موبایل مشتری</label>
              <input
                required
                type="tel"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                placeholder="09123456789"
                maxLength={11}
                dir="ltr"
                className="w-full bg-[#181818] border border-white/15 rounded-xl h-11 px-3 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">تاریخ تولد</label>
              <ShamsiDatePicker
                value={quickBirthDate}
                onChange={setQuickBirthDate}
                theme="dark"
                outputFormat="jalali"
                minYear={1320}
                maxYear={1405}
                placeholder="انتخاب تاریخ تولد..."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmittingQuickCreate}
                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {isSubmittingQuickCreate ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>ثبت مشتری</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickUserOpen(false)}
                className="h-11 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                انصراف
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick In-Store POS & Barcode Scanner Dialog */}
      <Dialog open={isPosModalOpen} onOpenChange={setIsPosModalOpen}>
        <DialogContent className="max-w-4xl bg-[#141414] border-white/15 text-white rounded-3xl p-2 sm:p-4 overflow-hidden" dir="rtl">
          <PosTerminal isModal={true} onClose={() => setIsPosModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ArrowLeftIcon(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

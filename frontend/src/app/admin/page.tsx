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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin-api";
import { toast } from "sonner";

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

      const totalRevenue = sales.total_revenue || orders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
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

  const formatPrice = (val: number) => {
    return (val || 0).toLocaleString("fa-IR");
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
              سلام مدیر عزیز، به پنل مدیریت خوش آمدید 👋
            </h1>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
              از اینجا می‌توانید بدون نیاز به کدنویسی، بنرها، اطلاعیه‌ها، برگه‌ها، کاتالوگ محصولات و وضعیت سفارشات را به آسانی مدیریت کنید.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="h-11 px-5 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center gap-2 shadow-lg"
            >
              <Link href="/admin/products">
                <Plus className="w-4 h-4" />
                افزودن محصول جدید
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 px-5 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-xs flex items-center gap-2"
            >
              <Link href="/admin/cms">
                <FileText className="w-4 h-4" />
                مدیریت بنر و CMS
              </Link>
            </Button>
            <button
              onClick={loadDashboardData}
              className="p-3 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="بروزرسانی آمار"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
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
                const amount = Number(order.total) || 0;
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

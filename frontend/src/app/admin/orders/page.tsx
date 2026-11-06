"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  AlertCircle,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  Send,
  XCircle,
  Loader2,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { formatShamsiDate } from "@/lib/jalali";
import { formatPrice, parsePrice } from "@/lib/price-utils";

const STATUS_TABS = [
  { id: "all", label: "تمام سفارشات پرداخت‌شده" },
  { id: "paid", label: "پرداخت شده (جدید)" },
  { id: "packing", label: "در حال بسته‌بندی" },
  { id: "shipping", label: "ارسال شده به پست" },
  { id: "delivered", label: "تحویل مشتری" },
  { id: "cancelled", label: "لغو شده / مرجوعی" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [transitionNote, setTransitionNote] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getOrders();
      setOrders(data);
    } catch (e) {
      console.error("Error fetching admin orders:", e);
      toast.error(getApiErrorMessage(e, "خطا در دریافت لیست سفارشات"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetails = async (order: any) => {
    setSelectedOrder(order);
    setTransitionNote("");
    setIsModalOpen(true);
    setIsLoadingDetails(true);

    try {
      const lookupKey = order.order_number || order.id;
      const fullOrder = await adminApi.getOrder(lookupKey);
      if (fullOrder) {
        setSelectedOrder((prev: any) => ({
          ...(prev || {}),
          ...fullOrder,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch full order details:", err);
      // Keep optimistic basic order open, show subtle notification
      toast.error("خطا در بارگذاری جزئیات کامل سفارش");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleStatusTransition = async (orderId: string, newStatus: string) => {
    setIsLoading(true);
    try {
      await adminApi.transitionOrderStatus(orderId, newStatus, transitionNote);
      const statusLabels: Record<string, string> = {
        packing: "در حال بسته‌بندی",
        processing: "در حال بسته‌بندی",
        shipping: "ارسال شده به پست",
        shipped: "ارسال شده به پست",
        delivered: "تحویل مشتری",
        paid: "پرداخت شده",
        cancelled: "لغو شده",
        pending: "در انتظار پرداخت",
      };
      toast.success(`وضعیت سفارش به «${statusLabels[newStatus] || newStatus}» تغییر یافت`);
      
      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId || o.order_number === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.order_number === orderId)) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "خطا در تغییر وضعیت سفارش"));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "delivered":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          label: "تحویل داده شده",
          icon: CheckCircle2,
        };
      case "shipping":
      case "shipped":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          label: "تحویل به پست",
          icon: Truck,
        };
      case "packing":
      case "processing":
        return {
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          label: "در حال بسته‌بندی",
          icon: Package,
        };
      case "paid":
        return {
          bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          label: "پرداخت شده",
          icon: CheckCircle2,
        };
      case "cancelled":
        return {
          bg: "bg-red-500/10 text-red-400 border-red-500/20",
          label: "لغو شده",
          icon: XCircle,
        };
      case "returned":
        return {
          bg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          label: "مرجوع شده",
          icon: RotateCcw,
        };
      default:
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          label: "در انتظار پرداخت",
          icon: Clock,
        };
    }
  };

  const filteredOrders = orders.filter((o) => {
    const orderNum = (o.order_number || o.id || "").toLowerCase();
    const customer = (o.customer_name || o.shipping_address?.full_name || "").toLowerCase();
    const phone = (o.customer_phone || o.shipping_address?.phone || "").toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || orderNum.includes(q) || customer.includes(q) || phone.includes(q);
    
    let matchesTab = activeStatusTab === "all";
    if (!matchesTab) {
      if (activeStatusTab === "packing" || activeStatusTab === "processing") {
        matchesTab = o.status === "packing" || o.status === "processing";
      } else if (activeStatusTab === "shipping" || activeStatusTab === "shipped") {
        matchesTab = o.status === "shipping" || o.status === "shipped";
      } else {
        matchesTab = o.status === activeStatusTab;
      }
    }
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-400" />
            مدیریت سفارشات و ارسال مرسولات
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            پیگیری سفارش‌ها، مشاهده نشانی پستی خریداران و تغییر وضعیت ارسال بسته‌ها
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveStatusTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeStatusTab === tab.id
                ? "bg-white text-black shadow-lg"
                : "bg-[#111111] border border-white/5 text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-4 py-2">
        <Search className="w-4 h-4 text-gray-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو با شماره سفارش، نام تحویل‌گیرنده یا شماره تماس..."
          className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder:text-gray-600"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#161616] text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-4 md:p-5 font-bold">شماره سفارش</th>
                <th className="p-4 md:p-5 font-bold">مشتری و تحویل‌گیرنده</th>
                <th className="p-4 md:p-5 font-bold">تعداد اقلام</th>
                <th className="p-4 md:p-5 font-bold">مبلغ کل (تومان)</th>
                <th className="p-4 md:p-5 font-bold">وضعیت سفارش</th>
                <th className="p-4 md:p-5 font-bold text-left">اقدام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    هیچ سفارشی در این وضعیت یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderId = order.order_number || order.id?.substring(0, 8) || "سفارش";
                  const badge = getStatusBadge(order.status);
                  const Icon = badge.icon;
                  const customer = order.customer_name || order.shipping_address?.full_name || "کاربر سایت";
                  const phone = order.customer_phone || order.shipping_address?.phone || "";
                  const itemCount = order.items_count ?? order.items?.length ?? 1;

                  return (
                    <tr key={order.id || order.order_number} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 md:p-5 font-bold text-white">
                        <div className="space-y-0.5">
                          <span className="font-mono text-sm block" dir="ltr">
                            #{orderId}
                          </span>
                          <span className="text-[10px] text-gray-400 font-sans">
                            {formatShamsiDate(order.placed_at || order.created_at, { mode: "full", withTime: true })}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 md:p-5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block">{customer}</span>
                          {phone && (
                            <span className="text-[10px] text-gray-400 font-mono block" dir="ltr">
                              {phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 md:p-5 text-gray-300">
                        {itemCount.toLocaleString("fa-IR")} قلم کالا
                      </td>

                      <td className="p-4 md:p-5 font-bold text-white text-xs md:text-sm">
                        {formatPrice(order.total)}
                      </td>

                      <td className="p-4 md:p-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="p-4 md:p-5 text-left">
                        <Button
                          onClick={() => handleOpenDetails(order)}
                          className="h-9 px-3.5 rounded-xl bg-white/10 text-white hover:bg-white hover:text-black font-bold text-xs transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          مشاهده و تغییر وضعیت
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Order Details & Lifecycle Modal --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="bg-[#0e0e0e] border border-white/10 text-white w-[95vw] sm:max-w-4xl md:max-w-5xl p-6 max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-black flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                جزئیات سفارش #{selectedOrder?.order_number || selectedOrder?.id}
              </span>
              {selectedOrder && (
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold border ${
                    getStatusBadge(selectedOrder.status).bg
                  }`}
                >
                  {getStatusBadge(selectedOrder.status).label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Quick Status Workflow Changer */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300">تغییر وضعیت مرسوله</h4>
                  <span className="text-[11px] text-gray-400">
                    وضعیت فعلی: <strong className="text-white">{getStatusBadge(selectedOrder.status).label}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(selectedOrder.id, "paid")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedOrder.status === "paid"
                        ? "bg-indigo-500/30 border-indigo-500 text-white shadow-lg"
                        : "bg-[#1c1c1c] border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/40 text-indigo-300"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    تایید پرداخت (Paid)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(selectedOrder.id, "packing")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedOrder.status === "packing" || selectedOrder.status === "processing"
                        ? "bg-purple-500/30 border-purple-500 text-white shadow-lg"
                        : "bg-[#1c1c1c] border-white/10 hover:bg-purple-500/20 hover:border-purple-500/40 text-purple-300"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    بسته‌بندی (Packing)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(selectedOrder.id, "shipping")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedOrder.status === "shipping" || selectedOrder.status === "shipped"
                        ? "bg-blue-500/30 border-blue-500 text-white shadow-lg"
                        : "bg-[#1c1c1c] border-white/10 hover:bg-blue-500/20 hover:border-blue-500/40 text-blue-300"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    تحویل به پست (Shipping)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(selectedOrder.id, "delivered")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedOrder.status === "delivered"
                        ? "bg-emerald-500/30 border-emerald-500 text-white shadow-lg"
                        : "bg-[#1c1c1c] border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-emerald-300"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    تحویل مشتری (Delivered)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(selectedOrder.id, "cancelled")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedOrder.status === "cancelled"
                        ? "bg-red-500/30 border-red-500 text-white shadow-lg"
                        : "bg-[#1c1c1c] border-white/10 hover:bg-red-500/20 hover:border-red-500/40 text-red-300"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    لغو سفارش (Cancelled)
                  </button>
                </div>

                <div className="pt-2">
                  <Input
                    placeholder="یادداشت تغییر وضعیت (اختیاری)..."
                    value={transitionNote}
                    onChange={(e) => setTransitionNote(e.target.value)}
                    className="bg-[#181818] border-white/10 text-white rounded-xl text-xs h-9"
                  />
                </div>
              </div>

              {/* Customer Account & Shipping Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Owner Card */}
                <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-400" />
                    مشخصات حساب کاربری خریدار
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[11px]">نام خریدار:</span>
                      <span className="text-white font-bold block mt-0.5">
                        {selectedOrder.customer?.full_name || selectedOrder.customer_name || selectedOrder.shipping_address?.full_name || "کاربر سایت"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">شماره همراه حساب:</span>
                      <span className="text-white font-mono block mt-0.5" dir="ltr">
                        {selectedOrder.customer?.phone || selectedOrder.customer_phone || selectedOrder.shipping_address?.phone || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">ایمیل خریدار:</span>
                      <span className="text-gray-300 font-mono text-[11px] block mt-0.5" dir="ltr">
                        {selectedOrder.customer?.email || selectedOrder.customer_email || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">روش ارسال انتخابی:</span>
                      <span className="text-amber-400 font-bold block mt-0.5">
                        {selectedOrder.shipping_method === "pickup"
                          ? "تحویل حضوری در فروشگاه (قیدار)"
                          : selectedOrder.shipping_method === "vizheh"
                          ? "پست ویژه (سریع)"
                          : "پست پیشتاز"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recipient & Postal Address Card */}
                <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    اطلاعات تحویل‌گیرنده و نشانی پستی
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[11px]">نام تحویل‌گیرنده:</span>
                      <span className="text-white font-bold block mt-0.5">
                        {selectedOrder.shipping_address?.full_name || selectedOrder.customer?.full_name || selectedOrder.customer_name || "ثبت نشده"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">تلفن تماس تحویل‌گیرنده:</span>
                      <span className="text-white font-mono block mt-0.5" dir="ltr">
                        {selectedOrder.shipping_address?.phone || selectedOrder.customer?.phone || selectedOrder.customer_phone || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">استان و شهر:</span>
                      <span className="text-gray-200 block mt-0.5">
                        {[selectedOrder.shipping_address?.province, selectedOrder.shipping_address?.city].filter(Boolean).join("، ") || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">نشانی کامل پستی:</span>
                      <span className="text-gray-200 leading-relaxed block mt-0.5">
                        {selectedOrder.shipping_address?.address || "آدرس ثبت نشده"}
                      </span>
                    </div>
                    {selectedOrder.shipping_address?.postal_code && (
                      <div>
                        <span className="text-gray-500 block text-[11px]">کد پستی:</span>
                        <span className="text-white font-mono block mt-0.5" dir="ltr">
                          {selectedOrder.shipping_address.postal_code}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items in Order */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                    اقلام سفارش داده شده
                  </h4>
                  {isLoadingDetails && (
                    <span className="text-[11px] text-blue-400 flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      در حال دریافت ریز اقلام...
                    </span>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-3">
                  {isLoadingDetails && (!selectedOrder.items || selectedOrder.items.length === 0) ? (
                    <div className="space-y-3 py-2">
                      <div className="flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 rounded-lg bg-white/5" />
                          <div className="space-y-2">
                            <div className="w-32 h-3 rounded bg-white/10" />
                            <div className="w-20 h-2.5 rounded bg-white/5" />
                          </div>
                        </div>
                        <div className="w-16 h-3 rounded bg-white/10" />
                      </div>
                    </div>
                  ) : selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any, idx: number) => {
                      const snap = item.product_snapshot || {};
                      const itemTitle = snap.title || item.product_title || item.name || `کالای شماره ${idx + 1}`;
                      const itemOptions = snap.options || (item.size ? `سایز: ${item.size}` : "");
                      let rawImage = snap.image?.url || (typeof snap.image === "string" ? snap.image : "") || item.image?.url || (typeof item.image === "string" ? item.image : "") || item.product_image || "";
                      let finalImage = rawImage;
                      if (finalImage && !finalImage.startsWith("http") && !finalImage.startsWith("data:")) {
                        const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
                        finalImage = `${backendBase}${finalImage.startsWith("/") ? "" : "/"}${finalImage}`;
                      }

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between pb-3 border-b border-white/5 last:border-0 last:pb-0 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {finalImage && (
                              <img
                                src={finalImage}
                                alt={itemTitle}
                                className="w-10 h-12 object-cover rounded-lg border border-white/10 bg-[#181818]"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                            )}
                            <div>
                              <span className="font-bold text-white block">
                                {itemTitle}
                              </span>
                              <span className="text-gray-400 text-[11px] block mt-0.5">
                                تعداد: {item.quantity} عدد {itemOptions ? `| ${itemOptions}` : ""}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-white">
                            {formatPrice(parsePrice(item.price || item.unit_price) * item.quantity)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-500 text-xs py-2">اطلاعات ریز اقلام موجود نیست</div>
                  )}
                </div>
              </div>

              {/* Total & Payment Summary */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="space-y-1.5 text-xs text-gray-400 border-b border-white/10 pb-3">
                  {selectedOrder.subtotal !== undefined && selectedOrder.subtotal > 0 && (
                    <div className="flex justify-between items-center">
                      <span>جمع اقلام:</span>
                      <span className="text-white font-mono">{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                  )}
                  {selectedOrder.discount_amount !== undefined && selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between items-center text-emerald-400">
                      <span>تخفیف کوپن:</span>
                      <span className="font-mono">-{formatPrice(selectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  {selectedOrder.shipping_cost !== undefined && (
                    <div className="flex justify-between items-center">
                      <span>هزینه ارسال:</span>
                      <span className="text-white font-mono">
                        {selectedOrder.shipping_cost > 0 ? formatPrice(selectedOrder.shipping_cost) : "رایگان"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-bold text-gray-300">مبلغ کل قابل پرداخت:</span>
                  <span className="text-lg font-black text-white">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>

                {selectedOrder.payment_info?.tracking_code && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CreditCard className="w-3.5 h-3.5" />
                      کد پیگیری پرداخت بانکی:
                    </span>
                    <span className="font-mono text-white" dir="ltr">
                      {selectedOrder.payment_info.tracking_code}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

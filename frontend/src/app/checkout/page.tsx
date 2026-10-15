"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Tag,
  X,
  Truck,
  Loader2,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/store/cart";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { toast } from "sonner";
import Link from "next/link";
import { formatPrice, parsePrice } from "@/lib/price-utils";
import { isTokenExpired } from "@/lib/auth";
import {
  UserAddress,
  ShippingQuoteResponse,
  fetchUserAddresses,
  fetchShippingQuote,
} from "@/lib/address-shipping-api";
import { AddressSelector } from "@/components/checkout/address-selector";
import { ShippingMethodSelector } from "@/components/checkout/shipping-method-selector";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    coupon,
    applyCoupon,
    removeCoupon,
    clearCart,
    fetchCart,
    getTotal,
    getTotalWeight,
    getDiscountAmount,
  } = useCart();

  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<"dummy" | "zarinpal">("dummy");

  // Address and Shipping states
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const [shippingQuote, setShippingQuote] = useState<ShippingQuoteResponse | null>(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>("pishtaz");
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  // Load addresses on mount
  const loadAddresses = useCallback(async () => {
    setIsLoadingAddresses(true);
    try {
      const list = await fetchUserAddresses();
      setAddresses(list);
      if (list.length > 0) {
        const defaultAddr = list.find((a) => a.is_default) || list[0];
        setSelectedAddress(defaultAddr);
      }
    } catch (e: any) {
      console.error("Error loading addresses:", e);
      toast.error(getApiErrorMessage(e, "خطا در دریافت لیست آدرس‌ها"));
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  // Check auth and initial cart
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      const expired = isTokenExpired(token, 0);
      if (!token || expired) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        loadAddresses();
      }
    }
  }, [loadAddresses]);

  // Request shipping quote whenever selected address changes
  useEffect(() => {
    if (!selectedAddress?.id) {
      setShippingQuote(null);
      return;
    }

    let isMounted = true;
    async function getQuote() {
      setIsLoadingShipping(true);
      try {
        const guestKey =
          typeof window !== "undefined"
            ? localStorage.getItem("guest_cart_session_key") || undefined
            : undefined;
        const res = await fetchShippingQuote({
          address_id: selectedAddress!.id,
          session_key: guestKey,
        });
        if (isMounted) {
          setShippingQuote(res);
          // Preserve selected method if valid in options, otherwise use default
          if (res.options.some((o) => o.method === selectedShippingMethod)) {
            // keep current selection
          } else {
            setSelectedShippingMethod(res.default_method || "pishtaz");
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch shipping quote:", err);
        toast.error(
          getApiErrorMessage(err, "خطا در استعلام هزینه ارسال پستی برای این آدرس")
        );
      } finally {
        if (isMounted) {
          setIsLoadingShipping(false);
        }
      }
    }

    getQuote();
    return () => {
      isMounted = false;
    };
  }, [selectedAddress, items]);

  const cartTotal = getTotal();
  const totalWeight = getTotalWeight();
  const discountAmount = getDiscountAmount();

  // Selected shipping method price
  const activeShippingOption = shippingQuote?.options.find(
    (o) => o.method === selectedShippingMethod
  );
  const shippingCost = activeShippingOption?.total ?? (shippingQuote?.selected?.total || 0);
  const finalPayable = Math.max(0, cartTotal - discountAmount) + shippingCost;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) {
      toast.error("کد تخفیف را وارد کنید");
      return;
    }
    setIsApplyingCoupon(true);
    try {
      await applyCoupon(couponCodeInput.trim());
      toast.success("کد تخفیف با موفقیت اعمال شد");
      setCouponCodeInput("");
    } catch (e: any) {
      toast.error(getApiErrorMessage(e, "کد تخفیف نامعتبر یا منقضی شده است"));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("برای ثبت سفارش، لطفاً ابتدا وارد حساب کاربری خود شوید.");
      router.push("/auth?redirect=/checkout");
      return;
    }

    if (!selectedAddress) {
      toast.error("لطفاً آدرس تحویل سفارش را انتخاب یا ثبت نمایید.");
      return;
    }

    if (!shippingQuote) {
      toast.error("در حال محاسبه هزینه ارسال مرسوله پستی، لطفاً شکیبا باشید.");
      return;
    }

    setIsLoadingOrder(true);
    try {
      const guestKey =
        typeof window !== "undefined"
          ? localStorage.getItem("guest_cart_session_key")
          : null;

      // 1. Create order with authoritative address_id and shipping_method
      const orderRes = await api.post(
        "/api/orders/checkout/",
        {
          address_id: selectedAddress.id,
          shipping_method: selectedShippingMethod || "pishtaz",
          session_key: guestKey,
        },
        {
          headers: guestKey ? { "X-Cart-Session-Key": guestKey } : {},
        }
      );

      const orderData = orderRes.data;
      const orderId = orderData.id || orderData.order_number;

      // 2. Initiate payment session
      const paymentRes = await api.post("/api/payments/initiate/", {
        order_id: orderData.id || orderId,
        gateway: paymentGateway,
      });

      const payData = paymentRes.data;

      // If gateway returns external redirect URL (e.g. Zarinpal / Mellat / Shaparak)
      if (payData?.payment_url || payData?.redirect_url) {
        toast.loading("در حال انتقال به درگاه پرداخت بانکی...");
        window.location.href = payData.payment_url || payData.redirect_url;
        return;
      }

      // If simulated / synchronous payment completed successfully
      if (payData?.status === "succeeded" || payData?.status === "paid") {
        await clearCart();
        const refNumber =
          payData.gateway_reference ||
          payData.authority ||
          `REF-${Math.floor(100000 + Math.random() * 900000)}`;
        toast.success("سفارش شما با موفقیت ثبت و پرداخت شد");
        router.push(
          `/checkout/success?order_id=${encodeURIComponent(
            orderData.order_number || orderId
          )}&ref=${encodeURIComponent(refNumber)}&amount=${finalPayable}`
        );
        return;
      }

      // If payment status returned failed or unconfirmed
      router.push(
        `/checkout/failed?order_id=${encodeURIComponent(
          orderData.order_number || orderId
        )}&error=${encodeURIComponent(payData?.error || "پرداخت ناموفق بود")}`
      );
    } catch (error: any) {
      console.error("Checkout failed:", error);
      const errCode = error?.response?.data?.code || error?.response?.data?.error?.code;

      if (
        errCode === "reservation_expired" ||
        errCode === "price_changed" ||
        errCode === "insufficient_stock"
      ) {
        await fetchCart();
      }

      toast.error(
        getApiErrorMessage(error, "ثبت سفارش ناموفق بود. لطفاً اطلاعات را بررسی کنید.")
      );
    } finally {
      setIsLoadingOrder(false);
    }
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <main
        className="min-h-screen pt-32 pb-24 px-6 flex flex-col items-center justify-center text-center"
        dir="rtl"
      >
        <div className="w-20 h-20 bg-sky-50 border border-sky-100 rounded-full flex items-center justify-center mb-6 text-[#0082CA]">
          <Truck className="w-8 h-8 text-[#0082CA]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#0B192C] mb-2">
          سبد خرید شما خالی است
        </h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-sm mb-8">
          برای تکمیل فرآیند تسویه حساب، ابتدا باید محصولاتی را به سبد خرید خود اضافه کنید.
        </p>
        <Button
          asChild
          className="h-12 px-8 rounded-2xl bg-[#0082CA] text-white font-bold hover:bg-[#006CA8] shadow-md shadow-[#0082CA]/25"
        >
          <Link href="/products">مشاهده کاتالوگ فروشگاه</Link>
        </Button>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-800"
      dir="rtl"
    >
      {/* Back Link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-xs md:text-sm text-slate-500 hover:text-[#0082CA] transition-colors mb-8"
      >
        <ArrowRight className="w-4 h-4" />
        ادامه خرید و بازگشت به کاتالوگ
      </Link>

      {/* Guest Warning Banner if not logged in */}
      {!isAuthenticated && (
        <div className="mb-8 p-5 bg-sky-50 border border-sky-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-2xl bg-[#0082CA] text-white flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">ورود به حساب کاربری</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                برای ثبت آدرس تحویل و تکمیل سفارش، ابتدا وارد حساب کاربری خود شوید.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="h-10 px-6 rounded-xl bg-[#0082CA] text-white hover:bg-[#006CA8] font-bold text-xs shrink-0 shadow-md shadow-[#0082CA]/20"
          >
            <Link href="/auth?redirect=/checkout">ورود یا ثبت‌نام</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Address Selection & Shipping & Payment */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 space-y-8"
        >
          {/* Shipping Address Selection Card */}
          <div className="bg-white border border-sky-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <AddressSelector
              addresses={addresses}
              selectedAddressId={selectedAddress?.id || null}
              onSelectAddress={(addr) => setSelectedAddress(addr)}
              onAddressCreated={(newAddr) => {
                setAddresses((prev) => [newAddr, ...prev]);
                setSelectedAddress(newAddr);
              }}
              onAddressDeleted={(deletedId) => {
                setAddresses((prev) => {
                  const filtered = prev.filter((a) => a.id !== deletedId);
                  if (selectedAddress?.id === deletedId) {
                    setSelectedAddress(filtered[0] || null);
                  }
                  return filtered;
                });
              }}
              isLoading={isLoadingAddresses}
            />
          </div>

          {/* Shipping Method & Rate Quote Card */}
          <ShippingMethodSelector
            shippingQuote={shippingQuote}
            selectedMethod={selectedShippingMethod}
            onSelectMethod={(method) => setSelectedShippingMethod(method)}
            isLoading={isLoadingShipping}
          />

          {/* Payment Method Selector */}
          <div className="bg-white border border-sky-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-sky-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#0082CA] text-white flex items-center justify-center shadow-md shadow-[#0082CA]/25 shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#0B192C]">
                  انتخاب درگاه پرداخت
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  کلیه تراکنش‌ها از طریق بستر رمزنگاری شده شاپرک انجام می‌پذیرد
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentGateway("dummy")}
                className={`p-5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                  paymentGateway === "dummy"
                    ? "bg-sky-50 border-[#0082CA] shadow-sm ring-1 ring-[#0082CA]/30"
                    : "bg-white border-sky-200 hover:border-sky-300"
                }`}
              >
                <div className="space-y-1">
                  <span className="text-sm font-bold text-[#0B192C] block">
                    درگاه شبیه‌ساز تستی (آنلاین)
                  </span>
                  <span className="text-xs text-slate-500">
                    تراکنش فوری و امن جهت تست تسویه
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-sky-300 flex items-center justify-center shrink-0">
                  {paymentGateway === "dummy" && (
                    <div className="w-2.5 h-2.5 bg-[#0082CA] rounded-full" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentGateway("zarinpal")}
                className={`p-5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                  paymentGateway === "zarinpal"
                    ? "bg-sky-50 border-[#0082CA] shadow-sm ring-1 ring-[#0082CA]/30"
                    : "bg-white border-sky-200 hover:border-sky-300"
                }`}
              >
                <div className="space-y-1">
                  <span className="text-sm font-bold text-[#0B192C] block">
                    درگاه پرداخت زرین‌پال / بانکی
                  </span>
                  <span className="text-xs text-slate-500">
                    پشتیبانی از تمامی کارت‌های عضو شتاب
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-sky-300 flex items-center justify-center shrink-0">
                  {paymentGateway === "zarinpal" && (
                    <div className="w-2.5 h-2.5 bg-[#0082CA] rounded-full" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Order Summary & Coupon */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4"
        >
          <div className="bg-white border border-sky-100 rounded-3xl p-6 sticky top-28 shadow-sm space-y-6">
            <h2 className="text-lg md:text-xl font-black text-[#0B192C] border-b border-sky-100 pb-4">
              خلاصه سفارش ({items.length.toLocaleString("fa-IR")} کالا)
            </h2>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  className="flex gap-3 items-center bg-sky-50/50 p-2.5 rounded-2xl border border-sky-100"
                >
                  <img
                    src={item.imageUrl || "/placeholder-product.svg"}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/placeholder-product.svg";
                    }}
                    className="w-14 h-16 object-cover rounded-xl shrink-0 border border-sky-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#0B192C] truncate">
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      سایز: {item.size || "Free"} | تعداد:{" "}
                      {item.quantity.toLocaleString("fa-IR")} | وزن:{" "}
                      {((item.weight || 500) * item.quantity).toLocaleString("fa-IR")} گرم
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {formatPrice(parsePrice(item.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-2">
              {coupon ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Tag className="w-4 h-4" />
                    <span>کد «{coupon.code}» اعمال شد</span>
                  </div>
                  <button
                    onClick={() => removeCoupon()}
                    className="text-xs text-rose-500 hover:text-rose-600 cursor-pointer p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <Input
                    placeholder="کد تخفیف دارید؟"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className="bg-sky-50/60 border-sky-200 h-10 text-xs rounded-xl text-slate-800 placeholder:text-slate-400"
                  />
                  <Button
                    type="submit"
                    disabled={isApplyingCoupon}
                    variant="outline"
                    className="h-10 px-4 text-xs font-bold border-sky-200 bg-sky-50 hover:bg-sky-100 text-[#0082CA] rounded-xl shrink-0 cursor-pointer"
                  >
                    {isApplyingCoupon ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "اعمال"
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-sky-100 pt-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>مجموع سبد خرید:</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>تخفیف کوپن:</span>
                  <span>- {formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-start text-slate-500">
                <div className="flex flex-col">
                  <span className="text-[#0B192C] font-medium">هزینه ارسال:</span>
                  <span className="text-[10px] text-slate-400">
                    {activeShippingOption?.name || "پست پیشتاز"} (
                    {totalWeight.toLocaleString("fa-IR")} گرم)
                  </span>
                </div>
                <span className="font-bold text-[#0B192C] text-sm">
                  {shippingCost > 0 ? formatPrice(shippingCost) : "محاسبه در مرحله آدرس"}
                </span>
              </div>

              <div className="flex justify-between text-base font-black text-[#0B192C] pt-3 border-t border-sky-100">
                <span>مبلغ نهایی پرداخت:</span>
                <span className="text-[#0082CA]">{formatPrice(finalPayable)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="button"
              onClick={handleCheckoutSubmit}
              disabled={isLoadingOrder || !selectedAddress || !shippingQuote}
              className="w-full h-14 rounded-2xl bg-[#0082CA] text-white hover:bg-[#006CA8] text-sm md:text-base font-black transition-all shadow-md shadow-[#0082CA]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoadingOrder ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ثبت سفارش و اتصال به درگاه...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-white" />
                  پرداخت و ثبت نهایی سفارش
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
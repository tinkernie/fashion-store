"use client";

import React, { useState } from "react";
import {
  Truck,
  Store,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  ShieldCheck,
  Clock,
  MapPin,
} from "lucide-react";
import { ShippingQuoteResponse, ShippingBreakdownOption } from "@/lib/address-shipping-api";
import { formatPrice } from "@/lib/price-utils";

interface ShippingMethodSelectorProps {
  shippingQuote: ShippingQuoteResponse | null;
  selectedMethod: string;
  onSelectMethod: (method: string) => void;
  isLoading?: boolean;
}

export function ShippingMethodSelector({
  shippingQuote,
  selectedMethod,
  onSelectMethod,
  isLoading = false,
}: ShippingMethodSelectorProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white border border-sky-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-sky-100 pb-4">
          <Truck className="w-6 h-6 text-[#0082CA]" />
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#0B192C]">روش و هزینه ارسال</h2>
            <p className="text-xs text-slate-500 mt-0.5">در حال استعلام تعرفه رسمی پست جمهوری اسلامی ایران...</p>
          </div>
        </div>
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-[#0082CA]" />
          <span>محاسبه هزینه ارسال بر اساس وزن اقلام سبد و مقصد سفارش...</span>
        </div>
      </div>
    );
  }

  // Filter out 'vizheh' if present, and ensure 'pickup' is available
  const rawOptions = shippingQuote?.options || [];
  const pishtazOption = rawOptions.find((o) => o.method === "pishtaz");
  const pickupOption = rawOptions.find((o) => o.method === "pickup") || {
    method: "pickup",
    name: "تحویل به صورت حضوری",
    name_en: "Store Pickup",
    eta_days: 0,
    zone: "store",
    base_fare: 0,
    surcharge: 0,
    surcharge_percent: 0,
    insurance: 0,
    total: 0,
    currency: "Toman",
  };

  const optionsToRender: ShippingBreakdownOption[] = [
    pishtazOption || {
      method: "pishtaz",
      name: "پیشتاز",
      name_en: "Pishtaz Express",
      eta_days: 3,
      zone: "intra",
      base_fare: 0,
      surcharge: 0,
      surcharge_percent: 0,
      insurance: 0,
      total: 0,
      currency: "Toman",
    },
    pickupOption,
  ];

  const selectedOption: ShippingBreakdownOption | undefined =
    optionsToRender.find((o) => o.method === selectedMethod) || optionsToRender[0];

  const getCleanMethodName = (opt?: { name?: string; method?: string }) => {
    if (!opt) return "";
    if (opt.method === "pickup") return "تحویل به صورت حضوری";
    return (opt.name || "").replace("بین‌شهری", "").replace("بین شهری", "").trim() || (opt.name || "");
  };

  return (
    <div className="bg-white border border-sky-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sky-100 pb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0082CA] text-white flex items-center justify-center shadow-md shadow-[#0082CA]/25 shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#0B192C]">روش و هزینه ارسال</h2>
            <p className="text-xs text-slate-500 mt-0.5">شیوه دریافت سفارش خود را انتخاب نمایید</p>
          </div>
        </div>
      </div>

      {/* Methods Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {optionsToRender.map((option) => {
          const isSelected = option.method === selectedMethod;
          const isPickup = option.method === "pickup";
          const displayName = getCleanMethodName(option);

          return (
            <div
              key={option.method}
              onClick={() => onSelectMethod(option.method)}
              className={`p-5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? "bg-sky-50/80 border-[#0082CA] shadow-md shadow-[#0082CA]/10 ring-2 ring-[#0082CA]/30"
                  : "bg-white border-sky-200 hover:border-sky-300 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isPickup ? (
                      <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Truck className="w-4 h-4 text-[#0082CA] shrink-0" />
                    )}
                    <span className="text-sm font-black text-[#0B192C]">
                      {displayName}
                    </span>
                    {isPickup ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        دریافت در فروشگاه
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-[#0082CA] font-bold">
                        ارسال پستی
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {isPickup
                      ? "تحویل حضوری در شعبه ماوی • بدون نیاز به آدرس پستی"
                      : `مدت زمان تقریبی تحویل: ${option.eta_days.toLocaleString("fa-IR")} روز کاری`}
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? "border-[#0082CA] bg-[#0082CA] text-white"
                      : "border-sky-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <div className="pt-3 border-t border-sky-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">هزینه نهایی ارسال:</span>
                <span className={`text-base font-black ${isPickup ? "text-emerald-600 font-bold" : "text-[#0082CA]"}`}>
                  {isPickup
                    ? "رایگان (۰ تومان)"
                    : option.total > 0
                    ? formatPrice(option.total)
                    : "محاسبه در مرحله آدرس"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Itemized Tariff Breakdown Accordion (Postal Pishtaz only) */}
      {selectedMethod === "pishtaz" && selectedOption && selectedOption.total > 0 && (
        <div className="border border-sky-100 rounded-2xl bg-sky-50/40 p-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-[#0082CA] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#0082CA]" />
              مشاهده ریز محاسبات تعرفه پستی ({getCleanMethodName(selectedOption)})
            </span>
            {showBreakdown ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showBreakdown && (
            <div className="pt-3 border-t border-sky-200/60 space-y-2 text-xs text-slate-600 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <span>کرایه پایه مرسوله (وزن و مسافت):</span>
                <span className="font-bold text-slate-800">
                  {formatPrice(selectedOption.base_fare)}
                </span>
              </div>

              {selectedOption.surcharge > 0 && (
                <div className="flex justify-between items-center">
                  <span>
                    اضافه بهای مقصد ({selectedOption.surcharge_percent.toLocaleString("fa-IR")}٪
                    سرفصل ۶):
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatPrice(selectedOption.surcharge)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  بیمه تعهد و غرامت کالا (سرفصل ۷):
                </span>
                <span className="font-bold text-slate-800">
                  {formatPrice(selectedOption.insurance)}
                </span>
              </div>

              <div className="pt-2 border-t border-sky-200 flex justify-between items-center text-slate-900 font-black">
                <span>جمع کل هزینه ارسال مرسوله:</span>
                <span className="text-sm text-[#0082CA]">
                  {formatPrice(selectedOption.total)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* In-Person Pickup Info Note */}
      {selectedMethod === "pickup" && (
        <div className="border border-emerald-100 rounded-2xl bg-emerald-50/50 p-4 flex items-start gap-3 text-xs text-slate-700">
          <Store className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block">شرایط تحویل حضوری در فروشگاه ماوی:</span>
            <p className="text-slate-600 leading-relaxed font-medium">
              نشانی فروشگاه: زنجان - قیدار - خیابان امام - روبروی تالار صدف - پوشاک ماوی
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>ساعات کاری: همه روزه از ساعت ۱۰:۰۰ الی ۲۱:۰۰ • نیازی به ثبت آدرس پستی وجود ندارد.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

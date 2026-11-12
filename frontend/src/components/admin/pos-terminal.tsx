"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Percent,
  FileText,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { adminApi, PosVariant, PosSaleResponse } from "@/lib/admin-api";
import { formatPriceNumber } from "@/lib/price-utils";
import { getApiErrorMessage } from "@/lib/error-utils";
import { normalizePersianDigits } from "@/lib/utils";

export interface PosBasketItem {
  variant: PosVariant;
  quantity: number;
}

interface PosTerminalProps {
  isModal?: boolean;
  onClose?: () => void;
}

// Simple Web Audio feedback
function playSound(type: "success" | "error" | "checkout") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.09);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "checkout") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch {
    // AudioContext blocked or not supported
  }
}

export function PosTerminal({ isModal = false, onClose }: PosTerminalProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cartItems, setCartItems] = useState<PosBasketItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  // Client idempotency reference
  const clientRef = useRef<string>(crypto.randomUUID?.() || `pos-${Date.now()}`);

  // Input Ref
  const inputRef = useRef<HTMLInputElement>(null);

  // Completed Sale Modal State
  const [completedSale, setCompletedSale] = useState<PosSaleResponse | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Post-sale invoice enrichment fields
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [isUpdatingInvoice, setIsUpdatingInvoice] = useState(false);

  // Reserved Stock Override Conflict Modal
  const [reservedConflictModal, setReservedConflictModal] = useState<{
    open: boolean;
    detail: string;
  }>({ open: false, detail: "" });

  // Auto-focus input on mount and whenever modal opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const keepFocus = useCallback(() => {
    if (!isSuccessModalOpen && !reservedConflictModal.open) {
      inputRef.current?.focus();
    }
  }, [isSuccessModalOpen, reservedConflictModal.open]);

  // Handle Barcode Scan
  const handleProcessBarcode = async (rawCode: string) => {
    const cleanCode = normalizePersianDigits(rawCode.trim());
    if (!cleanCode || cleanCode.length < 3) return;

    // Debounce rapid duplicate scan within 800ms
    const now = Date.now();
    if (lastScannedCode === cleanCode && now - lastScanTime < 800) {
      setBarcodeInput("");
      return;
    }
    setLastScannedCode(cleanCode);
    setLastScanTime(now);

    setIsScanning(true);
    try {
      const variant = await adminApi.scanPosBarcode(cleanCode);
      if (!variant) {
        playSound("error");
        toast.error("بارکد در سیستم یافت نشد");
        return;
      }

      if (!variant.is_sellable) {
        playSound("error");
        if (!variant.is_active) {
          toast.error("این تنوع کالا حذف شده یا غیرفعال است");
        } else if (variant.status !== "published") {
          toast.error("کالای مربوطه هنوز منتشر نشده است");
        } else if (variant.stock <= 0) {
          toast.error("موجودی فیزیکی این کالا صفر است");
        } else {
          toast.error("این کالا در حال حاضر قابل فروش نیست");
        }
        return;
      }

      // Add or increment in cart
      setCartItems((prev) => {
        const existingIndex = prev.findIndex((item) => item.variant.id === variant.id);
        if (existingIndex > -1) {
          const updated = [...prev];
          const cur = updated[existingIndex];
          const newQty = cur.quantity + 1;
          if (newQty > variant.stock) {
            toast.warning(`حداکثر موجودی فیزیکی (${variant.stock} عدد) اسکن شده است`);
            return prev;
          }
          updated[existingIndex] = { ...cur, quantity: newQty };
          return updated;
        }
        return [{ variant, quantity: 1 }, ...prev];
      });

      playSound("success");
      toast.success(`«${variant.product_title}» به فاکتور افزوده شد`);
    } catch (err: any) {
      playSound("error");
      const status = err?.response?.status;
      if (status === 404) {
        toast.error(`بارکد «${cleanCode}» در سیستم یافت نشد`);
      } else {
        toast.error(getApiErrorMessage(err, "خطا در اسکن بارکد"));
      }
    } finally {
      setIsScanning(false);
      setBarcodeInput("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleProcessBarcode(barcodeInput);
    }
  };

  // Keyboard shortcut listener for space/F2
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input inside a modal or details form is focused
      if (isSuccessModalOpen || reservedConflictModal.open) return;

      if (e.key === "F2" || (e.code === "Space" && document.activeElement === inputRef.current && !barcodeInput.trim())) {
        if (cartItems.length > 0 && !isCheckingOut) {
          e.preventDefault();
          handleCheckout(false);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [cartItems, isCheckingOut, isSuccessModalOpen, reservedConflictModal.open, barcodeInput]);

  // Adjust line item quantity
  const handleUpdateQuantity = (variantId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.variant.id === variantId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.variant.stock) {
              toast.warning(`حداکثر موجودی فیزیکی ${item.variant.stock} عدد است`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as PosBasketItem[]
    );
  };

  const handleRemoveLine = (variantId: string) => {
    setCartItems((prev) => prev.filter((item) => item.variant.id !== variantId));
  };

  const handleClearBasket = () => {
    setCartItems([]);
    clientRef.current = crypto.randomUUID?.() || `pos-${Date.now()}`;
    setBarcodeInput("");
    inputRef.current?.focus();
  };

  // Total summary
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.variant.price || 0) * item.quantity,
    0
  );
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Perform Checkout
  const handleCheckout = async (allowReservedOverride = false) => {
    if (cartItems.length === 0) {
      toast.error("فاکتور خالی است. لطفاً ابتدا کالایی را اسکن کنید.");
      return;
    }

    setIsCheckingOut(true);
    try {
      const payload = {
        client_reference: clientRef.current,
        pos_terminal: "صندوق فروشگاه",
        allow_reserved_override: allowReservedOverride,
        items: cartItems.map((i) => ({
          variant_id: i.variant.id,
          quantity: i.quantity,
        })),
      };

      const result = await adminApi.checkoutPosSale(payload);
      playSound("checkout");

      setCompletedSale(result);
      setIsSuccessModalOpen(true);
      setDiscountType("percent");
      setDiscountValue("");
      setSaleNotes("");

      // Clear basket for next sale
      setCartItems([]);
      clientRef.current = crypto.randomUUID?.() || `pos-${Date.now()}`;

      toast.success(
        result.replayed
          ? `فاکتور قبلاً ثبت شده بود: ${result.order_number}`
          : `فروش با موفقیت ثبت شد: ${result.order_number}`
      );
    } catch (err: any) {
      playSound("error");
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 409) {
        if (data?.code === "reserved_stock") {
          setReservedConflictModal({
            open: true,
            detail:
              data.detail ||
              "برخی از این اقلام برای سفارشات آنلاین رزرو شده‌اند. آیا می‌خواهید با تخصیص موجودی رزرو، فروش را تایید کنید؟",
          });
          return;
        }
        toast.error(data?.detail || "تداخل موجودی: موجودی کالا برای ثبت فروش کافی نیست.");
      } else {
        toast.error(getApiErrorMessage(err, "خطا در ثبت فروش و کسر از انبار"));
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Download Invoice PDF
  const handleDownloadInvoice = async (orderRef: string) => {
    setIsDownloadingPdf(true);
    try {
      const { blob, filename } = await adminApi.downloadInvoicePdf(orderRef);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success("فاکتور چاپی A5 آماده شد");
    } catch (err: any) {
      if (err?.response?.status === 503) {
        toast.error("سیستم رندر PDF روی سرور در دسترس نیست؛ از فاکتور دیجیتال استفاده نمایید.");
      } else {
        toast.error(getApiErrorMessage(err, "خطا در دانلود فاکتور"));
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Optional Post-sale Invoice Details Patch
  const handleSaveInvoiceDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedSale) return;

    const payload: any = {};
    if (saleNotes.trim()) payload.notes = saleNotes.trim();

    if (discountValue.trim()) {
      payload.discount_type = discountType;
      payload.discount_value = normalizePersianDigits(discountValue.trim());
    }

    setIsUpdatingInvoice(true);
    try {
      const updated = await adminApi.updatePosSale(completedSale.id, payload);
      setCompletedSale(updated);
      toast.success("مشخصات تکمیلی فاکتور بروزرسانی شد");
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "خطا در ثبت اطلاعات فاکتور"));
    } finally {
      setIsUpdatingInvoice(false);
    }
  };

  const handleNextSale = () => {
    setIsSuccessModalOpen(false);
    setCompletedSale(null);
    setBarcodeInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div
      className={`flex flex-col h-full select-none ${isModal ? "p-4" : "p-4 md:p-6"}`}
      dir="rtl"
      onClick={keepFocus}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Barcode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
              صندوق فروش حضوری و بارکدخوان
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                سیستم انبار آنلاین
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              لباس را مقابل بارکدخوان بگیرید تا مستقیماً به فاکتور افزوده شود.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cartItems.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearBasket}
              className="h-9 px-3 rounded-xl border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>فاکتور جدید</span>
            </Button>
          )}

          {isModal && onClose && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 px-3 rounded-xl text-gray-400 hover:text-white text-xs font-bold"
            >
              بستن
            </Button>
          )}
        </div>
      </div>

      {/* Barcode Scanner Input Bar */}
      <div className="relative mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProcessBarcode(barcodeInput);
          }}
          className="relative flex items-center"
        >
          <div className="relative flex-1 flex items-center bg-[#141414] border-2 border-cyan-500/50 focus-within:border-cyan-400 rounded-2xl px-4 py-2 transition-all shadow-lg shadow-cyan-500/5">
            <Barcode className="w-6 h-6 text-cyan-400 shrink-0 ml-3 animate-pulse" />
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isScanning || isCheckingOut}
              placeholder="آماده اسکن بارکد (با دستگاه بارکدخوان یا تایپ دستی)..."
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm md:text-base placeholder:text-gray-500 placeholder:font-sans placeholder:text-xs"
              autoFocus
              dir="ltr"
            />
            {barcodeInput && (
              <button
                type="button"
                onClick={() => setBarcodeInput("")}
                className="text-gray-400 hover:text-white px-2 text-sm"
              >
                ✕
              </button>
            )}
          </div>

          <Button
            type="submit"
            disabled={isScanning || !barcodeInput.trim()}
            className="mr-3 h-12 px-5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs md:text-sm flex items-center gap-2 shrink-0 shadow-md shadow-cyan-500/20"
          >
            {isScanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>جستجو / ثبت</span>
          </Button>
        </form>
      </div>

      {/* Main Cart Items Workspace */}
      <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[50vh] bg-[#111111] border border-white/10 rounded-2xl p-3 md:p-4 mb-4">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mb-3">
              <Barcode className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-sm font-bold text-gray-300 mb-1">
              هنوز کالایی به فاکتور اضافه نشده است
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              دستگاه بارکدخوان را روی اتیکت لباس بگیرید. اقلام به صورت خودکار با تعداد و قیمت واحد در این جدول درج می‌شوند.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cartItems.map((item) => {
              const optionsSummary =
                item.variant.options && item.variant.options.length > 0
                  ? item.variant.options
                      .map((o) => `${o.option_name}: ${o.value}`)
                      .join(" • ")
                  : "سایز استاندارد";

              const lineTotal = item.variant.price * item.quantity;

              return (
                <div
                  key={item.variant.id}
                  className="bg-[#161616] hover:bg-[#1a1a1a] border border-white/5 hover:border-white/10 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                >
                  {/* Title & Options */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs md:text-sm truncate">
                        {item.variant.product_title}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md" dir="ltr">
                        {item.variant.barcode || item.variant.sku}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                      <span className="text-gray-300 font-medium">{optionsSummary}</span>
                      <span>•</span>
                      <span>
                        موجودی قفسه:{" "}
                        <strong className="text-white font-mono">{item.variant.stock}</strong> عدد
                      </span>
                      {item.variant.reserved > 0 && (
                        <span className="text-amber-400/90 text-[11px]">
                          ({item.variant.reserved} عدد رزرو آنلاین)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Stepper Controls */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    {/* Unit Price */}
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-bold text-emerald-400">
                        {formatPriceNumber(lineTotal)} تومان
                      </div>
                      <div className="text-[10px] text-gray-500">
                        واحد: {formatPriceNumber(item.variant.price)} تومان
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1.5 bg-[#202020] border border-white/10 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.variant.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="کاهش تعداد"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-8 text-center text-xs font-black text-white font-mono">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.variant.id, 1)}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="افزایش تعداد"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete Line */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(item.variant.id)}
                      className="text-gray-500 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                      title="حذف از فاکتور"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / Checkout Controls */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center justify-between md:justify-start gap-6">
          <div>
            <div className="text-xs text-gray-400">تعداد کل اقلام:</div>
            <div className="text-sm font-black text-white font-mono mt-0.5">
              {totalItemsCount} عدد لباس
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div>
            <div className="text-xs text-gray-400">مبلغ نهایی فاکتور:</div>
            <div className="text-lg md:text-xl font-black text-emerald-400 font-mono mt-0.5">
              {formatPriceNumber(totalAmount)}{" "}
              <span className="text-xs font-sans text-gray-400">تومان</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            disabled={cartItems.length === 0 || isCheckingOut}
            onClick={() => handleCheckout(false)}
            className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isCheckingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>ثبت فروش و کسر از انبار</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-black/30 rounded border border-white/20 mr-1 text-emerald-200">
              Space / F2
            </kbd>
          </Button>
        </div>
      </div>

      {/* Post-Sale Completed Receipt Dialog */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-lg bg-[#141414] border-white/15 text-white rounded-3xl p-6" dir="rtl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-lg font-black text-white">
              فروش حضوری با موفقیت ثبت شد
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-gray-400">
              موجودی فیزیکی اقلام فوراً از دیتابیس کسر شد و فاکتور فروش صادر گردید.
            </DialogDescription>
          </DialogHeader>

          {completedSale && (
            <div className="space-y-4 my-2">
              {/* Summary Card */}
              <div className="bg-[#1b1b1b] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400">شماره فاکتور:</div>
                  <div className="text-sm font-black text-cyan-400 font-mono mt-0.5" dir="ltr">
                    {completedSale.order_number}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-400">مبلغ دریافتی:</div>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    {formatPriceNumber(completedSale.total)} تومان
                  </div>
                </div>
              </div>

              {/* PDF Invoice Button */}
              <Button
                type="button"
                onClick={() => handleDownloadInvoice(completedSale.order_number || completedSale.id)}
                disabled={isDownloadingPdf}
                className="w-full h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                <span>چاپ فاکتور رسمی A5 (PDF)</span>
              </Button>

              {/* Optional Post-Sale Enrichment Form */}
              <form onSubmit={handleSaveInvoiceDetails} className="space-y-3 pt-3 border-t border-white/10">
                <div className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>اطلاعات تکمیلی فاکتور (اختیاری):</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400">تخفیف اعمال شده:</label>
                  <div className="flex gap-1.5">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="bg-[#181818] border border-white/10 rounded-xl px-2.5 text-xs text-white h-9 outline-none cursor-pointer"
                    >
                      <option value="percent">درصد %</option>
                      <option value="flat">مبلغ (تومان)</option>
                    </select>
                    <Input
                      type="text"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percent" ? "مثلاً 10" : "مثلاً 50000"}
                      className="bg-[#181818] border-white/10 h-9 text-xs text-white rounded-xl font-mono flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400">یادداشت فاکتور:</label>
                  <Input
                    type="text"
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    placeholder="مثلاً: امکان تعویض سایز تا ۴۸ ساعت..."
                    className="bg-[#181818] border-white/10 h-9 text-xs text-white rounded-xl"
                  />
                </div>

                {(discountValue.trim() || saleNotes.trim()) && (
                  <Button
                    type="submit"
                    disabled={isUpdatingInvoice}
                    variant="outline"
                    className="w-full h-9 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-xs cursor-pointer"
                  >
                    {isUpdatingInvoice ? "در حال ثبت..." : "بروزرسانی مشخصات فاکتور"}
                  </Button>
                )}
              </form>

              {/* Reset / Next Sale Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleNextSale}
                  className="w-full h-11 rounded-xl bg-white text-black hover:bg-gray-200 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <span>ثبت فاکتور بعدی (مشتری جدید)</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Online Reserved Override Conflict Modal */}
      <Dialog
        open={reservedConflictModal.open}
        onOpenChange={(open) => setReservedConflictModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md bg-[#161616] border-amber-500/30 text-white rounded-3xl p-6" dir="rtl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-base font-black text-white">
              هشدار: کالای رزرو شده برای سفارش آنلاین
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-gray-300 mt-2 leading-relaxed">
              {reservedConflictModal.detail}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2.5 pt-4">
            <Button
              type="button"
              onClick={() => {
                setReservedConflictModal({ open: false, detail: "" });
                handleCheckout(true);
              }}
              className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs"
            >
              فروش با تخصیص (Override)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReservedConflictModal({ open: false, detail: "" })}
              className="h-11 rounded-xl border-white/10 text-gray-400 hover:text-white text-xs"
            >
              انصراف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


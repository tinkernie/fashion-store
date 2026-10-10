"use client";

import React, { useState, useEffect, Fragment } from "react";
import {
  Layers,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Boxes,
  ShieldCheck,
  PackagePlus,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
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

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Safety Stock Modal
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [safetyItem, setSafetyItem] = useState<any | null>(null);
  const [safetyStockVal, setSafetyStockVal] = useState("5");
  const [isSavingSafety, setIsSavingSafety] = useState(false);

  // Custom Stock Modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customStockItem, setCustomStockItem] = useState<any | null>(null);
  const [customStockMode, setCustomStockMode] = useState<"add" | "subtract" | "set">("add");
  const [customAmountVal, setCustomAmountVal] = useState("50");
  const [isSubmittingCustomStock, setIsSubmittingCustomStock] = useState(false);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getProducts();
      setProducts(data);
    } catch (e) {
      console.error("Error loading products inventory:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const getItemStock = (item: any): number => {
    if (!item) return 0;
    return item.stock_quantity ?? item.inventory_count ?? item.inventory?.quantity ?? item.stock ?? 0;
  };

  const handleOpenSafetyStock = (item: any) => {
    setSafetyItem(item);
    setSafetyStockVal(String(item.safety_stock || item.inventory?.safety_stock || 5));
    setIsSafetyModalOpen(true);
  };

  const handleSaveSafetyStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyItem) return;
    setIsSavingSafety(true);
    try {
      await adminApi.setSafetyStock(safetyItem.id, Number(safetyStockVal));
      toast.success("حداقل موجودی هشدار (Safety Stock) تنظیم شد.");
      setIsSafetyModalOpen(false);
      await loadInventoryData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در تنظیم حداقل موجودی");
    } finally {
      setIsSavingSafety(false);
    }
  };

  const handleAdjustStock = async (variantOrProdId: string, delta: number) => {
    setAdjustingId(variantOrProdId);
    try {
      await adminApi.adjustStock(variantOrProdId, delta);
      toast.success(`موجودی انبار (${delta > 0 ? `+${delta}` : delta}) بروزرسانی شد.`);
      await loadInventoryData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "خطا در بروزرسانی موجودی انبار");
    } finally {
      setAdjustingId(null);
    }
  };

  const handleOpenCustomStock = (item: any) => {
    setCustomStockItem(item);
    setCustomStockMode("add");
    setCustomAmountVal("50");
    setIsCustomModalOpen(true);
  };

  const handleSaveCustomStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStockItem) return;
    const qty = parseInt(customAmountVal, 10);
    if (isNaN(qty) || qty < 0 || (customStockMode !== "set" && qty <= 0)) {
      toast.error("لطفاً یک عدد معتبر وارد کنید.");
      return;
    }
    setIsSubmittingCustomStock(true);
    try {
      if (customStockMode === "set") {
        await adminApi.setStockQuantity(customStockItem.id, qty);
        toast.success(`موجودی کالا دقیقا روی ${qty.toLocaleString("fa-IR")} عدد تنظیم شد.`);
      } else {
        const delta = customStockMode === "add" ? qty : -qty;
        await adminApi.adjustStock(customStockItem.id, delta);
        toast.success(`موجودی کالا با موفقیت (${delta > 0 ? `+${delta}` : delta} عدد) بروزرسانی شد.`);
      }
      setIsCustomModalOpen(false);
      await loadInventoryData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "خطا در بروزرسانی موجودی انبار"
      );
    } finally {
      setIsSubmittingCustomStock(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const name = (p.name || p.title || "").toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || (p.slug || "").includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-amber-400" />
            کنترل انبار و موجودی کالاها
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            مدیریت هوشمند موجودی انبار، تنظیمات تنوع‌ها و افزایش/کاهش سریع موجودی لباس‌ها
          </p>
        </div>

        <Button
          onClick={loadInventoryData}
          variant="outline"
          className="h-11 px-5 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-xs flex items-center gap-2 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          بروزرسانی وضعیت انبار
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-4 py-2">
        <Search className="w-4 h-4 text-gray-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجوی کالا بر اساس نام یا کد..."
          className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder:text-gray-600"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs table-fixed min-w-[880px]">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[15%]" />
              <col className="w-[14%]" />
              <col className="w-[17%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead className="bg-[#161616] text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-4 md:p-5 font-bold text-right">نام کالا / لباس</th>
                <th className="p-4 md:p-5 font-bold text-right">دسته‌بندی</th>
                <th className="p-4 md:p-5 font-bold text-right">موجودی کل انبار</th>
                <th className="p-4 md:p-5 font-bold text-right">وضعیت تامین</th>
                <th className="p-4 md:p-5 font-bold text-left">عملیات سریع موجودی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-500">
                    هیچ کالایی با فیلتر فوق یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const prodName = p.name || p.title || "محصول";
                  const stock = p.stock_quantity ?? p.inventory_count ?? 15;
                  const isLow = stock <= 5 && stock > 0;
                  const isOut = stock <= 0;
                  const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
                  const isExpanded = expandedRow === p.id;

                  return (
                    <Fragment key={p.id}>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="p-4 md:p-5 text-right">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.imageUrl || p.image_url || p.image || "/placeholder-product.svg"}
                              alt={prodName}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                              }}
                              className="w-12 h-14 object-cover rounded-xl border border-white/10 shrink-0 bg-[#181818]"
                            />
                            <div className="space-y-0.5 min-w-0">
                              <span className="font-bold text-white text-xs block truncate max-w-xs">{prodName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 font-mono" dir="ltr">
                                  ID: {p.id?.substring(0, 8)}
                                </span>
                                {hasVariants && (
                                  <button
                                    onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                                    className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5 font-bold"
                                  >
                                    <Boxes className="w-3 h-3" />
                                    {p.variants.length} تنوع
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 md:p-5 text-right text-gray-300 truncate">
                          {p.category?.name || p.category || "پوشاک"}
                        </td>

                        <td className="p-4 md:p-5 text-right">
                          <span className="text-sm font-black text-white">
                            {stock.toLocaleString("fa-IR")}{" "}
                            <span className="text-[10px] text-gray-400 font-normal">عدد</span>
                          </span>
                        </td>

                        <td className="p-4 md:p-5 text-right">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              ناموجود در انبار
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              موجودی اندک (هشدار)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              موجود و آماده ارسال
                            </span>
                          )}
                        </td>

                        <td className="p-4 md:p-5 text-left">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            <button
                              onClick={() => handleOpenCustomStock(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black text-[11px] font-bold border border-amber-500/20 hover:border-transparent transition-all flex items-center gap-1 shrink-0"
                              title="افزایش یا کاهش به تعداد دلخواه"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              <span>دلخواه</span>
                            </button>
                            <button
                              onClick={() => handleAdjustStock(p.id, 20)}
                              disabled={adjustingId === p.id}
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white hover:text-black text-[11px] font-bold transition-all shrink-0"
                              title="افزایش ۲۰ عدد"
                            >
                              +۲۰
                            </button>
                            <button
                              onClick={() => handleAdjustStock(p.id, 5)}
                              disabled={adjustingId === p.id}
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white hover:text-black text-[11px] font-bold transition-all shrink-0"
                              title="افزایش ۵ عدد"
                            >
                              +۵
                            </button>
                            <button
                              onClick={() => handleAdjustStock(p.id, -1)}
                              disabled={adjustingId === p.id || stock <= 0}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors shrink-0"
                              title="کاهش یک عدد"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenSafetyStock(p)}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-amber-400 hover:bg-white/10 transition-colors shrink-0"
                              title="تنظیم حد هشدار موجودی (Safety Stock)"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Nested Variant Rows */}
                      {hasVariants && isExpanded && (
                        <tr className="bg-[#141414]">
                          <td colSpan={5} className="p-4 md:p-6 space-y-3 border-t border-white/5">
                            <span className="text-xs font-bold text-gray-300 block">
                              تنوع‌ها و مشخصات انبار برای «{prodName}»:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {p.variants.map((v: any) => {
                                const vStock = getItemStock(v);
                                return (
                                  <div key={v.id} className="bg-[#1a1a1a] border border-white/5 p-3 rounded-2xl flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-white text-xs">{v.title || v.name || "تنوع"}</span>
                                      <span className="text-[10px] text-gray-500 block font-mono" dir="ltr">{v.sku}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-black text-amber-400 ml-1">{vStock.toLocaleString("fa-IR")} عدد</span>
                                      <button
                                        onClick={() => handleOpenSafetyStock(v)}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-amber-400 rounded-lg text-[10px]"
                                        title="حداقل موجودی هشدار"
                                      >
                                        <ShieldCheck className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleAdjustStock(v.id, -1)}
                                        disabled={adjustingId === v.id || vStock <= 0}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 rounded-lg text-[10px]"
                                        title="کاهش ۱ عدد"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleAdjustStock(v.id, 5)}
                                        disabled={adjustingId === v.id}
                                        className="px-2 py-1 bg-white/10 hover:bg-white hover:text-black rounded-lg text-[10px] font-bold transition-all"
                                        title="افزایش ۵ عدد"
                                      >
                                        +۵
                                      </button>
                                      <button
                                        onClick={() => handleOpenCustomStock(v)}
                                        className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-400 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5"
                                        title="تنظیم موجودی دلخواه"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>دلخواه</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Stock Config Modal */}
      <Dialog open={isSafetyModalOpen} onOpenChange={setIsSafetyModalOpen}>
        <DialogContent className="bg-[#0f0f0f] border border-white/10 text-white sm:max-w-md p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              تنظیم حداقل موجودی هشدار (Safety Stock)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSafetyStock} className="space-y-4 mt-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              کالا: <strong className="text-white">{safetyItem?.name || safetyItem?.title || safetyItem?.sku || "محصول انتخابی"}</strong>
              <br />
              هنگامی که موجودی انبار به کمتر از این مقدار برسد، اعلان هشدار کمبود موجودی در سیستم ثبت می‌گردد.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">حداقل موجودی هشدار (تعداد عدد)</label>
              <Input
                type="number"
                value={safetyStockVal}
                onChange={(e) => setSafetyStockVal(e.target.value)}
                required
                min={0}
                className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSavingSafety}
                className="flex-1 h-11 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs"
              >
                {isSavingSafety ? "در حال ثبت..." : "ذخیره حد هشدار"}
              </Button>
              <Button
                type="button"
                onClick={() => setIsSafetyModalOpen(false)}
                variant="ghost"
                className="h-11 rounded-xl text-gray-400 hover:text-white text-xs"
              >
                انصراف
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Stock Adjustment Modal */}
      <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
        <DialogContent className="bg-[#0f0f0f] border border-white/10 text-white sm:max-w-md p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-amber-400" />
              تغییر موجودی انبار به تعداد دلخواه
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCustomStock} className="space-y-4 mt-4">
            {/* Item info banner */}
            <div className="bg-[#161616] border border-white/5 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="min-w-0 pr-1">
                <span className="font-bold text-white text-xs block truncate max-w-[220px]">
                  {customStockItem?.name || customStockItem?.title || customStockItem?.sku || "محصول انتخابی"}
                </span>
                {customStockItem?.sku && (
                  <span className="text-[10px] text-gray-500 font-mono block mt-0.5" dir="ltr">
                    SKU: {customStockItem.sku}
                  </span>
                )}
              </div>
              <div className="text-left shrink-0">
                <span className="text-[10px] text-gray-400 block">موجودی فعلی</span>
                <span className="text-sm font-black text-amber-400">
                  {getItemStock(customStockItem).toLocaleString("fa-IR")} عدد
                </span>
              </div>
            </div>

            {/* Mode selection (Increase / Decrease / Set Exact) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">نوع عملیات:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCustomStockMode("add")}
                  className={`py-2.5 px-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    customStockMode === "add"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                      : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  افزایش (+)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomStockMode("subtract")}
                  className={`py-2.5 px-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    customStockMode === "subtract"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/10"
                      : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  کاهش (-)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomStockMode("set")}
                  className={`py-2.5 px-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    customStockMode === "set"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                      : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                  }`}
                >
                  <Equal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  مقدار قطعی (=)
                </button>
              </div>
            </div>

            {/* Preset Amount Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-gray-400">
                {customStockMode === "set" ? "مقادیر قطعی آماده:" : "مقادیر پیشنهادی سریع:"}
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(customStockMode === "set" ? [0, 5, 10, 25, 50, 100] : [10, 25, 50, 100, 250, 500]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomAmountVal(String(preset))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                      customAmountVal === String(preset)
                        ? "bg-amber-400 text-black border-amber-400"
                        : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {customStockMode === "set" ? `${preset}` : customStockMode === "add" ? `+${preset}` : `-${preset}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">
                {customStockMode === "set"
                  ? "موجودی دقیق و جدید کالا:"
                  : `تعداد عدد جهت ${customStockMode === "add" ? "افزایش" : "کاهش"}:`}
              </label>
              <Input
                type="number"
                value={customAmountVal}
                onChange={(e) => setCustomAmountVal(e.target.value)}
                required
                min={customStockMode === "set" ? 0 : 1}
                placeholder={customStockMode === "set" ? "مثلاً ۲۰" : "مثلاً ۵۰"}
                className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl"
              />
            </div>

            {/* Result Calculation Preview */}
            <div className="bg-[#161616] border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-gray-400">موجودی انبار پس از تغییر:</span>
              <span className="font-bold">
                {(() => {
                  const cur = getItemStock(customStockItem);
                  const val = parseInt(customAmountVal, 10) || 0;
                  const res = customStockMode === "set" ? Math.max(0, val) : customStockMode === "add" ? cur + val : Math.max(0, cur - val);
                  return (
                    <span
                      className={
                        customStockMode === "set"
                          ? "text-cyan-400 font-black"
                          : customStockMode === "add"
                          ? "text-emerald-400 font-black"
                          : "text-amber-400 font-black"
                      }
                    >
                      {res.toLocaleString("fa-IR")} عدد
                    </span>
                  );
                })()}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={
                  isSubmittingCustomStock ||
                  !customAmountVal ||
                  (customStockMode === "set" ? parseInt(customAmountVal, 10) < 0 : parseInt(customAmountVal, 10) <= 0)
                }
                className="flex-1 h-11 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs"
              >
                {isSubmittingCustomStock
                  ? "در حال ثبت..."
                  : customStockMode === "set"
                  ? "ثبت موجودی قطعی"
                  : "ثبت تغییر موجودی"}
              </Button>
              <Button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                variant="ghost"
                className="h-11 rounded-xl text-gray-400 hover:text-white text-xs"
              >
                انصراف
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

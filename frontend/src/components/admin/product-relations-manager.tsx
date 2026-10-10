"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  Loader2,
  Check,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/admin-api";
import { formatPrice } from "@/lib/price-utils";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-utils";

interface ProductRelationsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  product: any | null;
  allProducts: any[];
  onSaved?: () => void;
}

interface RelationItem {
  id: string;
  title: string;
  price?: number | string;
  image_url?: string;
  imageUrl?: string;
  category?: string;
  category_name?: string;
  position?: number;
  is_manual_pin?: boolean;
}

export default function ProductRelationsManager({
  isOpen,
  onClose,
  product,
  allProducts,
  onSaved,
}: ProductRelationsManagerProps) {
  const [activeTab, setActiveTab] = useState<"complete_look" | "suggested">("complete_look");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Complete the Look State (Max 6)
  const [lookItems, setLookItems] = useState<RelationItem[]>([]);
  // Suggested Related State (Max 8)
  const [relatedItems, setRelatedItems] = useState<RelationItem[]>([]);

  // Search filter for available products
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && product?.id) {
      loadRelations();
    } else {
      setLookItems([]);
      setRelatedItems([]);
      setSearchQuery("");
    }
  }, [isOpen, product?.id]);

  const loadRelations = async () => {
    if (!product?.id) return;
    setIsLoading(true);
    try {
      const [lookRes, relRes] = await Promise.allSettled([
        adminApi.getCompleteLook(product.id),
        adminApi.getRelatedProducts(product.id),
      ]);

      if (lookRes.status === "fulfilled") {
        setLookItems(lookRes.value || []);
      }
      if (relRes.status === "fulfilled") {
        // Only keep items that are not the current product
        const filtered = (relRes.value || []).filter(
          (item: any) => String(item.id) !== String(product.id)
        );
        setRelatedItems(filtered);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در دریافت لیست محصولات مرتبط."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLookItem = (candidate: any) => {
    if (lookItems.length >= 6) {
      toast.error("حداکثر ۶ آیتم برای ست لباس (تکمیل استایل) مجاز است.");
      return;
    }
    if (lookItems.some((it) => String(it.id) === String(candidate.id))) {
      toast.warning("این محصول قبلاً به ست اضافه شده است.");
      return;
    }
    setLookItems((prev) => [
      ...prev,
      {
        id: candidate.id,
        title: candidate.title || candidate.name,
        price: candidate.price,
        image_url: candidate.image_url || candidate.imageUrl || (candidate.images && candidate.images[0]),
        category: candidate.category || candidate.category_name,
        position: prev.length,
        is_manual_pin: true,
      },
    ]);
  };

  const handleRemoveLookItem = async (candidateId: string) => {
    setLookItems((prev) => prev.filter((it) => String(it.id) !== String(candidateId)));
    if (product?.id) {
      try {
        await adminApi.deleteCompleteLookItem(product.id, candidateId);
        toast.success("آیتم از ست لباس حذف شد.");
        if (onSaved) onSaved();
      } catch (err) {
        toast.error(getApiErrorMessage(err, "خطا در حذف آیتم از ست"));
      }
    }
  };

  const handleMoveLook = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= lookItems.length) return;
    const updated = [...lookItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setLookItems(updated);
  };

  const handleSaveLook = async () => {
    if (!product?.id) return;
    setIsSaving(true);
    try {
      const targetIds = lookItems.slice(0, 6).map((item) => String(item.id));
      if (targetIds.length === 0) {
        toast.success("ست لباس (تکمیل استایل) با موفقیت خالی و ذخیره شد.");
        if (onSaved) onSaved();
        return;
      }
      const positions = targetIds.map((_, i) => i);
      await adminApi.updateCompleteLook(product.id, targetIds, positions);
      toast.success("ست لباس (تکمیل استایل) با موفقیت ذخیره و کش بروزرسانی شد.");
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در ذخیره ست لباس."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRelatedItem = (candidate: any) => {
    if (relatedItems.length >= 8) {
      toast.error("حداکثر ۸ آیتم برای پیشنهادات مرتبط مجاز است.");
      return;
    }
    if (relatedItems.some((it) => String(it.id) === String(candidate.id))) {
      toast.warning("این محصول قبلاً در پیشنهادات وجود دارد.");
      return;
    }
    setRelatedItems((prev) => [
      ...prev,
      {
        id: candidate.id,
        title: candidate.title || candidate.name,
        price: candidate.price,
        image_url: candidate.image_url || candidate.imageUrl || (candidate.images && candidate.images[0]),
        category: candidate.category || candidate.category_name,
        position: prev.length,
        is_manual_pin: true,
      },
    ]);
  };

  const handleRemoveRelatedItem = async (candidateId: string) => {
    setRelatedItems((prev) => prev.filter((it) => String(it.id) !== String(candidateId)));
    if (product?.id) {
      try {
        await adminApi.deleteRelatedItem(product.id, candidateId);
        toast.success("آیتم از پیشنهادات مرتبط حذف شد.");
        if (onSaved) onSaved();
      } catch (err) {
        toast.error(getApiErrorMessage(err, "خطا در حذف آیتم از پیشنهادات"));
      }
    }
  };

  const handleMoveRelated = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= relatedItems.length) return;
    const updated = [...relatedItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setRelatedItems(updated);
  };

  const handleSaveRelated = async () => {
    if (!product?.id) return;
    setIsSaving(true);
    try {
      const targetIds = relatedItems.slice(0, 8).map((item) => String(item.id));
      if (targetIds.length === 0) {
        toast.success("پیشنهادات مرتبط با موفقیت خالی و ذخیره شد.");
        if (onSaved) onSaved();
        return;
      }
      const positions = targetIds.map((_, i) => i);
      await adminApi.updateRelatedProducts(product.id, targetIds, positions);
      toast.success("محصولات مرتبط با موفقیت ذخیره و کش بروزرسانی شد.");
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در ذخیره محصولات مرتبط."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoFillRelated = async () => {
    if (!product?.id) return;
    setIsAutoFilling(true);
    try {
      const res = await adminApi.autoFillRelatedProducts(product.id, 8);
      toast.success(res.message || "پیشنهادات مرتبط هوشمند با موفقیت اضافه شدند.");
      await loadRelations();
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در تکمیل خودکار پیشنهادات مرتبط."));
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Candidates list excluding current product and items already in current tab
  const activeIds = new Set(
    (activeTab === "complete_look" ? lookItems : relatedItems).map((it) => String(it.id))
  );
  if (product?.id) activeIds.add(String(product.id));

  const filteredCandidates = allProducts.filter((p) => {
    if (activeIds.has(String(p.id))) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const titleMatch = (p.title || p.name || "").toLowerCase().includes(q);
    const catMatch = (p.category || p.category_name || "").toLowerCase().includes(q);
    const slugMatch = (p.slug || "").toLowerCase().includes(q);
    return titleMatch || catMatch || slugMatch;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[95vw] sm:max-w-4xl md:max-w-5xl max-h-[90vh] flex flex-col bg-[#0f0f0f] border border-white/10 text-white p-0 overflow-hidden rounded-2xl shadow-2xl"
        dir="rtl"
      >
        {/* Modal Header */}
        <DialogHeader className="p-6 border-b border-white/10 bg-white/[0.02]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-xl font-black text-white">
                  مدیریت ست لباس و محصولات مرتبط
                </DialogTitle>
                <p className="text-xs text-zinc-400 mt-1 truncate">
                  محصول مبدا: <span className="text-white font-medium">{product?.title || product?.name}</span>
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("complete_look")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "complete_look"
                    ? "bg-amber-400 text-black shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                تکمیل استایل (ست)
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-current">
                  {lookItems.length}/۶
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("suggested")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "suggested"
                    ? "bg-amber-400 text-black shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                محصولات مرتبط
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-current">
                  {relatedItems.length}/۸
                </span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-xs text-zinc-400">در حال بارگذاری اطلاعات ست‌ها و پیشنهادات...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Tab Descriptions & Guidelines */}
            {activeTab === "complete_look" ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-300/90 leading-relaxed">
                  <p className="font-bold text-emerald-200">بخش تکمیل استایل (Complete the Look):</p>
                  این آیتم‌ها به عنوان یک ست هماهنگ (مانند کفش، کیف، شلوار یا اکسسوری مکمل) روی صفحه محصول نمایش داده می‌شوند.
                  حداکثر سقف مجاز <strong className="text-white">۶ قلم کالا</strong> است.
                </div>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <Layers className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-300/90 leading-relaxed">
                  <p className="font-bold text-blue-200">بخش پیشنهادات مرتبط (Suggested Products):</p>
                  آیتم‌های ذخیره‌شده در اسلایدر محصولات مشابه نمایش داده می‌شوند (حداکثر سقف <strong className="text-white">۸ قلم کالا</strong>). می‌توانید آیتم‌ها را دستی انتخاب نمایید یا با دکمه «تکمیل هوشمند پیشنهادها»، فضاهای خالی را با تحلیل هوشمند سیستم تکمیل کنید.
                </div>
              </div>
            )}

            {/* Current Pinned Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>آیتم‌های انتخاب‌شده</span>
                  <span className="text-xs text-zinc-400 font-normal">
                    (مرتب‌سازی از راست به چپ)
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  {activeTab === "suggested" && relatedItems.length < 8 && (
                    <button
                      type="button"
                      onClick={handleAutoFillRelated}
                      disabled={isAutoFilling || isLoading}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                      title="پر کردن فضاهای خالی اسلایدر با تحلیل هوشمند سیستم"
                    >
                      {isAutoFilling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                      )}
                      <span>تکمیل هوشمند پیشنهادها</span>
                    </button>
                  )}
                  <span className="text-xs text-zinc-400">
                    {activeTab === "complete_look" ? `${lookItems.length} از ۶` : `${relatedItems.length} از ۸`}
                  </span>
                </div>
              </div>

              {(activeTab === "complete_look" ? lookItems : relatedItems).length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-xs text-zinc-500">
                  هنوز هیچ کالایی به این بخش اضافه نشده است. از لیست زیر آیتم‌های مکمل را انتخاب کنید.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(activeTab === "complete_look" ? lookItems : relatedItems).map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 relative group hover:border-amber-400/40 transition-all"
                    >
                      {/* Position Badge */}
                      <span className="w-6 h-6 rounded-lg bg-white/10 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {/* Image Thumbnail */}
                      <div className="w-12 h-14 rounded-lg bg-black/40 overflow-hidden relative shrink-0 border border-white/10">
                        {item.image_url || item.imageUrl ? (
                          <img
                            src={item.image_url || item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">
                            بدون تصویر
                          </div>
                        )}
                      </div>

                      {/* Title & Price */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.title}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {item.price ? formatPrice(item.price) : "—"}
                        </p>
                        {item.category && (
                          <span className="text-[10px] text-amber-400/80 font-medium">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {/* Actions: Reorder & Remove */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              activeTab === "complete_look"
                                ? handleMoveLook(idx, "up")
                                : handleMoveRelated(idx, "up")
                            }
                            disabled={idx === 0}
                            title="انتقال به ابتدا"
                            className="p-1 rounded bg-white/5 hover:bg-white/20 disabled:opacity-20 text-zinc-300"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              activeTab === "complete_look"
                                ? handleMoveLook(idx, "down")
                                : handleMoveRelated(idx, "down")
                            }
                            disabled={
                              idx ===
                              (activeTab === "complete_look" ? lookItems : relatedItems).length - 1
                            }
                            title="انتقال به انتها"
                            className="p-1 rounded bg-white/5 hover:bg-white/20 disabled:opacity-20 text-zinc-300"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            activeTab === "complete_look"
                              ? handleRemoveLookItem(item.id)
                              : handleRemoveRelatedItem(item.id)
                          }
                          title="حذف از ست"
                          className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-center"
                        >
                          <Trash2 className="w-3 h-3 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Candidate Product Picker */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white">افزودن محصول جدید به این بخش</h3>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در محصولات..."
                    className="h-9 pr-9 pl-3 text-xs bg-white/5 border-white/10 text-white rounded-xl focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="max-h-64 sm:max-h-72 overflow-y-auto border border-white/10 rounded-xl divide-y divide-white/5 bg-black/20">
                {filteredCandidates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    محصولی برای افزودن یافت نشد یا همه محصولات انتخاب شده‌اند.
                  </div>
                ) : (
                  filteredCandidates.slice(0, 30).map((cand) => (
                    <div
                      key={cand.id}
                      className="p-2.5 flex items-center justify-between hover:bg-white/5 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden relative shrink-0 border border-white/10">
                          {cand.image_url || cand.imageUrl || (cand.images && cand.images[0]) ? (
                            <img
                              src={cand.image_url || cand.imageUrl || cand.images[0]}
                              alt={cand.title || cand.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-600">
                              بدون عکس
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{cand.title || cand.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                            <span>{cand.price ? formatPrice(cand.price) : "—"}</span>
                            {cand.category && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400/80">{cand.category}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() =>
                          activeTab === "complete_look"
                            ? handleAddLookItem(cand)
                            : handleAddRelatedItem(cand)
                        }
                        disabled={
                          activeTab === "complete_look"
                            ? lookItems.length >= 6
                            : relatedItems.length >= 8
                        }
                        className="h-8 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm cursor-pointer disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        افزودن
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            className="text-xs text-zinc-400 hover:text-white"
          >
            بستن
          </Button>

          <Button
            type="button"
            onClick={activeTab === "complete_look" ? handleSaveLook : handleSaveRelated}
            disabled={isSaving || isLoading}
            className="bg-amber-400 hover:bg-amber-500 text-black font-black text-xs px-6 rounded-xl shadow-lg shadow-amber-400/10 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {activeTab === "complete_look" ? "ذخیره ست لباس (تکمیل استایل)" : "ذخیره پیشنهادات مرتبط"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

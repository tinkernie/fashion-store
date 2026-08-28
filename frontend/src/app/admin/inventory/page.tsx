"use client";

import { useState, useEffect } from "react";
import {
  Layers,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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
          <table className="w-full text-right text-xs">
            <thead className="bg-[#161616] text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-4 md:p-5 font-bold">نام کالا / لباس</th>
                <th className="p-4 md:p-5 font-bold">دسته‌بندی</th>
                <th className="p-4 md:p-5 font-bold">موجودی کل انبار</th>
                <th className="p-4 md:p-5 font-bold">وضعیت تامین</th>
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
                    <tbody key={p.id} className="divide-y divide-white/5">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="p-4 md:p-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.imageUrl || p.image_url || p.image || "/globe.svg"}
                              alt={prodName}
                              className="w-12 h-14 object-cover rounded-xl border border-white/10 shrink-0"
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

                        <td className="p-4 md:p-5 text-gray-300">
                          {p.category?.name || p.category || "پوشاک"}
                        </td>

                        <td className="p-4 md:p-5">
                          <span className="text-sm font-black text-white">
                            {stock.toLocaleString("fa-IR")}{" "}
                            <span className="text-[10px] text-gray-400 font-normal">عدد</span>
                          </span>
                        </td>

                        <td className="p-4 md:p-5">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              ناموجود در انبار
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              موجودی اندک (هشدار)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              موجود و آماده ارسال
                            </span>
                          )}
                        </td>

                        <td className="p-4 md:p-5 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAdjustStock(p.id, -1)}
                              disabled={adjustingId === p.id || stock <= 0}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                              title="کاهش یک عدد"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAdjustStock(p.id, 5)}
                              disabled={adjustingId === p.id}
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white hover:text-black text-[11px] font-bold transition-all"
                              title="افزایش ۵ عدد"
                            >
                              +۵
                            </button>
                            <button
                              onClick={() => handleAdjustStock(p.id, 20)}
                              disabled={adjustingId === p.id}
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white hover:text-black text-[11px] font-bold transition-all"
                              title="افزایش ۲۰ عدد"
                            >
                              +۲۰
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Nested Variant Rows */}
                      {hasVariants && isExpanded && (
                        <tr className="bg-[#141414]">
                          <td colSpan={5} className="p-4 md:p-6 space-y-3">
                            <span className="text-xs font-bold text-gray-300 block">
                              تنوع‌ها و مشخصات انبار برای «{prodName}»:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {p.variants.map((v: any) => (
                                <div key={v.id} className="bg-[#1a1a1a] border border-white/5 p-3 rounded-2xl flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-white text-xs">{v.title || v.name || "تنوع"}</span>
                                    <span className="text-[10px] text-gray-500 block font-mono" dir="ltr">{v.sku}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-amber-400">{v.inventory?.quantity ?? v.stock ?? 10} عدد</span>
                                    <button
                                      onClick={() => handleAdjustStock(v.id, 5)}
                                      disabled={adjustingId === v.id}
                                      className="px-2 py-1 bg-white/10 hover:bg-white hover:text-black rounded-lg text-[10px] font-bold transition-all"
                                    >
                                      +۵
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

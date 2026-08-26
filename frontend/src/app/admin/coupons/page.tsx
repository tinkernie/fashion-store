"use client";

import { useState, useEffect } from "react";
import {
  Percent,
  Plus,
  Trash2,
  Copy,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
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

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUsage, setMaxUsage] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [validUntil, setValidUntil] = useState("");

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getCoupons();
      setCoupons(data);
    } catch (e) {
      console.error("Error loading coupons:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error("کد تخفیف و مقدار تخفیف الزامی است");
      return;
    }

    setIsLoading(true);
    try {
      await adminApi.createCoupon({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        max_uses: maxUsage ? Number(maxUsage) : undefined,
        min_order_amount: minOrder ? Number(minOrder) : undefined,
        valid_until: validUntil || undefined,
        is_active: true,
      });
      toast.success("کد تخفیف جدید با موفقیت ایجاد شد");
      setIsModalOpen(false);
      loadCoupons();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "خطا در ایجاد کد تخفیف";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string, codeName: string) => {
    if (!confirm(`آیا از حذف کد تخفیف "${codeName}" مطمئن هستید؟`)) return;
    try {
      await adminApi.deleteCoupon(id);
      toast.success("کد تخفیف حذف شد");
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("خطا در حذف کد تخفیف");
    }
  };

  const handleCopy = (c: string) => {
    navigator.clipboard.writeText(c);
    toast.success(`کد "${c}" در کلیپ‌بورد کپی شد`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Percent className="w-8 h-8 text-emerald-400" />
            تخفیف‌ها و کدهای تبلیغاتی
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            تعریف کدهای تخفیف درصدی و ریالی برای کمپین‌ها و جشنواره‌های فروش
          </p>
        </div>

        <Button
          onClick={() => {
            setCode("");
            setDiscountValue("");
            setMaxUsage("");
            setMinOrder("");
            setValidUntil("");
            setIsModalOpen(true);
          }}
          className="h-11 px-5 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center gap-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          ساخت کد تخفیف جدید
        </Button>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#161616] text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-4 md:p-5 font-bold">کد تخفیف</th>
                <th className="p-4 md:p-5 font-bold">نوع و مقدار تخفیف</th>
                <th className="p-4 md:p-5 font-bold">سقف استفاده</th>
                <th className="p-4 md:p-5 font-bold">تاریخ انقضا</th>
                <th className="p-4 md:p-5 font-bold">وضعیت</th>
                <th className="p-4 md:p-5 font-bold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    هیچ کد تخفیفی ثبت نشده است.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id || c.code} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 md:p-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-white bg-white/10 px-3 py-1 rounded-lg border border-white/10" dir="ltr">
                          {c.code}
                        </span>
                        <button
                          onClick={() => handleCopy(c.code)}
                          className="text-gray-500 hover:text-white p-1"
                          title="کپی کد"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="p-4 md:p-5 font-bold text-white">
                      {c.discount_type === "percentage" || c.discount_percent
                        ? `${c.discount_value || c.discount_percent}% تخفیف`
                        : `${(c.discount_value || c.amount || 0).toLocaleString("fa-IR")} تومان`}
                    </td>

                    <td className="p-4 md:p-5 text-gray-300">
                      {c.max_uses ? `${c.used_count || 0} از ${c.max_uses}` : "نامحدود"}
                    </td>

                    <td className="p-4 md:p-5 text-gray-400">
                      {c.valid_until ? new Date(c.valid_until).toLocaleDateString("fa-IR") : "همیشگی"}
                    </td>

                    <td className="p-4 md:p-5">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        فعال
                      </span>
                    </td>

                    <td className="p-4 md:p-5 text-left">
                      <button
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors ml-auto"
                        title="حذف کد تخفیف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Add Coupon Modal --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="bg-[#0e0e0e] border border-white/10 text-white sm:max-w-lg p-6"
          dir="rtl"
        >
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-400" />
              تعریف کد تخفیف جدید
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCoupon} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">کد تخفیف (حروف انگلیسی یا عدد)</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: LUXURY30"
                required
                className="bg-[#141414] border-white/10 h-11 text-white text-xs font-mono tracking-widest uppercase"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">نوع تخفیف</label>
                <select
                  value={discountType}
                  onChange={(e: any) => setDiscountType(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl h-11 px-3 text-white text-xs outline-none"
                >
                  <option value="percentage">درصدی (%)</option>
                  <option value="fixed">مبلغ ثابت (تومان)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">
                  {discountType === "percentage" ? "درصد تخفیف (مثال: 20)" : "مبلغ به تومان"}
                </label>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percentage" ? "20" : "100000"}
                  required
                  className="bg-[#141414] border-white/10 h-11 text-white text-xs"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">حداکثر دفعات استفاده (اختیاری)</label>
                <Input
                  type="number"
                  value={maxUsage}
                  onChange={(e) => setMaxUsage(e.target.value)}
                  placeholder="مثال: 100"
                  className="bg-[#141414] border-white/10 h-11 text-white text-xs"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">حداقل مبلغ خرید (تومان)</label>
                <Input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="مثال: 500000"
                  className="bg-[#141414] border-white/10 h-11 text-white text-xs"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">تاریخ پایان اعتبار (اختیاری)</label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="bg-[#141414] border-white/10 h-11 text-white text-xs"
                dir="ltr"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-sm"
              >
                ثبت و فعال‌سازی تخفیف
              </Button>
              <Button
                type="button"
                onClick={() => setIsModalOpen(false)}
                variant="ghost"
                className="h-12 rounded-xl text-gray-400 hover:text-white"
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

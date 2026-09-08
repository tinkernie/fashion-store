"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle2,
  Package,
  Layers,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  X,
  ShoppingBag,
  Check,
  Tag,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  HelpCircle,
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
import MediaUploader from "@/components/admin/media-uploader";
import { formatPrice, parsePrice } from "@/lib/price-utils";
import { cn } from "@/lib/utils";

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  hero_banner?: string | null;
  priority?: number;
  is_active?: boolean;
  published_from?: string | null;
  published_until?: string | null;
  products?: any[];
  [key: string]: any;
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Create / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [heroBanner, setHeroBanner] = useState("");
  const [priority, setPriority] = useState("0");
  const [isActive, setIsActive] = useState(true);

  // Product Attachment Modal State
  const [selectedCollectionForProducts, setSelectedCollectionForProducts] = useState<CollectionItem | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productActionLoading, setProductActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [colls, prods] = await Promise.all([
        adminApi.getCollections(),
        adminApi.getProducts(),
      ]);
      setCollections(colls);
      setAllProducts(prods);
    } catch (e) {
      console.error("Error loading collections:", e);
      toast.error(getApiErrorMessage(e, "خطا در دریافت لیست کالکشن‌ها"));
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlugFromName = (val: string) => {
    return val
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleOpenCreate = () => {
    setEditingCollection(null);
    setName("");
    setSlug("");
    setDescription("");
    setHeroBanner("");
    setPriority("10");
    setIsActive(true);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (col: CollectionItem) => {
    setEditingCollection(col);
    setName(col.name || "");
    setSlug(col.slug || "");
    setDescription(col.description || "");
    setHeroBanner(col.hero_banner || col.image_url || "");
    setPriority(String(col.priority ?? 0));
    setIsActive(col.is_active !== false);
    setIsFormModalOpen(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("نام کالکشن الزامی است.");
      return;
    }
    const cleanSlug = slug.trim() || generateSlugFromName(name) || `col-${Date.now().toString(36)}`;

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        slug: cleanSlug,
        description: description.trim(),
        priority: parseInt(priority, 10) || 0,
        is_active: isActive,
      };
      if (heroBanner.trim()) {
        payload.hero_banner = heroBanner.trim();
      }

      if (editingCollection) {
        await adminApi.updateCollection(editingCollection.id, payload);
        toast.success(`کالکشن «${name}» با موفقیت بروزرسانی شد.`);
      } else {
        await adminApi.createCollection(payload);
        toast.success(`کالکشن جدید «${name}» با موفقیت اضافه گردید.`);
      }

      setIsFormModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Failed to save collection:", err);
      toast.error(getApiErrorMessage(err, "خطا در ثبت اطلاعات کالکشن"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollection = async (col: CollectionItem) => {
    if (!confirm(`آیا از غیرفعال‌سازی و حذف کالکشن «${col.name}» اطمینان دارید؟`)) {
      return;
    }
    try {
      await adminApi.deleteCollection(col.id);
      toast.success(`کالکشن «${col.name}» حذف گردید.`);
      await loadData();
      if (selectedCollectionForProducts?.id === col.id) {
        setIsProductModalOpen(false);
        setSelectedCollectionForProducts(null);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در حذف کالکشن"));
    }
  };

  // --- Product Attachment Handlers ---
  const handleOpenProductManager = async (col: CollectionItem) => {
    setSelectedCollectionForProducts(col);
    setIsProductModalOpen(true);
    setProductSearchQuery("");
    // Refresh collection to have latest products
    try {
      const fresh = await adminApi.getCollection(col.slug || col.id);
      if (fresh) {
        setSelectedCollectionForProducts(fresh);
        setCollections((prev) => prev.map((c) => (c.id === fresh.id ? fresh : c)));
      }
    } catch {
      // Keep existing
    }
  };

  const handleAddProduct = async (productId: string) => {
    if (!selectedCollectionForProducts) return;
    setProductActionLoading(productId);
    try {
      const currentProductsCount = selectedCollectionForProducts.products?.length || 0;
      await adminApi.addProductToCollection(
        selectedCollectionForProducts.id,
        productId,
        currentProductsCount + 1
      );
      toast.success("محصول به کالکشن اضافه شد.");

      // Refresh data
      const fresh = await adminApi.getCollection(
        selectedCollectionForProducts.slug || selectedCollectionForProducts.id
      );
      if (fresh) {
        setSelectedCollectionForProducts(fresh);
        setCollections((prev) => prev.map((c) => (c.id === fresh.id ? fresh : c)));
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در افزودن محصول به کالکشن"));
    } finally {
      setProductActionLoading(null);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!selectedCollectionForProducts) return;
    setProductActionLoading(productId);
    try {
      await adminApi.removeProductFromCollection(selectedCollectionForProducts.id, productId);
      toast.success("محصول از کالکشن حذف شد.");

      // Refresh data
      const fresh = await adminApi.getCollection(
        selectedCollectionForProducts.slug || selectedCollectionForProducts.id
      );
      if (fresh) {
        setSelectedCollectionForProducts(fresh);
        setCollections((prev) => prev.map((c) => (c.id === fresh.id ? fresh : c)));
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در حذف محصول از کالکشن"));
    } finally {
      setProductActionLoading(null);
    }
  };

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (c.name || "").toLowerCase().includes(query) ||
        (c.slug || "").toLowerCase().includes(query) ||
        (c.description || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.is_active !== false) ||
        (statusFilter === "inactive" && c.is_active === false);

      return matchesSearch && matchesStatus;
    });
  }, [collections, searchQuery, statusFilter]);

  // Products available to add into the selected collection
  const availableCatalogProducts = useMemo(() => {
    if (!selectedCollectionForProducts) return [];
    const attachedIds = new Set(
      (selectedCollectionForProducts.products || []).map((p: any) => String(p.id))
    );
    const query = productSearchQuery.toLowerCase().trim();

    return allProducts.filter((p) => {
      const matchesSearch =
        !query ||
        (p.name || p.title || "").toLowerCase().includes(query) ||
        (p.category || "").toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [allProducts, selectedCollectionForProducts, productSearchQuery]);

  const totalProductsInAllCollections = useMemo(() => {
    return collections.reduce((sum, c) => sum + (c.products?.length || 0), 0);
  }, [collections]);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400" />
            مدیریت کالکشن‌ها و مناسبت‌های ویژه
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            ایجاد و مدیریت کالکشن‌های تخفیف و ایونت‌های فصلی برای نمایش در پایین صفحه اصلی و تعیین محصولات موجود هر کالکشن.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="h-11 px-3 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-gray-300"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="h-11 px-5 rounded-xl bg-white text-black hover:bg-gray-200 font-black text-xs flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            افزودن کالکشن جدید
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold">کل کالکشن‌های سیستم</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {collections.length.toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-normal text-gray-400">کالکشن</span>
          </div>
          <span className="text-[11px] text-gray-500 block">
            نمایش‌داده‌شده در کاتالوگ و روت‌های فروشگاه
          </span>
        </div>

        <div className="bg-[#111111] border border-emerald-500/20 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold">کالکشن‌های فعال صفحه اصلی</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {collections.filter((c) => c.is_active !== false).length.toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-normal text-gray-400">فعال</span>
          </div>
          <span className="text-[11px] text-gray-500 block">
            بر اساس بازه زمانی انتشار و وضعیت فعال
          </span>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold">مجموع محصولات متصل</span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {totalProductsInAllCollections.toLocaleString("fa-IR")}{" "}
            <span className="text-xs font-normal text-gray-400">قلم لباس</span>
          </div>
          <span className="text-[11px] text-gray-500 block">
            محصولات منتخب تخصیص‌یافته به مجموعه‌ها
          </span>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-4 py-2 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی کالکشن بر اساس نام یا نامک..."
            className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder:text-gray-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
              statusFilter === "all"
                ? "bg-white text-black font-black"
                : "bg-white/5 text-gray-400 hover:text-white"
            )}
          >
            همه ({collections.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
              statusFilter === "active"
                ? "bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/30"
                : "bg-white/5 text-gray-400 hover:text-white"
            )}
          >
            فعال ({collections.filter((c) => c.is_active !== false).length})
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
              statusFilter === "inactive"
                ? "bg-amber-500/20 text-amber-400 font-black border border-amber-500/30"
                : "bg-white/5 text-gray-400 hover:text-white"
            )}
          >
            غیرفعال ({collections.filter((c) => c.is_active === false).length})
          </button>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#161616] text-gray-400 border-b border-white/10">
              <tr>
                <th className="py-4 px-6 font-bold">کالکشن / تصویر بنر</th>
                <th className="py-4 px-4 font-bold">نامک آدرس (URL)</th>
                <th className="py-4 px-4 font-bold">تعداد محصولات</th>
                <th className="py-4 px-4 font-bold">اولویت نمایش</th>
                <th className="py-4 px-4 font-bold">وضعیت</th>
                <th className="py-4 px-6 font-bold text-left">مدیریت و عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    کالکشنی با مشخصات فوق یافت نشد. می‌توانید با دکمه «افزودن کالکشن جدید» یک مجموعه تازه بسازید.
                  </td>
                </tr>
              ) : (
                filteredCollections.map((col) => {
                  const bannerUrl = col.hero_banner || col.image_url || col.image;
                  const prodCount = col.products?.length || 0;

                  return (
                    <tr key={col.id} className="hover:bg-white/5 transition-colors">
                      {/* Name & Banner */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10 shrink-0 relative flex items-center justify-center">
                            {bannerUrl ? (
                              <img
                                src={bannerUrl}
                                alt={col.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "/globe.svg";
                                }}
                              />
                            ) : (
                              <Sparkles className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <span className="font-bold text-white text-sm block truncate max-w-xs">
                              {col.name}
                            </span>
                            {col.description && (
                              <p className="text-[11px] text-gray-400 truncate max-w-sm line-clamp-1">
                                {col.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-4 px-4 font-mono text-[11px] text-gray-400" dir="ltr">
                        /collections/{col.slug}
                      </td>

                      {/* Products Count */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-xs">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {prodCount.toLocaleString("fa-IR")} محصول
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-4 text-gray-300 font-mono text-xs">
                        {col.priority ?? 0}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                            col.is_active !== false
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}
                        >
                          {col.is_active !== false ? "فعال در سایت" : "غیرفعال"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-left">
                        <div className="flex items-center justify-end gap-2">
                          {/* Manage Products Button */}
                          <Button
                            onClick={() => handleOpenProductManager(col)}
                            size="sm"
                            className="h-8 px-3 rounded-xl bg-amber-400 text-black hover:bg-amber-300 font-black text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Package className="w-3.5 h-3.5" />
                            انتخاب محصولات ({prodCount})
                          </Button>

                          {/* View in Store */}
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                            title="مشاهده در سایت"
                          >
                            <Link href={`/collections/${col.slug || col.id}`} target="_blank">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </Button>

                          {/* Edit */}
                          <Button
                            onClick={() => handleOpenEdit(col)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                            title="ویرایش مشخصات"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>

                          {/* Delete */}
                          <Button
                            onClick={() => handleDeleteCollection(col)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-rose-400"
                            title="حذف کالکشن"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Collection Create / Edit Modal --- */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent
          className="bg-[#0f0f0f] border border-white/10 text-white sm:max-w-xl p-6 md:p-8 max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {editingCollection ? "ویرایش مشخصات کالکشن" : "ایجاد کالکشن مناسبتی / تخفیفی جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCollection} className="space-y-5 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">نام کالکشن</label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCollection && !slug) {
                      setSlug(generateSlugFromName(e.target.value));
                    }
                  }}
                  placeholder="مثال: فروش ویژه زمستانه یا کالکشن نوروز"
                  required
                  className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">نامک انگلیسی (Slug برای URL)</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="winter-sale"
                  required
                  className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">توضیحات کالکشن (نمایش در هدر رویداد)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیح کوتاه درباره تم کالکشن، تخفیف‌ها یا جزئیات لباس‌ها..."
                rows={3}
                className="w-full bg-[#181818] border border-white/10 text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400/50 resize-none"
              />
            </div>

            {/* Banner Image Uploader */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">بنر یا تصویر کاور کالکشن</label>
              <MediaUploader
                value={heroBanner}
                onChange={(url) => setHeroBanner(url)}
                label="آپلود یا درج لینک تصویر بنر کالکشن"
                aspectRatio="banner"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">اولویت نمایش (Priority)</label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  placeholder="10"
                  className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl font-mono"
                  dir="ltr"
                />
                <span className="text-[10px] text-gray-500">
                  عدد بالاتر در ابتدای اسلایدر و لیست صفحه اصلی نشان داده می‌شود.
                </span>
              </div>

              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="text-xs font-bold text-gray-300 mb-2">وضعیت انتشار</label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                    isActive
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-white/5 border-white/10 text-gray-400"
                  )}
                >
                  <span>{isActive ? "کالکشن فعال است (نمایش در سایت)" : "کالکشن غیرفعال (پیش‌نویس)"}</span>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center border",
                      isActive ? "bg-emerald-400 border-emerald-400 text-black" : "border-gray-500"
                    )}
                  >
                    {isActive && <Check className="w-3 h-3" />}
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                variant="outline"
                className="h-11 px-5 rounded-xl border-white/10 text-xs text-gray-400 hover:text-white"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-6 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingCollection ? "بروزرسانی کالکشن" : "ایجاد و ذخیره کالکشن"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Dedicated Product Selection & Management Modal --- */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent
          className="bg-[#0b0b0b] border border-white/10 text-white sm:max-w-4xl p-6 md:p-8 max-h-[90vh] flex flex-col"
          dir="rtl"
        >
          <DialogHeader className="border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg md:text-xl font-black flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                مدیریت محصولات کالکشن «{selectedCollectionForProducts?.name}»
              </DialogTitle>
              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                {(selectedCollectionForProducts?.products?.length || 0).toLocaleString("fa-IR")} محصول متصل
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              محصولاتی که مایل هستید در این رویداد یا کالکشن تخفیفی نمایش داده شوند را با کلیک روی «+ افزودن» اضافه نمایید.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pt-4 pr-1">
            {/* 1. Currently Attached Products Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  محصولات حاضر در این کالکشن ({selectedCollectionForProducts?.products?.length || 0})
                </h3>
              </div>

              {(!selectedCollectionForProducts?.products ||
                selectedCollectionForProducts.products.length === 0) ? (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-1">
                  <ShoppingBag className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-xs text-gray-400 font-bold">هنوز هیچ محصولی به این کالکشن اضافه نشده است.</p>
                  <p className="text-[11px] text-gray-500">
                    از لیست زیر محصول مورد نظر خود را انتخاب کرده و روی «افزودن به کالکشن» کلیک کنید.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedCollectionForProducts.products.map((item: any) => {
                    const itemImg = item.imageUrl || item.image_url || "/globe.svg";
                    const isRemoving = productActionLoading === String(item.id);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#141414] border border-white/5 hover:border-white/10 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={itemImg}
                            alt={item.title || item.name}
                            className="w-12 h-14 object-cover rounded-xl border border-white/10 bg-[#222] shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/globe.svg";
                            }}
                          />
                          <div className="min-w-0 space-y-0.5">
                            <span className="font-bold text-white block truncate">
                              {item.title || item.name}
                            </span>
                            <span className="text-[11px] text-amber-400 font-mono block">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(String(item.id))}
                          disabled={isRemoving}
                          className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="حذف از این کالکشن"
                        >
                          {isRemoving ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Available Catalog Products Picker Section */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-400" />
                    انتخاب و افزودن از کاتالوگ محصولات فروشگاه
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    محصولاتی که می‌خواهید به این کالکشن اضافه کنید را جستجو نمایید.
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-xl px-3 py-1.5 w-full sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="جستجو در نام محصول..."
                    className="bg-transparent border-none outline-none text-white text-xs w-full"
                  />
                  {productSearchQuery && (
                    <button onClick={() => setProductSearchQuery("")} className="text-gray-500">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {availableCatalogProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  محصولی یافت نشد.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {availableCatalogProducts.map((product) => {
                    const isAlreadyAttached = (selectedCollectionForProducts?.products || []).some(
                      (p: any) => String(p.id) === String(product.id)
                    );
                    const isAdding = productActionLoading === String(product.id);
                    const img = product.imageUrl || product.image_url || product.image || "/globe.svg";

                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-2xl border transition-all text-xs",
                          isAlreadyAttached
                            ? "bg-emerald-500/5 border-emerald-500/20 opacity-80"
                            : "bg-[#141414] border-white/5 hover:border-white/15"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={img}
                            alt={product.name || product.title}
                            className="w-12 h-14 object-cover rounded-xl border border-white/10 bg-[#222] shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/globe.svg";
                            }}
                          />
                          <div className="min-w-0 space-y-0.5">
                            <span className="font-bold text-white block truncate">
                              {product.name || product.title}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate">
                              {product.category_name || product.category || "پوشاک"}
                            </span>
                            <span className="text-[11px] text-amber-400 font-mono font-bold block">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        </div>

                        <div>
                          {isAlreadyAttached ? (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              متصل
                            </span>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => handleAddProduct(String(product.id))}
                              disabled={isAdding}
                              size="sm"
                              className="h-8 px-3 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black text-[11px] font-bold transition-all cursor-pointer"
                            >
                              {isAdding ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  افزودن
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center shrink-0">
            <span className="text-[11px] text-gray-400">
              تغییرات به صورت آنی در سرور ذخیره می‌شوند.
            </span>
            <Button
              onClick={() => setIsProductModalOpen(false)}
              className="h-10 px-6 rounded-xl bg-white text-black font-bold text-xs hover:bg-gray-200"
            >
              اتمام و بستن پنجره
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

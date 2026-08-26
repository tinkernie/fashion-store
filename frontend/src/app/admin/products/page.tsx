"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Search,
  Pencil,
  Trash2,
  Archive,
  Eye,
  CheckCircle2,
  ExternalLink,
  Layers,
  Filter,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  Link2,
  FileImage,
  X,
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCatalogData();
  }, []);

  const loadCatalogData = async () => {
    setIsLoading(true);
    try {
      const [prodsRes, catsRes, colsRes] = await Promise.allSettled([
        adminApi.getProducts(),
        adminApi.getCategories(),
        adminApi.getCollections(),
      ]);

      if (prodsRes.status === "fulfilled") {
        setProducts(prodsRes.value);
      }
      if (catsRes.status === "fulfilled") {
        setCategories(catsRes.value);
      }
      if (colsRes.status === "fulfilled") {
        setCollections(colsRes.value);
      }
    } catch (e) {
      console.error("Error loading catalog:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setTitle("");
    setSlug("");
    setCategoryId(categories[0]?.id || "");
    setCollectionId("");
    setPrice("");
    setDiscountPrice("");
    setDescription("");
    setImageUrl("");
    setStatus("active");
    setImageTab("upload");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setTitle(p.name || p.title || "");
    setSlug(p.slug || "");
    setCategoryId(p.category_id || p.category?.id || categories[0]?.id || "");
    setCollectionId(p.collection_id || p.collection?.id || "");
    setPrice(String(p.price || ""));
    setDiscountPrice(p.discount_price ? String(p.discount_price) : "");
    setDescription(p.description || "");
    setImageUrl(p.imageUrl || p.image_url || p.images?.[0]?.url || "");
    setStatus(p.status || "active");
    setImageTab(p.imageUrl || p.image_url ? "upload" : "upload");
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("لطفاً یک فایل معتبر تصویری (JPG, PNG, WEBP) انتخاب کنید");
      return;
    }

    setIsUploadingImage(true);
    try {
      const res = await adminApi.uploadImage(file);
      if (res?.url || res?.image_url) {
        const uploadedUrl = res.url || res.image_url;
        setImageUrl(uploadedUrl);
        toast.success("تصویر با موفقیت بارگذاری شد");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در بارگذاری تصویر از سیستم");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      toast.error("نام و قیمت محصول الزامی است");
      return;
    }

    setIsLoading(true);
    const cleanSlug =
      (slug || title)
        .trim()
        .toLowerCase()
        .replace(/[^\w\u0600-\u06FF\s-]/g, "")
        .replace(/\s+/g, "-") || `prod-${Date.now()}`;

    const payload: any = {
      title,
      slug: cleanSlug,
      category_id: categoryId || undefined,
      collection_id: collectionId || undefined,
      price: Number(price),
      discount_price: discountPrice ? Number(discountPrice) : undefined,
      description,
      image_url: imageUrl,
      status: status === "active" ? "published" : status,
    };

    try {
      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, payload);
        toast.success("محصول با موفقیت بروزرسانی شد");
      } else {
        await adminApi.createProduct(payload);
        toast.success("محصول جدید با موفقیت اضافه شد");
      }
      setIsModalOpen(false);
      loadCatalogData();
    } catch (err: any) {
      const data = err?.response?.data;
      let errorMsg = "خطا در ذخیره محصول";
      if (data?.error?.errors && typeof data.error.errors === "object") {
        const firstKey = Object.keys(data.error.errors)[0];
        const val = data.error.errors[firstKey];
        errorMsg = `${firstKey}: ${Array.isArray(val) ? val[0] : val}`;
      } else if (data?.error?.message) {
        errorMsg = data.error.message;
      } else if (data?.detail) {
        errorMsg = data.detail;
      }
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await adminApi.archiveProduct(id);
      toast.success("محصول بایگانی شد");
      loadCatalogData();
    } catch {
      toast.error("خطا در بایگانی محصول");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`آیا از حذف محصول "${name}" مطمئن هستید؟`)) return;
    try {
      await adminApi.deleteProduct(id);
      toast.success("محصول با موفقیت حذف شد");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error("خطا در حذف محصول");
    }
  };

  const filteredProducts = products.filter((p) => {
    const name = (p.name || p.title || "").toLowerCase();
    const matchesQuery = name.includes(searchQuery.toLowerCase()) || (p.slug || "").includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      p.category === selectedCategory ||
      p.category?.name === selectedCategory ||
      p.category_id === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-purple-400" />
            کاتالوگ و مدیریت محصولات
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            مشاهده، افزودن، ویرایش قیمت‌ها، تصاویر و دسته‌بندی‌های لباس و پوشاک
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-11 px-5 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center gap-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          افزودن لباس جدید
        </Button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-4 py-2">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام محصول، مدل یا کد..."
            className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder:text-gray-600"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#111111] border border-white/10 rounded-2xl px-4 py-2">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white text-xs cursor-pointer"
          >
            <option value="all" className="bg-[#111111]">
              تمام دسته‌بندی‌ها
            </option>
            {categories.map((c) => (
              <option key={c.id || c.slug} value={c.slug || c.name} className="bg-[#111111]">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#161616] text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-4 md:p-5 font-bold">محصول</th>
                <th className="p-4 md:p-5 font-bold">دسته‌بندی</th>
                <th className="p-4 md:p-5 font-bold">قیمت (تومان)</th>
                <th className="p-4 md:p-5 font-bold">وضعیت</th>
                <th className="p-4 md:p-5 font-bold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    هیچ محصولی مطابق جستجو یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const prodName = p.name || p.title || "محصول بدون نام";
                  const prodPrice = Number(p.price) || 0;
                  const prodDiscount = p.discount_price ? Number(p.discount_price) : null;
                  const prodImg = p.imageUrl || p.image_url || p.images?.[0]?.url || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop";
                  const catName = p.category?.name || p.category || "پوشاک";

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 md:p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10 shrink-0">
                            <img
                              src={prodImg}
                              alt={prodName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs md:text-sm line-clamp-1">
                              {prodName}
                            </h4>
                            <span className="text-[10px] text-gray-500 font-mono" dir="ltr">
                              /{p.slug || p.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 md:p-5">
                        <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-[11px] text-gray-300">
                          {catName}
                        </span>
                      </td>

                      <td className="p-4 md:p-5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-xs md:text-sm block">
                            {(prodDiscount || prodPrice).toLocaleString("fa-IR")} تومان
                          </span>
                          {prodDiscount && (
                            <span className="text-[10px] text-gray-500 line-through block">
                              {prodPrice.toLocaleString("fa-IR")} تومان
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 md:p-5">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            p.status === "active" || !p.status
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {p.status === "active" || !p.status ? "فعال در فروشگاه" : "بایگانی شده"}
                        </span>
                      </td>

                      <td className="p-4 md:p-5 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${p.id}`}
                            target="_blank"
                            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            title="مشاهده در فروشگاه"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            title="ویرایش محصول"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleArchive(p.id)}
                            className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                            title="بایگانی محصول"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, prodName)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="حذف کامل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* --- Add / Edit Product Modal --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="bg-[#0e0e0e] border border-white/10 text-white sm:max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-400" />
              {editingProduct ? `ویرایش محصول "${title}"` : "افزودن لباس یا کالای جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-5 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">نام لباس / عنوان محصول</label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingProduct) {
                      setSlug(
                        e.target.value
                          .trim()
                          .toLowerCase()
                          .replace(/[^\w\u0600-\u06FF\s-]/g, "")
                          .replace(/\s+/g, "-")
                      );
                    }
                  }}
                  placeholder="مثال: پالتو فوتر پشمی لوکس"
                  required
                  className="bg-[#141414] border-white/10 h-11 text-white text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">شناسه لینک (Slug)</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="wool-coat"
                  className="bg-[#141414] border-white/10 h-11 text-white text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">دسته‌بندی</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl h-11 px-3 text-white text-xs outline-none"
                >
                  <option value="">انتخاب دسته‌بندی...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">کالکشن (اختیاری)</label>
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl h-11 px-3 text-white text-xs outline-none"
                >
                  <option value="">بدون کالکشن خاص</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">قیمت اصلی (تومان)</label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="مثال: 1250000"
                  required
                  className="bg-[#141414] border-white/10 h-11 text-white text-xs"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">قیمت با تخفیف ویژه (اختیاری)</label>
                <Input
                  type="number"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="مثال: 980000"
                  className="bg-[#141414] border-white/10 h-11 text-white text-xs"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Image Section (Upload & URL) */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#141414] border border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                  تصویر اصلی محصول
                </label>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-[#1c1c1c] p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setImageTab("upload")}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      imageTab === "upload"
                        ? "bg-white text-black font-bold shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    بارگذاری فایل
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab("url")}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      imageTab === "url"
                        ? "bg-white text-black font-bold shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    لینک اینترنتی
                  </button>
                </div>
              </div>

              {imageTab === "upload" ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {imageUrl ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-[#1a1a1a] p-3 flex items-center gap-4">
                      <img
                        src={imageUrl}
                        alt="Product Preview"
                        className="w-20 h-24 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          تصویر با موفقیت انتخاب شد
                        </p>
                        <p className="text-[11px] text-gray-400 truncate mb-2 dir-ltr font-mono">
                          {imageUrl}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="h-7 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white border-0"
                          >
                            تغییر تصویر
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setImageUrl("")}
                            className="h-7 text-xs rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isUploadingImage
                          ? "border-amber-500/50 bg-amber-500/5 cursor-wait"
                          : "border-white/15 hover:border-white/40 bg-[#161616] hover:bg-[#1a1a1a]"
                      }`}
                    >
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                          <span className="text-xs font-bold text-amber-300">در حال بارگذاری فایل...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">برای انتخاب فایل تصویر کلیک کنید</span>
                            <p className="text-[11px] text-gray-500 mt-1">پشتیبانی از فرمت‌های JPG, PNG, WEBP</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="bg-[#181818] border-white/10 h-11 text-white text-xs"
                    dir="ltr"
                  />
                  {imageUrl && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#181818] border border-white/5">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-12 h-14 rounded-lg object-cover border border-white/10"
                      />
                      <span className="text-[11px] text-gray-400 truncate dir-ltr">{imageUrl}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">توضیحات و ویژگی‌های لباس</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="جنس پارچه، راهنمای شستشو، جزئیات دوخت و..."
                rows={3}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs placeholder:text-gray-600 outline-none focus:border-white/30 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-sm"
              >
                {editingProduct ? "ذخیره تغییرات محصول" : "افزودن به فروشگاه"}
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

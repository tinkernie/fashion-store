"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  Sparkles,
  RefreshCw,
  X,
  Sliders,
  Boxes,
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
import MediaUploader from "@/components/admin/media-uploader";

interface OptionDef {
  name: string;
  valuesInput: string;
}

interface VariantItem {
  id?: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
}

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

  // Variant Builder State
  const [options, setOptions] = useState<OptionDef[]>([
    { name: "رنگ", valuesInput: "مشکی, سفید, کرم" },
    { name: "سایز", valuesInput: "S, M, L, XL" },
  ]);
  const [variantsMatrix, setVariantsMatrix] = useState<VariantItem[]>([]);
  const [showVariantGenerator, setShowVariantGenerator] = useState(false);

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
    setVariantsMatrix([]);
    setShowVariantGenerator(false);
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
    setImageUrl(p.imageUrl || p.image_url || p.image || p.images?.[0]?.url || "");
    setStatus(p.status || "active");

    // If product has variants, pre-populate
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      setVariantsMatrix(
        p.variants.map((v: any) => ({
          id: v.id,
          name: v.title || v.name || "تنوع",
          sku: v.sku || "",
          price: String(v.price || p.price || ""),
          stock: v.inventory?.quantity || v.stock || 10,
        }))
      );
      setShowVariantGenerator(true);
    } else {
      setVariantsMatrix([]);
      setShowVariantGenerator(false);
    }
    setIsModalOpen(true);
  };

  // Generate Combinatorial Matrix
  const handleGenerateMatrix = () => {
    const parsedOptions = options
      .map((opt) => ({
        name: opt.name.trim(),
        values: opt.valuesInput
          .split(/[,،]/)
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((opt) => opt.name && opt.values.length > 0);

    if (parsedOptions.length === 0) {
      toast.error("لطفاً حداقل یک ویژگی با مقادیر معتبر وارد کنید.");
      return;
    }

    // Cartesian product
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (a, b) => a.flatMap((d) => b.map((e) => [...d, e])),
        [[]]
      );
    };

    const valueArrays = parsedOptions.map((o) => o.values);
    const combinations = cartesian(valueArrays);

    const baseSlug = (slug || title).trim().toLowerCase().replace(/\s+/g, "-") || "item";
    const generated: VariantItem[] = combinations.map((combo, idx) => {
      const comboName = combo.join(" / ");
      const comboSku = `${baseSlug.toUpperCase().slice(0, 4)}-${combo.map((c) => c.slice(0, 2).toUpperCase()).join("")}-${idx + 1}`;
      return {
        name: comboName,
        sku: comboSku,
        price: price || "0",
        stock: 10,
      };
    });

    setVariantsMatrix(generated);
    setShowVariantGenerator(true);
    toast.success(`${generated.length} تنوع محصول با موفقیت ایجاد شد.`);
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
      variants: variantsMatrix.map((v) => ({
        name: v.name,
        sku: v.sku,
        price: Number(v.price) || Number(price),
        stock: Number(v.stock) || 0,
      })),
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
    <div className="space-y-8 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-amber-400" />
            کاتالوگ و مدیریت محصولات
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            مشاهده، افزودن، ویرایش قیمت‌ها، تصاویر مستقیم و مدیریت تنوع‌های کالا (رنگ، سایز و انبار)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={loadCatalogData}
            variant="outline"
            className="h-11 px-4 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            بروزرسانی
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="h-11 px-5 rounded-xl bg-white text-black hover:bg-gray-200 font-black text-xs flex items-center gap-2 shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4" />
            افزودن لباس جدید
          </Button>
        </div>
      </div>

      {/* Control Bar: Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-4 py-2 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی محصول بر اساس نام یا نامک..."
            className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder:text-gray-600"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full sm:w-auto pb-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === "all"
                ? "bg-white text-black font-black"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            همه ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === c.id
                  ? "bg-white text-black font-black"
                  : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#161616] text-gray-400 border-b border-white/10">
              <tr>
                <th className="py-4 px-6 font-bold">محصول</th>
                <th className="py-4 px-4 font-bold">دسته‌بندی</th>
                <th className="py-4 px-4 font-bold">قیمت (تومان)</th>
                <th className="py-4 px-4 font-bold">تنوع‌ها / سایز</th>
                <th className="py-4 px-4 font-bold">وضعیت</th>
                <th className="py-4 px-6 font-bold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    محصولی با مشخصات فوق یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const img = p.imageUrl || p.image_url || p.image || "/globe.svg";
                  const catName = p.category?.name || p.category || "نامشخص";
                  const variantCount = p.variants?.length || 0;

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      {/* Product Name & Image */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt={p.name || p.title}
                            className="w-12 h-14 object-cover rounded-xl border border-white/10 shrink-0"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-bold text-white text-xs block truncate max-w-xs">
                              {p.name || p.title}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono block" dir="ltr">
                              {p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10 text-[11px]">
                          {catName}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 font-bold text-white">
                        {p.price ? Number(p.price).toLocaleString("fa-IR") : "تماس بگیرید"}
                      </td>

                      {/* Variants */}
                      <td className="py-4 px-4">
                        {variantCount > 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold text-[10px]">
                            {variantCount} تنوع رنگ/سایز
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">تک محصول</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            p.status === "published" || p.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {p.status === "published" || p.status === "active" ? "منتشر شده" : "پیش‌نویس / غیرفعال"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${p.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="مشاهده در فروشگاه"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
                            title="ویرایش"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(p.id, p.name || p.title)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                            title="حذف"
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

      {/* Product Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#0f0f0f] border border-white/10 text-white sm:max-w-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              {editingProduct ? "ویرایش مشخصات محصول" : "افزودن لباس و محصول جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">نام محصول / لباس</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: کت چرم پاییزه اورسایز"
                  required
                  className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">نامک (Slug انگلیسی)</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="oversized-leather-jacket"
                  className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl font-sans"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Category & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">دسته‌بندی</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 h-11 text-xs text-white rounded-xl px-3 outline-none"
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
                <label className="text-xs font-bold text-gray-300">قیمت پایه (تومان)</label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1250000"
                  required
                  className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl font-sans"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">قیمت با تخفیف (اختیاری)</label>
                <Input
                  type="number"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="950000"
                  className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl font-sans"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Media Uploader Component */}
            <div className="p-4 bg-[#141414] border border-white/10 rounded-2xl">
              <MediaUploader
                value={imageUrl}
                onChange={setImageUrl}
                label="تصویر شاخص محصول (آپلود مستقیم یا لینک)"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">توضیحات و مشخصات لباس</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="جنس پارچه، راهنمای شستشو، جزئیات استایل و..."
                rows={3}
                className="w-full bg-[#181818] border border-white/10 text-xs text-white rounded-xl p-3 outline-none resize-none focus:border-amber-400/50"
              />
            </div>

            {/* --- Variant Matrix Generator --- */}
            <div className="p-5 bg-[#141414] border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-purple-400" />
                    ماتریس تنوع و مشخصات انبار (رنگ، سایز و...)
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    تولید خودکار ترکیب‌های مختلف لباس با امکان تعیین موجودی و کد SKU مجزا
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleGenerateMatrix}
                  variant="outline"
                  className="h-8 px-3 text-xs border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 rounded-xl"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  تولید ماتریس تنوع
                </Button>
              </div>

              {/* Option Definitions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((opt, idx) => (
                  <div key={idx} className="bg-[#181818] p-3 rounded-xl border border-white/5 space-y-2">
                    <span className="text-[11px] font-bold text-gray-300">ویژگی {idx + 1}</span>
                    <div className="flex gap-2">
                      <Input
                        value={opt.name}
                        onChange={(e) => {
                          const next = [...options];
                          next[idx].name = e.target.value;
                          setOptions(next);
                        }}
                        placeholder="نام ویژگی (مثال: رنگ)"
                        className="h-9 text-xs bg-white/5 border-white/10 w-1/3 text-white"
                      />
                      <Input
                        value={opt.valuesInput}
                        onChange={(e) => {
                          const next = [...options];
                          next[idx].valuesInput = e.target.value;
                          setOptions(next);
                        }}
                        placeholder="مقادیر با ویرگول (مشکی, سفید)"
                        className="h-9 text-xs bg-white/5 border-white/10 flex-1 text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Generated Variants Table */}
              {variantsMatrix.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-xs font-bold text-white block">
                    تنوع‌های ایجاد شده ({variantsMatrix.length} مورد):
                  </span>
                  <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                    {variantsMatrix.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#181818] p-2 rounded-xl border border-white/5 text-xs">
                        <span className="font-bold text-white w-28 truncate">{v.name}</span>
                        <Input
                          value={v.sku}
                          onChange={(e) => {
                            const next = [...variantsMatrix];
                            next[i].sku = e.target.value;
                            setVariantsMatrix(next);
                          }}
                          placeholder="SKU"
                          className="h-8 text-[11px] bg-white/5 border-white/10 flex-1 font-mono text-left"
                          dir="ltr"
                        />
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-[10px] text-gray-500">موجودی:</span>
                          <Input
                            type="number"
                            value={v.stock}
                            onChange={(e) => {
                              const next = [...variantsMatrix];
                              next[i].stock = Number(e.target.value);
                              setVariantsMatrix(next);
                            }}
                            className="h-8 text-[11px] bg-white/5 border-white/10 w-12 text-center text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-black text-xs"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingProduct ? "ذخیره تغییرات محصول" : "افزودن و انتشار محصول"}
              </Button>
              <Button
                type="button"
                onClick={() => setIsModalOpen(false)}
                variant="ghost"
                className="h-12 rounded-xl text-gray-400 hover:text-white text-xs"
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

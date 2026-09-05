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
  Tag,
  Check,
  Package,
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

  // Product Create/Edit Modal State
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

  // Variant Builder State for in-form generator
  const [options, setOptions] = useState<OptionDef[]>([
    { name: "رنگ", valuesInput: "مشکی, سفید, کرم" },
    { name: "سایز", valuesInput: "S, M, L, XL" },
  ]);
  const [variantsMatrix, setVariantsMatrix] = useState<VariantItem[]>([]);
  const [showVariantGenerator, setShowVariantGenerator] = useState(false);

  // Dedicated Options & Variants Manager Modal State
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<any | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});
  
  // Single Variant Add Form inside Variant Modal
  const [newVariantSku, setNewVariantSku] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("10");
  const [selectedOptionValueIds, setSelectedOptionValueIds] = useState<Record<string, string>>({});

  // Dedicated Category Manager Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Category Inline Edit State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatSlug, setEditCatSlug] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");

  useEffect(() => {
    loadCatalogData();

    const handleCatsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCategories(e.detail);
      }
    };
    window.addEventListener("fashion_categories_updated", handleCatsUpdated);
    return () => window.removeEventListener("fashion_categories_updated", handleCatsUpdated);
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

    // Precise Category Matching by ID, Name, or Slug
    let matchedCatId = p.category_id || p.category?.id;
    if (!matchedCatId && p.category) {
      const rawCat = typeof p.category === "string" ? p.category : p.category?.name || p.category?.slug;
      const found = categories.find(
        (c) => c.name === rawCat || c.slug === rawCat || c.id === rawCat
      );
      if (found) matchedCatId = found.id;
    }
    setCategoryId(matchedCatId || categories[0]?.id || "");
    setCollectionId(p.collection_id || p.collection?.id || "");
    setPrice(String(p.price || ""));
    setDiscountPrice(p.discount_price ? String(p.discount_price) : "");
    setDescription(p.description || "");
    setImageUrl(p.imageUrl || p.image_url || p.image || p.images?.[0]?.url || "");
    setStatus(p.status || "active");

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

  // Open Dedicated Options & Variants Manager
  const handleOpenVariantManager = async (product: any) => {
    setSelectedProductForVariants(product);
    setIsVariantModalOpen(true);
    setIsLoadingVariants(true);
    try {
      const [opts, vars] = await Promise.all([
        adminApi.getProductOptions(product.id),
        adminApi.getVariants(product.id),
      ]);
      setProductOptions(opts);
      setProductVariants(vars);
      setNewVariantPrice(String(product.price || ""));
      setNewVariantSku(`${(product.slug || "PROD").toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`);
    } catch (e) {
      console.error("Error loading product options & variants:", e);
      toast.error("خطا در بارگذاری مشخصات و تنوع‌ها");
    } finally {
      setIsLoadingVariants(false);
    }
  };

  const handleAddProductOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionName.trim() || !selectedProductForVariants) return;
    try {
      await adminApi.createProductOption(selectedProductForVariants.id, {
        name: newOptionName.trim(),
      });
      toast.success(`ویژگی "${newOptionName}" اضافه شد`);
      setNewOptionName("");
      const opts = await adminApi.getProductOptions(selectedProductForVariants.id);
      setProductOptions(opts);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در ثبت ویژگی");
    }
  };

  const handleDeleteProductOption = async (optionId: string) => {
    if (!confirm("آیا از حذف این ویژگی و مقادیر آن مطمئن هستید؟")) return;
    try {
      await adminApi.deleteProductOption(selectedProductForVariants.id, optionId);
      toast.success("ویژگی حذف شد");
      const opts = await adminApi.getProductOptions(selectedProductForVariants.id);
      setProductOptions(opts);
    } catch {
      toast.error("خطا در حذف ویژگی");
    }
  };

  const handleAddOptionValue = async (optionId: string) => {
    const val = newValueInputs[optionId]?.trim();
    if (!val || !selectedProductForVariants) return;
    try {
      await adminApi.createOptionValue(selectedProductForVariants.id, optionId, {
        value: val,
      });
      toast.success(`مقدار "${val}" ثبت شد`);
      setNewValueInputs((prev) => ({ ...prev, [optionId]: "" }));
      const opts = await adminApi.getProductOptions(selectedProductForVariants.id);
      setProductOptions(opts);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در ثبت مقدار");
    }
  };

  const handleDeleteOptionValue = async (optionId: string, valueId: string) => {
    try {
      await adminApi.deleteOptionValue(selectedProductForVariants.id, optionId, valueId);
      toast.success("مقدار حذف شد");
      const opts = await adminApi.getProductOptions(selectedProductForVariants.id);
      setProductOptions(opts);
    } catch {
      toast.error("خطا در حذف مقدار");
    }
  };

  const handleCreateRealVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariantSku.trim() || !newVariantPrice || !selectedProductForVariants) {
      toast.error("کد SKU و قیمت تنوع الزامی است");
      return;
    }

    const optionValuesPayload = Object.entries(selectedOptionValueIds).map(
      ([option_id, value_id]) => ({ option_id, value_id })
    );

    try {
      const createdVar = await adminApi.createVariant({
        product_id: selectedProductForVariants.id,
        sku: newVariantSku.trim().toUpperCase(),
        price: Number(newVariantPrice),
        availability: "in_stock",
        status: "published",
        option_values: optionValuesPayload,
      });

      if (Number(newVariantStock) > 0 && createdVar.id) {
        await adminApi.adjustStock(createdVar.id, Number(newVariantStock));
      }

      toast.success("تنوع جدید با موفقیت ایجاد شد");
      const vars = await adminApi.getVariants(selectedProductForVariants.id);
      setProductVariants(vars);
      setNewVariantSku(`${(selectedProductForVariants.slug || "PROD").toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در ایجاد تنوع");
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm("آیا از حذف این تنوع کالا مطمئن هستید؟")) return;
    try {
      await adminApi.deleteVariant(variantId);
      toast.success("تنوع حذف شد");
      const vars = await adminApi.getVariants(selectedProductForVariants.id);
      setProductVariants(vars);
    } catch {
      toast.error("خطا در حذف تنوع");
    }
  };

  // Generate Combinatorial Matrix for in-product form
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

    const matchedCategory = categories.find((c) => c.id === categoryId);
    const payload: any = {
      title,
      slug: cleanSlug,
      category_id: categoryId || undefined,
      category: matchedCategory?.name || undefined,
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
      toast.error(getApiErrorMessage(err, "خطا در ذخیره مشخصات محصول"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`آیا از حذف محصول "${name}" مطمئن هستید؟`)) return;
    try {
      await adminApi.deleteProduct(id);
      toast.success("محصول با موفقیت حذف شد");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در حذف محصول"));
    }
  };


  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error("نام دسته‌بندی الزامی است");
      return;
    }
    setIsSubmittingCat(true);
    try {
      const created = await adminApi.createCategory({
        name: newCatName.trim(),
        slug: newCatSlug.trim() || undefined,
        description: newCatDesc.trim() || undefined,
      });
      toast.success(`دسته‌بندی «${created.name}» با موفقیت اضافه شد`);
      setNewCatName("");
      setNewCatSlug("");
      setNewCatDesc("");
      const updatedCats = await adminApi.getCategories();
      setCategories(updatedCats);
      if (isModalOpen) {
        setCategoryId(created.id);
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "خطا در ایجاد دسته‌بندی"));
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleStartEditCat = (cat: any) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatSlug(cat.slug);
    setEditCatDesc(cat.description || "");
  };

  const handleCancelEditCat = () => {
    setEditingCatId(null);
    setEditCatName("");
    setEditCatSlug("");
    setEditCatDesc("");
  };

  const handleSaveEditCat = async (id: string) => {
    if (!editCatName.trim()) {
      toast.error("نام دسته‌بندی الزامی است");
      return;
    }
    try {
      await adminApi.updateCategory(id, {
        name: editCatName.trim(),
        slug: editCatSlug.trim() || undefined,
        description: editCatDesc.trim() || undefined,
      });
      toast.success("دسته‌بندی با موفقیت بروزرسانی شد");
      handleCancelEditCat();
      const updatedCats = await adminApi.getCategories();
      setCategories(updatedCats);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "خطا در بروزرسانی دسته‌بندی"));
    }
  };

  const handleDeleteCat = async (id: string, name: string) => {
    if (!confirm(`آیا از حذف دسته‌بندی «${name}» اطمینان دارید؟`)) return;
    try {
      await adminApi.deleteCategory(id);
      toast.success(`دسته‌بندی «${name}» حذف شد`);
      const updatedCats = await adminApi.getCategories();
      setCategories(updatedCats);
      if (selectedCategory === id) setSelectedCategory("all");
      if (categoryId === id) setCategoryId(updatedCats[0]?.id || "");
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "خطا در حذف دسته‌بندی"));
    }
  };

  const filteredProducts = products.filter((p) => {
    const name = (p.name || p.title || "").toLowerCase();
    const matchesQuery =
      name.includes(searchQuery.toLowerCase()) ||
      (p.slug || "").includes(searchQuery.toLowerCase());
    const matchedFilterCat = categories.find((c) => c.id === selectedCategory);
    const matchesCategory =
      selectedCategory === "all" ||
      p.category === selectedCategory ||
      p.category?.name === selectedCategory ||
      p.category?.slug === selectedCategory ||
      p.category_id === selectedCategory ||
      (matchedFilterCat && (
        p.category === matchedFilterCat.name ||
        p.category === matchedFilterCat.slug ||
        p.category_id === matchedFilterCat.id ||
        p.category?.name === matchedFilterCat.name
      ));
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
            onClick={() => setIsCategoryModalOpen(true)}
            variant="outline"
            className="h-11 px-4 rounded-xl border-amber-400/20 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 font-bold text-xs flex items-center gap-2 shrink-0"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            مدیریت دسته‌بندی‌ها ({categories.length})
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
                <th className="py-4 px-4 font-bold">قیمت پایه (تومان)</th>
                <th className="py-4 px-4 font-bold">مدیریت تنوع و ویژگی‌ها</th>
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
                  const matchedCat = categories.find(
                    (c) => c.id === p.category_id || c.name === p.category || c.slug === p.category || c.id === p.category
                  );
                  const catName = matchedCat?.name || p.category?.name || p.category || "نامشخص";

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

                      {/* Variants & Options Button */}
                      <td className="py-4 px-4">
                        <Button
                          onClick={() => handleOpenVariantManager(p)}
                          variant="outline"
                          className="h-8 px-3 rounded-xl border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 font-bold text-[11px] flex items-center gap-1.5"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          ویژگی‌ها و تنوع‌ها
                        </Button>
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
                          {p.status === "published" || p.status === "active"
                            ? "منتشر شده"
                            : "پیش‌نویس / غیرفعال"}
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
                            title="ویرایش محصول"
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

      {/* --- Options & Variants Manager Modal --- */}
      <Dialog open={isVariantModalOpen} onOpenChange={setIsVariantModalOpen}>
        <DialogContent
          className="bg-[#0f0f0f] border border-white/10 text-white sm:max-w-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-black flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Boxes className="w-6 h-6 text-purple-400" />
                مدیریت ویژگی‌ها و تنوع‌های کالای «{selectedProductForVariants?.name || selectedProductForVariants?.title}»
              </span>
            </DialogTitle>
          </DialogHeader>

          {isLoadingVariants ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <span>در حال دریافت ویژگی‌ها و تنوع‌های کالا...</span>
            </div>
          ) : (
            <div className="space-y-8 mt-6">
              {/* Section 1: Define Options (e.g. Color, Size) */}
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-400" />
                      ۱. ویژگی‌های محصول (رنگ، سایز، جنس و...)
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      ویژگی‌ها و مقادیر قابل انتخاب توسط خریدار را تعریف کنید
                    </p>
                  </div>
                </div>

                {/* Add New Option Input */}
                <form onSubmit={handleAddProductOption} className="flex gap-2">
                  <Input
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    placeholder="نام ویژگی جدید (مثال: رنگ، سایز، متریال)..."
                    className="bg-[#1a1a1a] border-white/10 h-10 text-xs text-white rounded-xl"
                  />
                  <Button
                    type="submit"
                    className="h-10 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shrink-0"
                  >
                    افزودن ویژگی
                  </Button>
                </form>

                {/* Current Options List & Values */}
                <div className="space-y-4 pt-2">
                  {productOptions.length === 0 ? (
                    <p className="text-xs text-gray-500 py-3 text-center">
                      هنوز ویژگی‌ای برای این محصول تعریف نشده است.
                    </p>
                  ) : (
                    productOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-xs font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            {opt.name}
                          </span>
                          <button
                            onClick={() => handleDeleteProductOption(opt.id)}
                            className="text-gray-500 hover:text-rose-400 text-xs"
                            title="حذف ویژگی"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Values Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                          {opt.values?.map((v: any) => (
                            <span
                              key={v.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white"
                            >
                              <span>{v.value}</span>
                              <button
                                onClick={() => handleDeleteOptionValue(opt.id, v.id)}
                                className="text-gray-400 hover:text-rose-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}

                          {/* Add Value Inline Input */}
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newValueInputs[opt.id] || ""}
                              onChange={(e) =>
                                setNewValueInputs((prev) => ({
                                  ...prev,
                                  [opt.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddOptionValue(opt.id);
                                }
                              }}
                              placeholder="+ مقدار جدید (مثال: قرمز)..."
                              className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-gray-600 outline-none w-36"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddOptionValue(opt.id)}
                              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Section 2: Create & Manage Variants */}
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-emerald-400" />
                    ۲. تنوع‌ها و انبار کالاهای محصول ({productVariants.length} مورد)
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    تنوع‌های ترکیبی با کد انبار (SKU)، قیمت اختصاصی و موجودی را ثبت کنید
                  </p>
                </div>

                {/* Add Variant Form */}
                <form
                  onSubmit={handleCreateRealVariant}
                  className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 space-y-4"
                >
                  <span className="text-xs font-bold text-gray-300 block">ثبت تنوع جدید:</span>

                  {/* Options selection dropdowns */}
                  {productOptions.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {productOptions.map((opt) => (
                        <div key={opt.id} className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-bold">{opt.name}</label>
                          <select
                            value={selectedOptionValueIds[opt.id] || ""}
                            onChange={(e) =>
                              setSelectedOptionValueIds((prev) => ({
                                ...prev,
                                [opt.id]: e.target.value,
                              }))
                            }
                            required
                            className="w-full bg-black/60 border border-white/10 rounded-lg h-9 px-2 text-xs text-white outline-none"
                          >
                            <option value="">انتخاب {opt.name}...</option>
                            {opt.values?.map((v: any) => (
                              <option key={v.id} value={v.id}>
                                {v.value}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold">کد انبار (SKU)</label>
                      <Input
                        value={newVariantSku}
                        onChange={(e) => setNewVariantSku(e.target.value)}
                        placeholder="SKU-101"
                        required
                        className="bg-black/60 border-white/10 h-9 text-xs text-white rounded-lg font-mono text-left"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold">قیمت تنوع (تومان)</label>
                      <Input
                        type="number"
                        value={newVariantPrice}
                        onChange={(e) => setNewVariantPrice(e.target.value)}
                        placeholder="1200000"
                        required
                        className="bg-black/60 border-white/10 h-9 text-xs text-white rounded-lg"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold">موجودی اولیه انبار</label>
                      <Input
                        type="number"
                        value={newVariantStock}
                        onChange={(e) => setNewVariantStock(e.target.value)}
                        placeholder="10"
                        className="bg-black/60 border-white/10 h-9 text-xs text-white rounded-lg"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    افزودن تنوع به انبار
                  </Button>
                </form>

                {/* Existing Variants Table */}
                <div className="space-y-2 pt-2">
                  {productVariants.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">
                      هیچ تنوع فعالی برای این محصول ثبت نشده است.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {productVariants.map((v) => {
                        const optSummary =
                          v.options?.map((o: any) => `${o.option_name}: ${o.value}`).join(" | ") ||
                          "تنوع عمومی";
                        return (
                          <div
                            key={v.id}
                            className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-xs"
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-white block">{optSummary}</span>
                              <span className="text-[10px] text-gray-500 font-mono" dir="ltr">
                                SKU: {v.sku}
                              </span>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="font-black text-amber-400">
                                {Number(v.price).toLocaleString("fa-IR")} تومان
                              </span>
                              <button
                                onClick={() => handleDeleteVariant(v.id)}
                                className="p-1.5 text-gray-500 hover:text-rose-400 transition-colors"
                                title="حذف تنوع"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="bg-[#0f0f0f] border border-white/10 text-white sm:max-w-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300">دسته‌بندی</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    مدیریت دسته‌بندی
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 h-11 text-xs text-white rounded-xl px-3 outline-none focus:border-amber-400/50"
                  required
                >
                  <option value="">انتخاب دسته‌بندی...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
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

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-black text-xs"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : editingProduct ? (
                  "ذخیره تغییرات محصول"
                ) : (
                  "افزودن و انتشار محصول"
                )}
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

      {/* --- Category Management Modal --- */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent
          className="bg-[#0f0f0f] border border-white/10 text-white sm:max-w-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Layers className="w-6 h-6 text-amber-400" />
              مدیریت دسته‌بندی‌های کاتالوگ ({categories.length})
            </DialogTitle>
            <p className="text-xs text-gray-400 mt-1">
              مشاهده، افزودن، ویرایش و حذف دسته‌بندی‌های لباس و اکسسوری فروشگاه
            </p>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Create New Category Form */}
            <form onSubmit={handleAddCategory} className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                افزودن دسته‌بندی جدید
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">نام فارسی دسته‌بندی *</label>
                  <Input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="مثال: شومیز و بلوز مجلسی"
                    required
                    className="bg-[#1a1a1a] border-white/10 h-10 text-xs text-white rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">نامک انگلیسی (Slug اختیاری)</label>
                  <Input
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    placeholder="blouses-and-shirts"
                    className="bg-[#1a1a1a] border-white/10 h-10 text-xs text-white rounded-xl font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-300">توضیحات کوتاه (اختیاری)</label>
                <Input
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="توضیحات کوتاه جهت نمایش در هدر کالکشن یا نتایج جستجو..."
                  className="bg-[#1a1a1a] border-white/10 h-10 text-xs text-white rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmittingCat}
                className="w-full sm:w-auto h-10 px-6 rounded-xl bg-amber-400 text-black hover:bg-amber-300 font-black text-xs flex items-center gap-2"
              >
                {isSubmittingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                افزودن دسته‌بندی
              </Button>
            </form>

            {/* Existing Categories List */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  دسته‌بندی‌های موجود در سیستم
                </h3>
                <span className="text-xs text-gray-400">{categories.length} دسته‌بندی</span>
              </div>

              <div className="divide-y divide-white/5 max-h-72 overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const isEditing = editingCatId === cat.id;
                  const catProductCount = products.filter(
                    (p) =>
                      p.category_id === cat.id ||
                      p.category === cat.name ||
                      p.category === cat.slug ||
                      p.category?.id === cat.id ||
                      p.category?.name === cat.name
                  ).length;

                  return (
                    <div key={cat.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {isEditing ? (
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            placeholder="نام دسته‌بندی..."
                            className="bg-[#222] border-white/20 h-9 text-xs text-white rounded-lg"
                          />
                          <Input
                            value={editCatSlug}
                            onChange={(e) => setEditCatSlug(e.target.value)}
                            placeholder="slug..."
                            className="bg-[#222] border-white/20 h-9 text-xs text-white rounded-lg font-mono"
                            dir="ltr"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="font-bold text-white text-xs">{cat.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono" dir="ltr">
                              {cat.slug}
                            </span>
                          </div>
                          {cat.description ? (
                            <p className="text-[11px] text-gray-400 line-clamp-1">{cat.description}</p>
                          ) : null}
                        </div>
                      )}

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <span className="text-[11px] text-gray-500 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          {catProductCount} محصول
                        </span>

                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEditCat(cat.id)}
                              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                              title="ذخیره"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditCat}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                              title="انصراف"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEditCat(cat)}
                              className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
                              title="ویرایش دسته‌بندی"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCat(cat.id, cat.name)}
                              className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                              title="حذف دسته‌بندی"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

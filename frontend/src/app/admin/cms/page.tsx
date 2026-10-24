"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Save,
  Globe,
  Sparkles,
  ExternalLink,
  Layers,
  Megaphone,
  LayoutTemplate,
  PhoneCall,
  Search,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sliders,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { adminApi, CMSPage, HeroSlideData } from "@/lib/admin-api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { formatShamsiDate } from "@/lib/jalali";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import MediaUploader from "@/components/admin/media-uploader";

export default function AdminCMSPage() {

  const [activeTab, setActiveTab] = useState("site-content");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);

  // Pages state
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);

  // Page Form State
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageStatus, setPageStatus] = useState<"draft" | "published">("published");
  const [pageMetaTitle, setPageMetaTitle] = useState("");
  const [pageMetaDesc, setPageMetaDesc] = useState("");
  const [pageBlocks, setPageBlocks] = useState<Array<{ heading: string; body: string }>>([
    { heading: "مقدمه", body: "" },
  ]);

  // Site Content States
  const [announcement, setAnnouncement] = useState({
    enabled: true,
    badge: "جشنواره",
    text: "ارسال رایگان برای تمام سفارش‌های بالای ۷۰۰ هزار تومان به سراسر کشور",
    link: "/women",
  });

  const [heroSlides, setHeroSlides] = useState<HeroSlideData[]>([
    {
      id: "slide-1",
      title: "استایل لوکس و مینیمال برای زندگی مدرن",
      subtitle: "طراحی‌های اختصاصی و دوخت باکیفیت برای درخشش شما در هر موقعیت",
      badge: "کالکشن جدید ۲۰۲۶",
      cta_label: "مشاهده جدیدترین‌ها",
      cta_link: "/products",
      image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop",
    },
    {
      id: "slide-2",
      title: "کالکشن شیک و بهاره ماوی",
      subtitle: "ترکیب اصالت و مینیمالیسم مدرن با پارچه‌های فوق‌العاده باکیفیت و تن‌خور عالی",
      badge: "استایل برتر فصل",
      cta_label: "مشاهده کالکشن بهاره",
      cta_link: "/collections/spring-2026",
      image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop",
    },
    {
      id: "slide-3",
      title: "استایل مینیمال و پرفروش",
      subtitle: "ظرافت در جزئیات، راحتی در هر حرکت و طراحی بدون تاریخ انقضا برای خاص‌پسندان",
      badge: "منتخب استایلیست‌ها",
      cta_label: "خرید پرفروش‌ترین‌ها",
      cta_link: "/collections/best-sellers",
      image_url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600&auto=format&fit=crop",
    },
  ]);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);

  const [footerInfo, setFooterInfo] = useState({
    description: "فروشگاه تخصصی پوشاک مد و فشن با تمرکز بر کیفیت برتر، طراحی مدرن و ارسال سریع.",
    phone: "۰۲۱-۸۸۸۸۷۷۶۶",
    email: "info@fashionstore.com",
    address: "تهران، خیابان ولیعصر، برج مد و تجارت، طبقه ۵",
    working_hours: "شنبه تا پنج‌شنبه: ۹ صبح الی ۹ شب",
  });

  // Discount Campaign & Storefront Banner State
  const [discountSection, setDiscountSection] = useState({
    enabled: false,
    title: "جشنواره تخفیفات استثنایی ماوی",
    subtitle: "تخفیف‌های ویژه بر روی برترین استایل‌های این فصل",
    cta_text: "مشاهده محصولات جشنواره",
    cta_link: "/products?has_discount=true",
    background_image: "",
    collection_slug: "",
    expires_at: "",
  });
  const [productsList, setProductsList] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [campaignPercent, setCampaignPercent] = useState<number>(25);
  const [campaignExpiresAt, setCampaignExpiresAt] = useState<string>("");
  const [productSearch, setProductSearch] = useState<string>("");
  const [isCampaignLoading, setIsCampaignLoading] = useState(false);

  // Homepage Blog Section CMS State
  const [blogSection, setBlogSection] = useState({
    enabled: true,
    titles: {
      fa: "آخرین مقالات و مجله مد",
      en: "Latest Journal Articles",
      ar: "آخر المقالات ومجلة الموضة",
    },
    max_items: 3,
  });

  useEffect(() => {
    loadAllCmsData();
  }, []);

  const loadAllCmsData = async () => {
    setIsLoading(true);
    try {
      const [pagesData, announceData, heroData, footerData, discountData, productsData, blogSecData] = await Promise.allSettled([
        adminApi.getPages(),
        adminApi.getSiteContent("announcement"),
        adminApi.getSiteContent("hero"),
        adminApi.getSiteContent("footer"),
        adminApi.getSiteContent("discount_section"),
        adminApi.getProducts(),
        adminApi.getSiteContent("homepage_blog_section"),
      ]);

      if (pagesData.status === "fulfilled") {
        setPages(pagesData.value);
      }
      if (blogSecData.status === "fulfilled" && blogSecData.value) {
        setBlogSection((prev) => ({
          ...prev,
          ...blogSecData.value,
          titles: { ...prev.titles, ...(blogSecData.value.titles || {}) },
        }));
      }
      if (announceData.status === "fulfilled" && announceData.value) {
        setAnnouncement((prev) => ({ ...prev, ...announceData.value }));
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("fashion_announcement", JSON.stringify(announceData.value));
          } catch {}
        }
      }
      if (heroData.status === "fulfilled" && heroData.value) {
        const val = heroData.value;
        if (val.slides && Array.isArray(val.slides) && val.slides.length > 0) {
          setHeroSlides(val.slides);
        } else if (val.image_url) {
          setHeroSlides([
            {
              id: "hero-slide-1",
              title: val.headline || val.title || "استایل لوکس و مینیمال برای زندگی مدرن",
              subtitle: val.subtitle || "طراحی‌های اختصاصی و دوخت باکیفیت برای درخشش شما در هر موقعیت",
              badge: val.badge || "کالکشن جدید ۲۰۲۶",
              cta_label: val.cta_label || "مشاهده جدیدترین‌ها",
              cta_link: val.cta_link || "/products",
              image_url: val.image_url,
            },
          ]);
        }
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("fashion_hero_content", JSON.stringify(heroData.value));
          } catch {}
        }
      }
      if (footerData.status === "fulfilled" && footerData.value) {
        setFooterInfo((prev) => ({ ...prev, ...footerData.value }));
      }
      if (discountData.status === "fulfilled" && discountData.value) {
        const sec = discountData.value;
        setDiscountSection((prev) => ({ ...prev, ...sec }));
        if (sec.expires_at) {
          setCampaignExpiresAt(sec.expires_at.slice(0, 16));
        }
      }
      if (productsData.status === "fulfilled" && productsData.value) {
        const val = productsData.value as any;
        const prods = Array.isArray(val) ? val : (val.results || []);
        setProductsList(prods);
        // Pre-select products that currently have discount
        const discounted = prods.filter((p: any) => p.discount_percent || p.is_discount_active).map((p: any) => p.id);
        if (discounted.length > 0) {
          setSelectedProductIds(discounted);
        }
      }
    } catch (e) {
      console.error("Error loading CMS data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Site Content Savers ---
  const saveAnnouncement = async () => {
    setIsLoading(true);
    try {
      await adminApi.updateSiteContent("announcement", announcement);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("fashion_announcement", JSON.stringify(announcement));
        } catch {}
      }
      toast.success("تنظیمات نوار اطلاعیه با موفقیت ذخیره شد");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error?.message || "خطا در ذخیره نوار اطلاعیه. اطمینان حاصل کنید با حساب ادمین وارد شده‌اید.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlide = () => {
    const newSlide: HeroSlideData = {
      id: `slide-${Date.now()}`,
      title: "عنوان اسلاید جدید",
      subtitle: "توضیحات کوتاه یا ترغیب‌کننده برای این اسلاید",
      badge: "پیشنهاد ویژه",
      cta_label: "مشاهده و خرید",
      cta_link: "/products",
      image_url: "",
    };
    const updated = [...heroSlides, newSlide];
    setHeroSlides(updated);
    setPreviewSlideIndex(updated.length - 1);
    toast.info("اسلاید جدید ایجاد شد. لطفاً تصویر و مشخصات آن را تنظیم کنید.");
  };

  const handleUpdateSlide = (index: number, field: keyof HeroSlideData, value: string) => {
    setHeroSlides((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleMoveSlide = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= heroSlides.length) return;
    const copy = [...heroSlides];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setHeroSlides(copy);
    setPreviewSlideIndex(targetIndex);
  };

  const handleDeleteSlide = (index: number) => {
    if (heroSlides.length <= 1) {
      toast.error("حداقل یک اسلاید برای اسلایدر صفحه نخست باید باقی بماند.");
      return;
    }
    const copy = heroSlides.filter((_, i) => i !== index);
    setHeroSlides(copy);
    if (previewSlideIndex >= copy.length) {
      setPreviewSlideIndex(Math.max(0, copy.length - 1));
    }
    toast.success("اسلاید با موفقیت حذف شد");
  };

  const saveHeroSlides = async () => {
    if (heroSlides.length === 0) {
      toast.error("حداقل یک اسلاید برای اسلایدر اصلی الزامی است.");
      return;
    }

    for (let i = 0; i < heroSlides.length; i++) {
      const s = heroSlides[i];
      if (!s.image_url && !(s as any).image) {
        toast.error(`تصویر اسلاید شماره ${i + 1} الزامی است. لطفاً فایل تصویر افقی بارگذاری کنید یا لینک CDN معتبر وارد نمایید.`);
        setPreviewSlideIndex(i);
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        slides: heroSlides,
        // Top-level fallbacks for backwards compatibility
        headline: heroSlides[0]?.title || "",
        subtitle: heroSlides[0]?.subtitle || "",
        badge: heroSlides[0]?.badge || "",
        cta_label: heroSlides[0]?.cta_label || "",
        cta_link: heroSlides[0]?.cta_link || "",
        image_url: heroSlides[0]?.image_url || "",
      };
      await adminApi.updateSiteContent("hero", payload);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("fashion_hero_content", JSON.stringify(payload));
        } catch {}
      }
      toast.success("تنظیمات اسلایدر بنرهای صفحه نخست با موفقیت ذخیره شد");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error?.message || "خطا در ذخیره اسلایدر بنرها. اطمینان حاصل کنید با حساب ادمین وارد شده‌اید.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFooterInfo = async () => {
    setIsLoading(true);
    try {
      await adminApi.updateSiteContent("footer", footerInfo);
      toast.success("اطلاعات تماس و فوتر با موفقیت ذخیره شد");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error?.message || "خطا در ذخیره اطلاعات فوتر. اطمینان حاصل کنید با حساب ادمین وارد شده‌اید.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBlogSection = async () => {
    setIsLoading(true);
    try {
      await adminApi.updateSiteContent("homepage_blog_section", blogSection);
      toast.success("تنظیمات بخش مقالات صفحه اصلی با موفقیت ذخیره شد");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error?.message || "خطا در ذخیره تنظیمات بخش مقالات صفحه اصلی.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Discount Campaign Handlers ---
  const handleActivateCampaign = async () => {
    if (selectedProductIds.length === 0) {
      toast.error("لطفاً حداقل یک محصول را برای شرکت در کمپین تخفیف انتخاب کنید.");
      return;
    }
    if (campaignPercent < 1 || campaignPercent > 99) {
      toast.error("درصد تخفیف باید بین ۱ تا ۹۹ درصد باشد.");
      return;
    }

    setIsCampaignLoading(true);
    try {
      const payload: any = {
        product_ids: selectedProductIds,
        discount_percent: Number(campaignPercent),
        title: discountSection.title,
        subtitle: discountSection.subtitle,
        cta_text: discountSection.cta_text,
        background_image: discountSection.background_image,
        collection_slug: discountSection.collection_slug || undefined,
      };
      if (campaignExpiresAt) {
        payload.expires_at = new Date(campaignExpiresAt).toISOString();
      }

      const res = await adminApi.activateDiscountCampaign(payload);
      setDiscountSection((prev) => ({
        ...prev,
        enabled: true,
        expires_at: res.expires_at || campaignExpiresAt,
      }));
      toast.success(res.message || `کمپین تخفیف ${campaignPercent}٪ روی ${selectedProductIds.length} محصول با موفقیت فعال شد.`);
      await loadAllCmsData();
    } catch (e: any) {
      toast.error(getApiErrorMessage(e, "خطا در فعال‌سازی کمپین تخفیفات"));
    } finally {
      setIsCampaignLoading(false);
    }
  };

  const handleDeactivateCampaign = async () => {
    setIsCampaignLoading(true);
    try {
      const res = await adminApi.deactivateDiscountCampaign();
      setDiscountSection((prev) => ({ ...prev, enabled: false }));
      toast.success(res.message || "کمپین تخفیفات غیرفعال شد و تمامی قیمت‌ها به حالت اولیه بازگشتند.");
      await loadAllCmsData();
    } catch (e: any) {
      toast.error(getApiErrorMessage(e, "خطا در غیرفعال‌سازی کمپین تخفیفات"));
    } finally {
      setIsCampaignLoading(false);
    }
  };

  const handleSaveCampaignBanner = async () => {
    setIsCampaignLoading(true);
    try {
      await adminApi.updateDiscountCampaignContent({
        title: discountSection.title,
        subtitle: discountSection.subtitle,
        cta_text: discountSection.cta_text,
        background_image: discountSection.background_image,
        collection_slug: discountSection.collection_slug || undefined,
      });
      toast.success("تنظیمات متن و تصویر بنر فروش ویژه ذخیره شد.");
    } catch (e: any) {
      toast.error(getApiErrorMessage(e, "خطا در بروزرسانی بنر فروش ویژه"));
    } finally {
      setIsCampaignLoading(false);
    }
  };

  // --- Page Handlers ---
  const handleOpenCreatePage = () => {
    setEditingPage(null);
    setPageTitle("");
    setPageSlug("");
    setPageStatus("published");
    setPageMetaTitle("");
    setPageMetaDesc("");
    setPageBlocks([{ heading: "توضیحات اصلی", body: "" }]);
    setIsPageModalOpen(true);
  };

  const handleOpenEditPage = (page: CMSPage) => {
    setEditingPage(page);
    setPageTitle(page.title || "");
    setPageSlug(page.slug || "");
    setPageStatus(page.status || "draft");
    setPageMetaTitle(page.seo_metadata?.meta_title || "");
    setPageMetaDesc(page.seo_metadata?.meta_description || "");
    if (page.content && Array.isArray(page.content) && page.content.length > 0) {
      setPageBlocks(
        page.content.map((b) => ({
          heading: b.heading || "",
          body: b.body || "",
        }))
      );
    } else {
      setPageBlocks([{ heading: "توضیحات اصلی", body: "" }]);
    }
    setIsPageModalOpen(true);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageTitle.trim() || !pageSlug.trim()) {
      toast.error("عنوان و شناسه لینک (Slug) الزامی است");
      return;
    }

    setIsLoading(true);
    const pageData: Partial<CMSPage> = {
      title: pageTitle,
      slug: pageSlug.trim().toLowerCase().replace(/\s+/g, "-"),
      status: pageStatus,
      seo_metadata: {
        meta_title: pageMetaTitle || pageTitle,
        meta_description: pageMetaDesc,
      },
      content: pageBlocks,
    };

    try {
      if (editingPage) {
        await adminApi.updatePage(editingPage.slug, pageData);
        toast.success("برگه با موفقیت بروزرسانی شد");
      } else {
        await adminApi.createPage(pageData);
        toast.success("برگه جدید با موفقیت ساخته شد");
      }
      setIsPageModalOpen(false);
      loadAllCmsData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "خطا در ذخیره برگه";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePage = (slug: string) => {
    setDeleteConfirmSlug(slug);
  };

  const executeDeletePage = async () => {
    if (!deleteConfirmSlug) return;
    const slug = deleteConfirmSlug;
    try {
      await adminApi.deletePage(slug);
      toast.success("برگه با موفقیت حذف شد");
      setPages((prev) => prev.filter((p) => p.slug !== slug));
    } catch {
      toast.error("خطا در حذف برگه");
    }
  };

  const handleTogglePublish = async (page: CMSPage) => {
    const newStatus = page.status === "published" ? "draft" : "published";
    try {
      if (newStatus === "published") {
        await adminApi.publishPage(page.slug);
      } else {
        await adminApi.updatePage(page.slug, { status: "draft" });
      }
      toast.success(newStatus === "published" ? "برگه منتشر شد" : "برگه به پیش‌نویس تبدیل شد");
      setPages((prev) =>
        prev.map((p) => (p.slug === page.slug ? { ...p, status: newStatus } : p))
      );
    } catch {
      toast.error("خطا در تغییر وضعیت برگه");
    }
  };

  const filteredPages = pages.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-400" />
            سیستم مدیریت محتوا (CMS)
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            ویرایش بنرها، نوار اطلاعیه، فوتر و ساخت برگه‌های نامحدود بدون نیاز به دانش کدنویسی
          </p>
        </div>

        {activeTab === "pages" && (
          <Button
            onClick={handleOpenCreatePage}
            className="h-11 px-5 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center gap-2 shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4" />
            ساخت برگه جدید
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="w-full">
        <TabsList className="bg-[#111111] border border-white/10 p-1.5 rounded-2xl mb-8 flex w-max gap-2">
          <TabsTrigger
            value="site-content"
            className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 font-bold text-xs md:text-sm transition-all flex items-center gap-2"
          >
            <LayoutTemplate className="w-4 h-4" />
            بنرها و بخش‌های اصلی سایت
          </TabsTrigger>
          <TabsTrigger
            value="pages"
            className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 font-bold text-xs md:text-sm transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            برگه‌های مستقل ({pages.length})
          </TabsTrigger>
          <TabsTrigger
            value="discount-campaign"
            className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 font-bold text-xs md:text-sm transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            کمپین تخفیفات و بنر فروش ویژه
          </TabsTrigger>
        </TabsList>

        {/* --- Tab 1: Site Content (Banners & Notices) --- */}
        <TabsContent value="site-content" className="space-y-8 outline-none mt-0">
          {/* Section 1: Announcement Bar */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">نوار اطلاعیه بالای سایت</h3>
                  <p className="text-xs text-gray-400">نمایش پیام‌های تخفیف، ارسال رایگان یا اخبار فوری به تمام کاربران</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAnnouncement({ ...announcement, enabled: !announcement.enabled })}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                  announcement.enabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-sm"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${announcement.enabled ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                <span>{announcement.enabled ? "نوار اطلاعیه فعال است" : "نوار اطلاعیه غیرفعال است"}</span>
              </button>
            </div>

            {/* Live Preview Box */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                پیش‌نمایش زنده در سایت:
              </span>
              <div className="p-3 rounded-xl bg-[#1a1a1a] border border-white/10 text-center text-xs flex items-center justify-center gap-2">
                {announcement.badge && (
                  <span className="bg-amber-400 text-[#0B192C] text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-amber-400/20">
                    <Sparkles className="w-3 h-3 text-[#0082CA] fill-[#0082CA]/20 shrink-0" />
                    {announcement.badge}
                  </span>
                )}
                <span className="text-gray-200">{announcement.text || "متن اطلاعیه"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">عنوان نشان (Badge)</label>
                <Input
                  value={announcement.badge}
                  onChange={(e) => setAnnouncement({ ...announcement, badge: e.target.value })}
                  placeholder="مثال: فروش ویژه"
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-medium text-gray-300">متن پیام اطلاعیه</label>
                <Input
                  value={announcement.text}
                  onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                  placeholder="متن پیام بالای سایت..."
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">لینک هدف کلیک</label>
              <Input
                value={announcement.link}
                onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })}
                placeholder="/women یا https://..."
                className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                dir="ltr"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={saveAnnouncement}
                disabled={isLoading}
                className="h-11 px-6 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                ذخیره تغییرات اطلاعیه
              </Button>
            </div>
          </div>

          {/* Section 2: Hero Banner Slider */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                    اسلایدر و بنرهای صفحه نخست
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                      {heroSlides.length} اسلاید
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    مدیریت اسلایدهای متحرک بالای سایت با امکان آپلود تصویر افقی (۱۶:۹) یا درج لینک CDN
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddSlide}
                className="h-10 px-4 rounded-xl bg-[#0082CA] hover:bg-[#0072b2] text-white text-xs font-bold flex items-center gap-2 self-start md:self-auto cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                افزودن اسلاید جدید
              </Button>
            </div>

            {/* Live Preview Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#0082CA]" />
                  پیش‌نمایش زنده اسلاید {previewSlideIndex + 1} از {heroSlides.length}:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewSlideIndex((prev) => (prev > 0 ? prev - 1 : heroSlides.length - 1))}
                    className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="اسلاید قبلی"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] text-gray-400 font-mono px-1">
                    {previewSlideIndex + 1} / {heroSlides.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewSlideIndex((prev) => (prev < heroSlides.length - 1 ? prev + 1 : 0))}
                    className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="اسلاید بعدی"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {heroSlides[previewSlideIndex] && (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] min-h-[220px] md:min-h-[260px] p-6 md:p-8 flex flex-col justify-end">
                  {heroSlides[previewSlideIndex].image_url ? (
                    <img
                      src={heroSlides[previewSlideIndex].image_url}
                      alt={heroSlides[previewSlideIndex].title || "Banner preview"}
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 bg-white/[0.02]">
                      تصویر برای این اسلاید تنظیم نشده است
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

                  <div className="relative z-10 space-y-2 max-w-xl">
                    {heroSlides[previewSlideIndex].badge && (
                      <span className="inline-block bg-[#0082CA]/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {heroSlides[previewSlideIndex].badge}
                      </span>
                    )}
                    <h4 className="text-lg md:text-2xl font-black text-white">
                      {heroSlides[previewSlideIndex].title || "تیتر اسلاید"}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-300 line-clamp-2">
                      {heroSlides[previewSlideIndex].subtitle || "توضیحات اسلاید..."}
                    </p>
                    {heroSlides[previewSlideIndex].cta_label && (
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 bg-white text-black font-bold text-xs px-4 py-2 rounded-xl shadow-lg">
                          {heroSlides[previewSlideIndex].cta_label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Indicators */}
                  <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1.5">
                    {heroSlides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewSlideIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === previewSlideIndex ? "w-6 bg-[#0082CA]" : "w-1.5 bg-white/40 hover:bg-white/70"
                        }`}
                        title={`رفتن به اسلاید ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Slide Configuration Cards */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0082CA]" />
                فهرست و ویرایش اسلایدها:
              </h4>

              {heroSlides.map((slide, index) => (
                <div
                  key={slide.id || index}
                  className={`bg-[#0a0a0a] border rounded-2xl p-5 md:p-6 transition-all space-y-4 ${
                    previewSlideIndex === index ? "border-[#0082CA]/60 shadow-lg shadow-[#0082CA]/5" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Slide Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {slide.title ? (slide.title.length > 35 ? `${slide.title.slice(0, 35)}...` : slide.title) : `اسلاید شماره ${index + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewSlideIndex(index)}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                          previewSlideIndex === index
                            ? "bg-[#0082CA] text-white"
                            : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {previewSlideIndex === index ? "در حال پیش‌نمایش" : "مشاهده در پیش‌نمایش"}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="انتقال به بالا (اسلاید قبلی)"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(index, 1)}
                        disabled={index === heroSlides.length - 1}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="انتقال به پایین (اسلاید بعدی)"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(index)}
                        disabled={heroSlides.length <= 1}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors mr-1"
                        title="حذف این اسلاید"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Slide Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300">تیتر اصلی اسلاید</label>
                      <Input
                        value={slide.title}
                        onChange={(e) => handleUpdateSlide(index, "title", e.target.value)}
                        placeholder="استایل لوکس و مینیمال..."
                        className="bg-[#111111] border-white/10 h-11 text-white text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300">برچسب کوچک بالای تیتر (Badge)</label>
                      <Input
                        value={slide.badge || ""}
                        onChange={(e) => handleUpdateSlide(index, "badge", e.target.value)}
                        placeholder="مثال: کالکشن جدید ۲۰۲۶"
                        className="bg-[#111111] border-white/10 h-11 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-300">متن توضیحات اسلاید</label>
                    <Input
                      value={slide.subtitle}
                      onChange={(e) => handleUpdateSlide(index, "subtitle", e.target.value)}
                      placeholder="توضیحات تکمیلی یا پیام ترغیب‌کننده..."
                      className="bg-[#111111] border-white/10 h-11 text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300">متن روی دکمه (CTA)</label>
                      <Input
                        value={slide.cta_label}
                        onChange={(e) => handleUpdateSlide(index, "cta_label", e.target.value)}
                        placeholder="مشاهده محصولات"
                        className="bg-[#111111] border-white/10 h-11 text-white text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300">لینک مقصد کلیک دکمه</label>
                      <Input
                        value={slide.cta_link}
                        onChange={(e) => handleUpdateSlide(index, "cta_link", e.target.value)}
                        placeholder="/products یا /collections/spring"
                        className="bg-[#111111] border-white/10 h-11 text-white text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Media Uploader for this Slide */}
                  <div>
                    <MediaUploader
                      value={slide.image_url || (slide as any).image || ""}
                      onChange={(url) => handleUpdateSlide(index, "image_url", url)}
                      label={`تصویر بنر اسلاید شماره ${index + 1} (الزاماً افقی - نسبت ۱۶:۹)`}
                      aspectRatio="banner"
                      requiredLandscape={true}
                      helperText="تصویر باید افقی (Landscape) باشد. تصاویر عمودی یا مربعی به عنوان بنر پذیرفته نمی‌شوند."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={saveHeroSlides}
                disabled={isLoading}
                className="h-11 px-6 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" />
                ذخیره تغییرات اسلایدر بنرها
              </Button>
            </div>
          </div>

          {/* Section 3: Footer & Contact Info */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-white">اطلاعات تماس و فوتر فروشگاه</h3>
                <p className="text-xs text-gray-400">تلفن پشتیبانی، نشانی و ساعات کاری نمایش داده شده در انتهای سایت</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">تلفن پشتیبانی</label>
                <Input
                  value={footerInfo.phone}
                  onChange={(e) => setFooterInfo({ ...footerInfo, phone: e.target.value })}
                  placeholder="۰۲۱-۸۸۸۸..."
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">ایمیل تماس</label>
                <Input
                  value={footerInfo.email}
                  onChange={(e) => setFooterInfo({ ...footerInfo, email: e.target.value })}
                  placeholder="info@fashionstore.com"
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">آدرس فیزیکی فروشگاه یا دفتر مرکزی</label>
                <Input
                  value={footerInfo.address}
                  onChange={(e) => setFooterInfo({ ...footerInfo, address: e.target.value })}
                  placeholder="تهران، خیابان..."
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">ساعات پاسخگویی پشتیبانی</label>
                <Input
                  value={footerInfo.working_hours}
                  onChange={(e) => setFooterInfo({ ...footerInfo, working_hours: e.target.value })}
                  placeholder="شنبه تا پنج‌شنبه ۹ الی ۲۱"
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={saveFooterInfo}
                disabled={isLoading}
                className="h-11 px-6 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                ذخیره اطلاعات فوتر
              </Button>
            </div>
          </div>

          {/* Section 4: Homepage Blog / Journal Section */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[#0082CA] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">بخش مقالات و مجله مد در صفحه اصلی</h3>
                  <p className="text-xs text-gray-400">کنترل نمایش آخرین مقالات وبلاگ، عناوین چندزبانه و تعداد موارد در صفحه نخست</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin/blog"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 text-xs font-bold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>مدیریت مقالات</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setBlogSection({ ...blogSection, enabled: !blogSection.enabled })}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                    blogSection.enabled
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-sm"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${blogSection.enabled ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                  <span>{blogSection.enabled ? "بخش وبلاگ فعال است" : "بخش وبلاگ غیرفعال است"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">عنوان بخش (فارسی)</label>
                <Input
                  value={blogSection.titles?.fa || ""}
                  onChange={(e) =>
                    setBlogSection({
                      ...blogSection,
                      titles: { ...blogSection.titles, fa: e.target.value },
                    })
                  }
                  placeholder="آخرین مقالات و مجله مد"
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">عنوان بخش (انگلیسی - English)</label>
                <Input
                  value={blogSection.titles?.en || ""}
                  onChange={(e) =>
                    setBlogSection({
                      ...blogSection,
                      titles: { ...blogSection.titles, en: e.target.value },
                    })
                  }
                  placeholder="Latest Journal Articles"
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">عنوان بخش (عربی - العربية)</label>
                <Input
                  value={blogSection.titles?.ar || ""}
                  onChange={(e) =>
                    setBlogSection({
                      ...blogSection,
                      titles: { ...blogSection.titles, ar: e.target.value },
                    })
                  }
                  placeholder="آخر المقالات ومجلة الموضة"
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">حداکثر تعداد مقالات نمایشی در صفحه اصلی</label>
                <select
                  value={blogSection.max_items || 3}
                  onChange={(e) =>
                    setBlogSection({
                      ...blogSection,
                      max_items: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#0a0a0a] border border-white/10 h-11 rounded-xl px-3 text-white text-xs outline-none focus:ring-1 focus:ring-[#0082CA]"
                >
                  <option value={2}>۲ مقاله</option>
                  <option value={3}>۳ مقاله (پیش‌فرض)</option>
                  <option value={4}>۴ مقاله</option>
                  <option value={6}>۶ مقاله</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">وضعیت محتوای مجله</label>
                <div className="p-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-xs text-gray-400 flex items-center justify-between h-11">
                  <span>مقالات به‌صورت خودکار بر اساس جدیدترین موارد منتشر شده لود می‌شوند.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={saveBlogSection}
                disabled={isLoading}
                className="h-11 px-6 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                ذخیره تنظیمات بخش مقالات
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* --- Tab 3: Discount Campaign & Promotional Banner --- */}
        <TabsContent value="discount-campaign" className="space-y-8 outline-none mt-0">
          {/* Campaign Status & Action Bar */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black border ${
                    discountSection.enabled
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {discountSection.enabled ? "کمپین فعال است" : "کمپین غیرفعال است"}
                </span>
                <span className="text-white text-sm font-bold">
                  {discountSection.enabled
                    ? `تخفیف گروهی روی محصولات فروشگاه فعال و بنر اختصاصی در سایت نمایش داده می‌شود`
                    : `برای شروع جشنواره، درصد تخفیف و محصولات را مشخص کرده و دکمه فعال‌سازی را بزنید`}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                با فعال‌سازی کمپین، درصد تخفیف مشخص‌شده در یک تراکنش امن دیتابیسی روی تمام محصولات انتخابی اعمال می‌شود و بنر اختصاصی در بالای فوتر فعال می‌گردد.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {discountSection.enabled && (
                <Button
                  onClick={handleDeactivateCampaign}
                  disabled={isCampaignLoading}
                  variant="destructive"
                  className="h-11 px-5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                >
                  {isCampaignLoading ? "در حال غیرفعال‌سازی..." : "غیرفعال‌سازی و بازگرداندن قیمت‌ها"}
                </Button>
              )}
              <Button
                onClick={handleActivateCampaign}
                disabled={isCampaignLoading || selectedProductIds.length === 0}
                className="h-11 px-6 rounded-xl bg-[#0082CA] hover:bg-[#006CA8] text-white font-bold text-xs shadow-lg shadow-[#0082CA]/25 cursor-pointer"
              >
                {isCampaignLoading ? "در حال پردازش..." : "فعال‌سازی و انتشار کمپین"}
              </Button>
            </div>
          </div>

          {/* Grid of Rules and Banner Media */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Box 1: Rules & Percentage */}
            <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">درصد تخفیف و زمان انقضا</h3>
                  <p className="text-xs text-gray-400">مشخصات اصلی جشنواره فروش ویژه</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-gray-300">درصد تخفیف عمومی (٪)</label>
                    <span className="font-mono text-amber-400 font-bold">{campaignPercent}٪</span>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={campaignPercent}
                    onChange={(e) => setCampaignPercent(Math.min(99, Math.max(1, Number(e.target.value))))}
                    className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300">مهلت پایان کمپین (اختیاری)</label>
                  <Input
                    type="datetime-local"
                    value={campaignExpiresAt}
                    onChange={(e) => setCampaignExpiresAt(e.target.value)}
                    className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs font-mono"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-gray-500">
                    در صورت تعیین مهلت، با گذشت تاریخ انقضا محصولات تخفیف‌دار به طور خودکار از فید حراج حذف می‌شوند.
                  </p>
                </div>

                {discountSection.enabled && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={async () => {
                        setIsCampaignLoading(true);
                        try {
                          await adminApi.setDiscountCampaignPercent(
                            Number(campaignPercent),
                            selectedProductIds.length > 0 ? selectedProductIds : undefined,
                            campaignExpiresAt ? new Date(campaignExpiresAt).toISOString() : null
                          );
                          toast.success("درصد و مهلت کمپین با موفقیت بروزرسانی شد.");
                          await loadAllCmsData();
                        } catch (err: any) {
                          toast.error(getApiErrorMessage(err, "خطا در بروزرسانی درصد"));
                        } finally {
                          setIsCampaignLoading(false);
                        }
                      }}
                      disabled={isCampaignLoading}
                      variant="outline"
                      className="h-10 px-4 rounded-xl border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-xs font-bold"
                    >
                      بروزرسانی سریع درصد یا مهلت
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Promotional Banner Content */}
            <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">تنظیمات بنر اختصاصی فروش ویژه</h3>
                  <p className="text-xs text-gray-400">محتوای بنر تبلیغاتی جشنواره در بالای فوتر صفحه نخست</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300">عنوان بنر</label>
                  <Input
                    value={discountSection.title}
                    onChange={(e) => setDiscountSection({ ...discountSection, title: e.target.value })}
                    placeholder="جشنواره تخفیفات استثنایی ماوی"
                    className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300">زیرعنوان / توضیحات بنر</label>
                  <Input
                    value={discountSection.subtitle}
                    onChange={(e) => setDiscountSection({ ...discountSection, subtitle: e.target.value })}
                    placeholder="تخفیف‌های ویژه بر روی برترین استایل‌های این فصل"
                    className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-300">متن دکمه (CTA)</label>
                    <Input
                      value={discountSection.cta_text}
                      onChange={(e) => setDiscountSection({ ...discountSection, cta_text: e.target.value })}
                      placeholder="مشاهده محصولات جشنواره"
                      className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-300">لینک دکمه</label>
                    <Input
                      value={discountSection.cta_link}
                      onChange={(e) => setDiscountSection({ ...discountSection, cta_link: e.target.value })}
                      placeholder="/products?has_discount=true"
                      className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <MediaUploader
                    value={discountSection.background_image || ""}
                    onChange={(url) => setDiscountSection({ ...discountSection, background_image: url })}
                    label="تصویر پس‌زمینه بنر جشنواره (الزاماً افقی - نسبت ۱۶:۹)"
                    aspectRatio="banner"
                    requiredLandscape={true}
                    helperText="تصویر بنر جشنواره باید افقی (Landscape) باشد. می‌توانید فایل جدید آپلود کنید یا آدرس CDN وارد نمایید."
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleSaveCampaignBanner}
                    disabled={isCampaignLoading}
                    className="h-10 px-5 rounded-xl bg-white text-black hover:bg-gray-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    ذخیره تنظیمات بنر
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Multi-Selector for Campaign */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <span>محصولات حاضر در جشنواره</span>
                  <span className="text-xs font-normal text-gray-400">
                    ({selectedProductIds.length} از {productsList.length} محصول انتخاب شده)
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  محصولاتی که مایلید با تخفیف {campaignPercent}٪ به فروش برسند را تیک بزنید.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setSelectedProductIds(productsList.map((p) => p.id))}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs font-bold cursor-pointer"
                >
                  انتخاب همه
                </Button>
                <Button
                  onClick={() => setSelectedProductIds([])}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 text-xs font-bold cursor-pointer"
                >
                  لغو انتخاب‌ها
                </Button>
                <Button
                  onClick={handleActivateCampaign}
                  disabled={isCampaignLoading || selectedProductIds.length === 0}
                  className="h-9 px-4 rounded-xl bg-[#0082CA] hover:bg-[#006CA8] text-white text-xs font-bold shadow-md shadow-[#0082CA]/25 cursor-pointer"
                >
                  {isCampaignLoading ? "در حال ثبت..." : `اعمال تخفیف ${campaignPercent}٪ روی ${selectedProductIds.length} محصول`}
                </Button>
              </div>
            </div>

            {/* Product Filter Search */}
            <div className="flex items-center gap-3 bg-[#0a0a0a] border border-white/10 rounded-2xl px-4 py-2">
              <Search className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="جستجو در نام محصول یا دسته‌بندی..."
                className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder:text-gray-600"
              />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-1">
              {productsList
                .filter((p) =>
                  (p.title || p.name || "").toLowerCase().includes(productSearch.toLowerCase()) ||
                  (p.category || "").toLowerCase().includes(productSearch.toLowerCase())
                )
                .map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const price = Number(product.price || 0);
                  const calculatedDiscountPrice = Math.round(price * (1 - campaignPercent / 100));

                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedProductIds((prev) => prev.filter((id) => id !== product.id));
                        } else {
                          setSelectedProductIds((prev) => [...prev, product.id]);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 items-center ${
                        isSelected
                          ? "bg-[#0082CA]/15 border-[#0082CA] shadow-md shadow-[#0082CA]/10"
                          : "bg-[#161616] border-white/5 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded accent-[#0082CA] cursor-pointer"
                      />
                      <img
                        src={product.imageUrl || product.image_url || product.image || "/placeholder-product.svg"}
                        alt={product.title || product.name}
                        className="w-12 h-14 object-cover rounded-xl border border-white/10 bg-black/20 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {product.title || product.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-mono">
                          <span className="text-gray-400 line-through">
                            {price.toLocaleString("fa-IR")}
                          </span>
                          <span className="text-amber-400 font-bold">
                            {calculatedDiscountPrice.toLocaleString("fa-IR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Bottom Action Footer for Product Selection */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs text-gray-400">
                تعداد <strong className="text-white">{selectedProductIds.length}</strong> محصول برای اعمال تخفیف{" "}
                <strong className="text-amber-400 font-mono">{campaignPercent}٪</strong> انتخاب شده است.
              </span>
              <Button
                onClick={handleActivateCampaign}
                disabled={isCampaignLoading || selectedProductIds.length === 0}
                className="h-10 px-6 rounded-xl bg-[#0082CA] hover:bg-[#006CA8] text-white text-xs font-bold shadow-lg shadow-[#0082CA]/25 cursor-pointer"
              >
                {isCampaignLoading ? "در حال ثبت تخفیف‌ها..." : `ذخیره و اعمال تخفیف ${campaignPercent}٪ روی محصولات انتخاب شده`}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* --- Tab 2: Custom Pages Management --- */}
        <TabsContent value="pages" className="space-y-6 outline-none mt-0">
          {/* Search bar */}
          <div className="flex items-center gap-4 bg-[#111111] border border-white/10 rounded-2xl p-3">
            <Search className="w-5 h-5 text-gray-500 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی عنوان برگه یا اسلاگ لینک..."
              className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder:text-gray-600"
            />
          </div>

          {/* Pages Table */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#161616] text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="p-4 md:p-5 font-bold">عنوان برگه</th>
                    <th className="p-4 md:p-5 font-bold">لینک صفحه (Slug)</th>
                    <th className="p-4 md:p-5 font-bold">وضعیت</th>
                    <th className="p-4 md:p-5 font-bold">آخرین تغییرات</th>
                    <th className="p-4 md:p-5 font-bold text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">
                        هیچ برگه‌ای یافت نشد. برای ایجاد روی "ساخت برگه جدید" کلیک کنید.
                      </td>
                    </tr>
                  ) : (
                    filteredPages.map((page) => (
                      <tr key={page.slug} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 md:p-5 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span>{page.title}</span>
                          </div>
                        </td>
                        <td className="p-4 md:p-5 font-mono text-gray-300" dir="ltr">
                          /pages/{page.slug}
                        </td>
                        <td className="p-4 md:p-5">
                          <button
                            onClick={() => handleTogglePublish(page)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                              page.status === "published"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                            }`}
                            title="برای تغییر وضعیت کلیک کنید"
                          >
                            {page.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                          </button>
                        </td>
                        <td className="p-4 md:p-5 text-gray-300 font-sans">
                          {page.updated_at ? formatShamsiDate(page.updated_at, { mode: "full" }) : "—"}
                        </td>

                        <td className="p-4 md:p-5 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/pages/${page.slug}`}
                              target="_blank"
                              className="p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                              title="مشاهده برگه در سایت"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleOpenEditPage(page)}
                              className="p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                              title="ویرایش محتوا"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePage(page.slug)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              title="حذف برگه"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- Page Create / Edit Modal --- */}
      <Dialog open={isPageModalOpen} onOpenChange={setIsPageModalOpen}>
        <DialogContent
          className="bg-[#0e0e0e] border border-white/10 text-white sm:max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              {editingPage ? `ویرایش برگه "${editingPage.title}"` : "ساخت برگه جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePage} className="space-y-6 mt-4">
            {/* Title & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">عنوان برگه (فارسی)</label>
                <Input
                  value={pageTitle}
                  onChange={(e) => {
                    setPageTitle(e.target.value);
                    if (!editingPage) {
                      setPageSlug(
                        e.target.value
                          .trim()
                          .toLowerCase()
                          .replace(/[^\w\u0600-\u06FF\s-]/g, "")
                          .replace(/\s+/g, "-")
                      );
                    }
                  }}
                  placeholder="مثال: راهنمای سایز و خرید"
                  required
                  className="bg-[#141414] border-white/10 h-11 text-white text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">شناسه آدرس اینترنتی (Slug)</label>
                <Input
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value)}
                  placeholder="size-guide"
                  required
                  className="bg-[#141414] border-white/10 h-11 text-white text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">وضعیت انتشار</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPageStatus("published")}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    pageStatus === "published"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-[#141414] border-white/10 text-gray-400"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  انتشار فوری در سایت
                </button>
                <button
                  type="button"
                  onClick={() => setPageStatus("draft")}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    pageStatus === "draft"
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "bg-[#141414] border-white/10 text-gray-400"
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  ذخیره به عنوان پیش‌نویس
                </button>
              </div>
            </div>

            {/* Content Blocks Builder */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">بخش‌های متنی برگه</h4>
                  <p className="text-[11px] text-gray-400">تیترها و پاراگراف‌های متنی برگه را اینجا اضافه کنید</p>
                </div>
                <Button
                  type="button"
                  onClick={() => setPageBlocks([...pageBlocks, { heading: "", body: "" }])}
                  className="h-8 px-3 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن بخش جدید
                </Button>
              </div>

              <div className="space-y-4">
                {pageBlocks.map((block, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400">بخش شماره {index + 1}</span>
                      {pageBlocks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPageBlocks(pageBlocks.filter((_, i) => i !== index))}
                          className="text-gray-500 hover:text-red-400 p-1 text-xs"
                          title="حذف این بخش"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <Input
                      value={block.heading}
                      onChange={(e) => {
                        const updated = [...pageBlocks];
                        updated[index].heading = e.target.value;
                        setPageBlocks(updated);
                      }}
                      placeholder="عنوان این بخش (اختیاری)..."
                      className="bg-[#0a0a0a] border-white/10 h-10 text-white text-xs font-bold"
                    />

                    <textarea
                      value={block.body}
                      onChange={(e) => {
                        const updated = [...pageBlocks];
                        updated[index].body = e.target.value;
                        setPageBlocks(updated);
                      }}
                      placeholder="متن کامل این بخش و توضیحات..."
                      rows={4}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-white text-xs placeholder:text-gray-600 outline-none focus:border-white/30 resize-y"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* SEO Metadata */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                تنظیمات سئو (گوگل)
              </h4>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">عنوان سئو (Meta Title)</label>
                <Input
                  value={pageMetaTitle}
                  onChange={(e) => setPageMetaTitle(e.target.value)}
                  placeholder="عنوان نمایشی در نتایج جستجو..."
                  className="bg-[#141414] border-white/10 h-10 text-white text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">توضیحات متا (Meta Description)</label>
                <textarea
                  value={pageMetaDesc}
                  onChange={(e) => setPageMetaDesc(e.target.value)}
                  placeholder="خلاصه ۱ الی ۲ جمله‌ای برای موتورهای جستجو..."
                  rows={2}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs placeholder:text-gray-600 outline-none focus:border-white/30 resize-none"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-sm"
              >
                {editingPage ? "ذخیره تغییرات برگه" : "ایجاد و ثبت برگه"}
              </Button>
              <Button
                type="button"
                onClick={() => setIsPageModalOpen(false)}
                variant="ghost"
                className="h-12 rounded-xl text-gray-400 hover:text-white"
              >
                انصراف
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirmSlug}
        onOpenChange={(open) => !open && setDeleteConfirmSlug(null)}
        title="حذف برگه"
        description={`آیا از حذف برگه «${deleteConfirmSlug || ""}» مطمئن هستید؟ این عملیات غیرقابل بازگشت است.`}
        confirmText="حذف برگه"
        cancelText="انصراف"
        variant="destructive"
        onConfirm={executeDeletePage}
      />
    </div>
  );
}

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
import { adminApi, CMSPage } from "@/lib/admin-api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { formatShamsiDate } from "@/lib/jalali";

export default function AdminCMSPage() {

  const [activeTab, setActiveTab] = useState("site-content");
  const [isLoading, setIsLoading] = useState(false);

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

  const [heroBanner, setHeroBanner] = useState({
    badge: "کالکشن جدید ۲۰۲۶",
    headline: "استایل لوکس و مینیمال برای زندگی مدرن",
    subtitle: "طراحی‌های اختصاصی و دوخت باکیفیت برای درخشش شما در هر موقعیت",
    cta_label: "مشاهده جدیدترین‌ها",
    cta_link: "/women",
    image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
  });

  const [footerInfo, setFooterInfo] = useState({
    description: "فروشگاه تخصصی پوشاک مد و فشن با تمرکز بر کیفیت برتر، طراحی مدرن و ارسال سریع.",
    phone: "۰۲۱-۸۸۸۸۷۷۶۶",
    email: "info@fashionstore.com",
    address: "تهران، خیابان ولیعصر، برج مد و تجارت، طبقه ۵",
    working_hours: "شنبه تا پنج‌شنبه: ۹ صبح الی ۹ شب",
  });

  useEffect(() => {
    loadAllCmsData();
  }, []);

  const loadAllCmsData = async () => {
    setIsLoading(true);
    try {
      const [pagesData, announceData, heroData, footerData] = await Promise.allSettled([
        adminApi.getPages(),
        adminApi.getSiteContent("announcement"),
        adminApi.getSiteContent("hero"),
        adminApi.getSiteContent("footer"),
      ]);

      if (pagesData.status === "fulfilled") {
        setPages(pagesData.value);
      }
      if (announceData.status === "fulfilled" && announceData.value) {
        setAnnouncement((prev) => ({ ...prev, ...announceData.value }));
      }
      if (heroData.status === "fulfilled" && heroData.value) {
        setHeroBanner((prev) => ({ ...prev, ...heroData.value }));
      }
      if (footerData.status === "fulfilled" && footerData.value) {
        setFooterInfo((prev) => ({ ...prev, ...footerData.value }));
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
      toast.success("تنظیمات نوار اطلاعیه با موفقیت ذخیره شد");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error?.message || "خطا در ذخیره نوار اطلاعیه. اطمینان حاصل کنید با حساب ادمین وارد شده‌اید.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHeroBanner = async () => {
    setIsLoading(true);
    try {
      await adminApi.updateSiteContent("hero", heroBanner);
      toast.success("تنظیمات بنر صفحه نخست با موفقیت ذخیره شد");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error?.message || "خطا در ذخیره بنر صفحه نخست. اطمینان حاصل کنید با حساب ادمین وارد شده‌اید.";
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

  const handleDeletePage = async (slug: string) => {
    if (!confirm(`آیا از حذف برگه "${slug}" مطمئن هستید؟`)) return;
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

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-300 font-medium cursor-pointer">
                  {announcement.enabled ? "فعال" : "غیرفعال"}
                </label>
                <input
                  type="checkbox"
                  checked={announcement.enabled}
                  onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
                  className="w-5 h-5 accent-white rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                پیش‌نمایش زنده در سایت:
              </span>
              <div className="p-3 rounded-xl bg-[#1a1a1a] border border-white/10 text-center text-xs flex items-center justify-center gap-2">
                {announcement.badge && (
                  <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
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

          {/* Section 2: Hero Banner */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-white">بنر اصلی صفحه اول (Hero Banner)</h3>
                <p className="text-xs text-gray-400">تنظیم عنوان اصلی، تصویر جذاب پس‌زمینه و دکمه ورود به کالکشن</p>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                پیش‌نمایش بنر صفحه نخست:
              </span>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] h-48 md:h-56 p-6 flex flex-col justify-end">
                {heroBanner.image_url && (
                  <img
                    src={heroBanner.image_url}
                    alt="Banner preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="relative z-10 space-y-2 max-w-lg">
                  {heroBanner.badge && (
                    <span className="inline-block bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {heroBanner.badge}
                    </span>
                  )}
                  <h4 className="text-lg md:text-xl font-black text-white">{heroBanner.headline || "تیتر بنر"}</h4>
                  <p className="text-xs text-gray-300 line-clamp-1">{heroBanner.subtitle || "توضیحات کوتاه"}</p>
                  <button className="bg-white text-black font-bold text-xs px-4 py-1.5 rounded-lg w-max mt-2">
                    {heroBanner.cta_label || "خرید"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">برچسب کوچک بالای تیتر</label>
                <Input
                  value={heroBanner.badge}
                  onChange={(e) => setHeroBanner({ ...heroBanner, badge: e.target.value })}
                  placeholder="مثال: کالکشن جدید"
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">تیتر اصلی و بزرگ</label>
                <Input
                  value={heroBanner.headline}
                  onChange={(e) => setHeroBanner({ ...heroBanner, headline: e.target.value })}
                  placeholder="تیتر جذاب صفحه نخست..."
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">متن زیرین و توضیحات</label>
              <Input
                value={heroBanner.subtitle}
                onChange={(e) => setHeroBanner({ ...heroBanner, subtitle: e.target.value })}
                placeholder="توضیحات تکمیلی..."
                className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">متن روی دکمه (CTA)</label>
                <Input
                  value={heroBanner.cta_label}
                  onChange={(e) => setHeroBanner({ ...heroBanner, cta_label: e.target.value })}
                  placeholder="مثال: مشاهده محصولات"
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">لینک دکمه</label>
                <Input
                  value={heroBanner.cta_link}
                  onChange={(e) => setHeroBanner({ ...heroBanner, cta_link: e.target.value })}
                  placeholder="/women"
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">آدرس اینترنتی تصویر (Image URL)</label>
                <Input
                  value={heroBanner.image_url}
                  onChange={(e) => setHeroBanner({ ...heroBanner, image_url: e.target.value })}
                  placeholder="https://..."
                  className="bg-[#0a0a0a] border-white/10 h-11 text-white text-xs"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={saveHeroBanner}
                disabled={isLoading}
                className="h-11 px-6 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                ذخیره تغییرات بنر
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
    </div>
  );
}

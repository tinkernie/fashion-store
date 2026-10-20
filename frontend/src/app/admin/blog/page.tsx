"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Save,
  Sparkles,
  ExternalLink,
  Search,
  Check,
  RefreshCw,
  Clock,
  Tag as TagIcon,
  BookOpen,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  adminBlogApi,
  BlogPostAdminDetail,
  BlogTag,
  BlogPostTranslationPayload,
  BlogLanguage,
} from "@/lib/blog-api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { formatShamsiDate } from "@/lib/jalali";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import MediaUploader from "@/components/admin/media-uploader";
import BlogRichEditor from "@/components/admin/blog-rich-editor";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostAdminDetail[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [selectedTagSlug, setSelectedTagSlug] = useState<string>("");

  // Post Editor Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostAdminDetail | null>(null);

  // Active translation tab in post modal
  const [activeLangTab, setActiveLangTab] = useState<"fa" | "en" | "ar">("fa");

  // Base Post Form Fields (Persian)
  const [postTitle, setPostTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postExcerpt, setPostExcerpt] = useState("");
  const [postBodyHtml, setPostBodyHtml] = useState("");
  const [postCoverImage, setPostCoverImage] = useState("");
  const [postStatus, setPostStatus] = useState<"draft" | "published">("published");
  const [postMetaTitle, setPostMetaTitle] = useState("");
  const [postMetaDesc, setPostMetaDesc] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  // Translations Form Fields
  const [enTitle, setEnTitle] = useState("");
  const [enSlug, setEnSlug] = useState("");
  const [enExcerpt, setEnExcerpt] = useState("");
  const [enBodyHtml, setEnBodyHtml] = useState("");
  const [enMetaTitle, setEnMetaTitle] = useState("");
  const [enMetaDesc, setEnMetaDesc] = useState("");

  const [arTitle, setArTitle] = useState("");
  const [arSlug, setArSlug] = useState("");
  const [arExcerpt, setArExcerpt] = useState("");
  const [arBodyHtml, setArBodyHtml] = useState("");
  const [arMetaTitle, setArMetaTitle] = useState("");
  const [arMetaDesc, setArMetaDesc] = useState("");

  // Delete Confirm State
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);

  // Tag Manager Modal State
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [tagNameFa, setTagNameFa] = useState("");
  const [tagSlug, setTagSlug] = useState("");
  const [tagNameEn, setTagNameEn] = useState("");
  const [tagNameAr, setTagNameAr] = useState("");
  const [deleteTagId, setDeleteTagId] = useState<number | null>(null);
  const [isSavingTag, setIsSavingTag] = useState(false);

  // Load posts and tags
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [postsRes, tagsRes] = await Promise.all([
        adminBlogApi.getPosts({
          status: statusFilter === "all" ? undefined : statusFilter,
          search: searchQuery.trim() || undefined,
          tag: selectedTagSlug || undefined,
        }),
        adminBlogApi.getTags(),
      ]);

      setPosts(postsRes.results || []);
      setTotalCount(postsRes.count || 0);
      setTags(tagsRes);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در دریافت لیست مقالات وبلاگ"));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery, selectedTagSlug]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminBlogApi.getPosts({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
        tag: selectedTagSlug || undefined,
      }),
      adminBlogApi.getTags(),
    ])
      .then(([postsRes, tagsRes]) => {
        if (!cancelled) {
          setPosts(postsRes.results || []);
          setTotalCount(postsRes.count || 0);
          setTags(tagsRes);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, "خطا در دریافت لیست مقالات وبلاگ"));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, searchQuery, selectedTagSlug]);

  // Open modal for creating a new post
  const handleOpenCreateModal = () => {
    setEditingPost(null);
    setActiveLangTab("fa");
    setPostTitle("");
    setPostSlug("");
    setPostExcerpt("");
    setPostBodyHtml("");
    setPostCoverImage("");
    setPostStatus("published");
    setPostMetaTitle("");
    setPostMetaDesc("");
    setSelectedTagIds([]);

    setEnTitle("");
    setEnSlug("");
    setEnExcerpt("");
    setEnBodyHtml("");
    setEnMetaTitle("");
    setEnMetaDesc("");

    setArTitle("");
    setArSlug("");
    setArExcerpt("");
    setArBodyHtml("");
    setArMetaTitle("");
    setArMetaDesc("");

    setIsPostModalOpen(true);
  };

  // Open modal for editing an existing post
  const handleOpenEditModal = async (slug: string) => {
    try {
      setIsLoading(true);
      const post = await adminBlogApi.getPost(slug);
      setEditingPost(post);
      setActiveLangTab("fa");

      // Set base fields
      setPostTitle(post.title || "");
      setPostSlug(post.slug || "");
      setPostExcerpt(post.excerpt || "");
      setPostBodyHtml(post.body_html || "");
      setPostCoverImage(post.cover_image || "");
      setPostStatus(post.status || "published");
      setPostMetaTitle(post.meta_title || "");
      setPostMetaDesc(post.meta_description || "");
      setSelectedTagIds(post.tags?.map((t) => t.id) || []);

      // Extract translations
      const enTrans = post.translations?.find((t) => t.language === "en");
      const arTrans = post.translations?.find((t) => t.language === "ar");

      if (enTrans) {
        setEnTitle(enTrans.title || "");
        setEnSlug(enTrans.slug || "");
        setEnExcerpt(enTrans.excerpt || "");
        setEnBodyHtml(enTrans.body_html || "");
        setEnMetaTitle(enTrans.meta_title || "");
        setEnMetaDesc(enTrans.meta_description || "");
      } else {
        setEnTitle("");
        setEnSlug("");
        setEnExcerpt("");
        setEnBodyHtml("");
        setEnMetaTitle("");
        setEnMetaDesc("");
      }

      if (arTrans) {
        setArTitle(arTrans.title || "");
        setArSlug(arTrans.slug || "");
        setArExcerpt(arTrans.excerpt || "");
        setArBodyHtml(arTrans.body_html || "");
        setArMetaTitle(arTrans.meta_title || "");
        setArMetaDesc(arTrans.meta_description || "");
      } else {
        setArTitle("");
        setArSlug("");
        setArExcerpt("");
        setArBodyHtml("");
        setArMetaTitle("");
        setArMetaDesc("");
      }

      setIsPostModalOpen(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در دریافت جزئیات مقاله"));
    } finally {
      setIsLoading(false);
    }
  };

  // Auto slug generation for Persian
  const handleTitleChange = (val: string) => {
    setPostTitle(val);
    if (!editingPost && !postSlug) {
      const generated = val
        .trim()
        .toLowerCase()
        .replace(/[\s\-_]+/g, "-")
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\-]/g, "");
      setPostSlug(generated.slice(0, 80));
    }
  };

  // Save Post (Create or Update)
  const handleSavePost = async () => {
    if (!postTitle.trim()) {
      toast.error("لطفاً عنوان فارسی مقاله را وارد کنید");
      setActiveLangTab("fa");
      return;
    }
    if (!postSlug.trim()) {
      toast.error("لطفاً نامک (Slug) مقاله را وارد کنید");
      setActiveLangTab("fa");
      return;
    }

    setIsSavingPost(true);
    try {
      // Build translations array
      const translations: BlogPostTranslationPayload[] = [];

      if (enTitle.trim()) {
        translations.push({
          language: "en",
          title: enTitle.trim(),
          slug: enSlug.trim() || undefined,
          excerpt: enExcerpt.trim(),
          body_html: enBodyHtml.trim() || "<p></p>",
          meta_title: enMetaTitle.trim() || undefined,
          meta_description: enMetaDesc.trim() || undefined,
        });
      }

      if (arTitle.trim()) {
        translations.push({
          language: "ar",
          title: arTitle.trim(),
          slug: arSlug.trim() || undefined,
          excerpt: arExcerpt.trim(),
          body_html: arBodyHtml.trim() || "<p></p>",
          meta_title: arMetaTitle.trim() || undefined,
          meta_description: arMetaDesc.trim() || undefined,
        });
      }

      const payload: Partial<BlogPostAdminDetail> = {
        title: postTitle.trim(),
        slug: postSlug.trim(),
        excerpt: postExcerpt.trim(),
        body_html: postBodyHtml.trim() || "<p></p>",
        cover_image: postCoverImage.trim() || undefined,
        status: postStatus,
        meta_title: postMetaTitle.trim() || undefined,
        meta_description: postMetaDesc.trim() || undefined,
        tag_ids: selectedTagIds,
        translations,
      };

      if (editingPost) {
        await adminBlogApi.updatePost(editingPost.slug, payload);
        toast.success("مقاله با موفقیت به‌روزرسانی شد");
      } else {
        await adminBlogApi.createPost(payload);
        toast.success("مقاله جدید با موفقیت ایجاد شد");
      }

      setIsPostModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در ذخیره مقاله"));
    } finally {
      setIsSavingPost(false);
    }
  };

  // Toggle publish / unpublish
  const handleTogglePublish = async (post: BlogPostAdminDetail) => {
    try {
      if (post.status === "published") {
        await adminBlogApi.unpublishPost(post.slug);
        toast.success("مقاله به پیش‌نویس تبدیل شد");
      } else {
        await adminBlogApi.publishPost(post.slug);
        toast.success("مقاله منتشر شد");
      }
      loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در تغییر وضعیت انتشار"));
    }
  };

  // Delete Post
  const handleDeletePost = async () => {
    if (!deleteConfirmSlug) return;
    try {
      await adminBlogApi.deletePost(deleteConfirmSlug);
      toast.success("مقاله با موفقیت حذف شد");
      setDeleteConfirmSlug(null);
      loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در حذف مقاله"));
    }
  };

  // Tag Manager Handlers
  const handleOpenTagModal = () => {
    setEditingTag(null);
    setTagNameFa("");
    setTagSlug("");
    setTagNameEn("");
    setTagNameAr("");
    setIsTagModalOpen(true);
  };

  const handleEditTagClick = (tag: BlogTag) => {
    setEditingTag(tag);
    setTagNameFa(tag.name);
    setTagSlug(tag.slug);
    setTagNameEn(tag.name_en || "");
    setTagNameAr(tag.name_ar || "");
  };

  const handleSaveTag = async () => {
    if (!tagNameFa.trim()) {
      toast.error("لطفاً نام فارسی برچسب را وارد کنید");
      return;
    }
    if (!tagSlug.trim()) {
      toast.error("لطفاً نامک (Slug) برچسب را وارد کنید");
      return;
    }

    setIsSavingTag(true);
    try {
      const payload = {
        name: tagNameFa.trim(),
        slug: tagSlug.trim(),
        name_en: tagNameEn.trim() || undefined,
        name_ar: tagNameAr.trim() || undefined,
      };

      if (editingTag) {
        await adminBlogApi.updateTag(editingTag.id, payload);
        toast.success("برچسب به‌روزرسانی شد");
      } else {
        await adminBlogApi.createTag(payload);
        toast.success("برچسب جدید ایجاد شد");
      }

      setEditingTag(null);
      setTagNameFa("");
      setTagSlug("");
      setTagNameEn("");
      setTagNameAr("");

      const refreshed = await adminBlogApi.getTags();
      setTags(refreshed);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در ذخیره برچسب"));
    } finally {
      setIsSavingTag(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!deleteTagId) return;
    try {
      await adminBlogApi.deleteTag(deleteTagId);
      toast.success("برچسب با موفقیت حذف شد");
      setDeleteTagId(null);
      const refreshed = await adminBlogApi.getTags();
      setTags(refreshed);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در حذف برچسب"));
    }
  };

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">
              مدیریت مجله و مقالات
            </span>
            <span className="text-xs text-gray-400">چندزبانه (FA, EN, AR)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>وبلاگ و مقالات آموزشی</span>
            <BookOpen className="w-6 h-6 text-[#0082CA]" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            تولید محتوا، بهینه‌سازی سئو، مدیریت ترجمه‌ها و انتشار در صفحه اصلی فروشگاه
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenTagModal}
            variant="outline"
            className="rounded-xl border border-white/15 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white flex items-center gap-1.5"
          >
            <TagIcon className="w-4 h-4 text-sky-400" />
            <span>مدیریت برچسب‌ها ({tags.length})</span>
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="rounded-xl bg-[#0082CA] hover:bg-[#006CA8] text-white shadow-lg shadow-[#0082CA]/25 flex items-center gap-1.5 font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>نگارش مقاله جدید</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#111111] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">کل مقالات</p>
            <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">منتشر شده</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{publishedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">پیش‌نویس</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{draftCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">برچسب‌های موضوعی</p>
            <p className="text-2xl font-black text-white mt-1">{tags.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <TagIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#111111] border border-white/10 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="جستجو در عنوان یا متن مقالات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 rounded-xl bg-[#0a0a0a] border-white/10 text-white focus-visible:ring-[#0082CA] text-xs h-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status selector */}
          <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "all" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              همه ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("published")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "published" ? "bg-emerald-500 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              منتشر شده
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "draft" ? "bg-amber-500 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              پیش‌نویس
            </button>
          </div>

          {/* Tag filter dropdown */}
          <select
            value={selectedTagSlug}
            onChange={(e) => setSelectedTagSlug(e.target.value)}
            className="text-xs bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-gray-200 outline-none focus:ring-1 focus:ring-[#0082CA]"
          >
            <option value="">همه برچسب‌ها</option>
            {tags.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>

          <Button
            onClick={() => loadData()}
            variant="ghost"
            size="sm"
            className="rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Posts Table / List */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0082CA] mx-auto" />
            <p className="text-xs text-slate-500">در حال دریافت مقالات وبلاگ...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-gray-500 mx-auto" />
            <p className="text-sm font-bold text-white">مقاله‌ای یافت نشد</p>
            <p className="text-xs text-gray-400">
              هنوز مقاله‌ای با این فیلترها ثبت نشده است. می‌توانید با زدن دکمه «نگارش مقاله جدید» شروع کنید.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#161616] border-b border-white/10 text-gray-300 font-bold">
                <tr>
                  <th className="p-3.5">تصویر</th>
                  <th className="p-3.5">عنوان و نامک</th>
                  <th className="p-3.5">وضعیت</th>
                  <th className="p-3.5">زبان‌ها</th>
                  <th className="p-3.5">برچسب‌ها</th>
                  <th className="p-3.5">زمان مطالعه</th>
                  <th className="p-3.5">تاریخ انتشار</th>
                  <th className="p-3.5 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((post) => {
                  const hasEn = post.translations?.some((t) => t.language === "en");
                  const hasAr = post.translations?.some((t) => t.language === "ar");

                  return (
                    <tr key={post.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 w-16">
                        {post.cover_image ? (
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-14 h-10 object-cover rounded-lg border border-white/10"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-white/5 text-sky-400 flex items-center justify-center border border-white/10 text-[10px] font-bold">
                            MAVI
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <p className="font-bold text-white line-clamp-1">{post.title}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5 line-clamp-1" dir="ltr">
                          /blog/{post.slug}
                        </p>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        {post.status === "published" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>منتشر شده</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span>پیش‌نویس</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-sky-100 text-[#0082CA] font-bold text-[10px]">
                            FA
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              hasEn ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            EN
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              hasAr ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            AR
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 max-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {post.tags && post.tags.length > 0 ? (
                            post.tags.slice(0, 2).map((t) => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]"
                              >
                                {t.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                          {post.tags && post.tags.length > 2 && (
                            <span className="text-[10px] text-slate-400">+{post.tags.length - 2}</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-gray-300">
                        {post.reading_minutes} دقیقه
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-gray-400">
                        {post.published_at ? formatShamsiDate(post.published_at) : "هنوز منتشر نشده"}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Toggle publish button */}
                          <Button
                            onClick={() => handleTogglePublish(post)}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
                            title={post.status === "published" ? "تبدیل به پیش‌نویس" : "انتشار فوری"}
                          >
                            {post.status === "published" ? "عدم انتشار" : "انتشار"}
                          </Button>

                          {/* Edit button */}
                          <Button
                            onClick={() => handleOpenEditModal(post.slug)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-gray-300 hover:bg-white/10 hover:text-sky-400"
                            title="ویرایش مقاله"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>

                          {/* View in Storefront */}
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white"
                            title="مشاهده در سایت"
                          >
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </Button>

                          {/* Delete button */}
                          <Button
                            onClick={() => setDeleteConfirmSlug(post.slug)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                            title="حذف مقاله"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Post Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deleteConfirmSlug)}
        onOpenChange={(open) => !open && setDeleteConfirmSlug(null)}
        title="حذف مقاله وبلاگ"
        description="آیا از حذف این مقاله اطمینان دارید؟ این عملیات مقاله را به زباله‌دان انتقال می‌دهد."
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        variant="destructive"
        onConfirm={handleDeletePost}
      />

      {/* Post Authoring Modal (Full screen / large) */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-6 font-sans" dir="rtl">
          <DialogHeader className="border-b border-sky-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {editingPost ? "ویرایش مقاله وبلاگ" : "نگارش مقاله جدید"}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  پشتیبانی کامل از سئو، چندزبانگی (فارسی، انگلیسی، عربی) و ویرایشگر امن HTML
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">وضعیت:</span>
                <select
                  value={postStatus}
                  onChange={(e) => setPostStatus(e.target.value as "draft" | "published")}
                  className="text-xs bg-slate-50 border border-sky-200 rounded-lg px-2.5 py-1.5 font-bold outline-none"
                >
                  <option value="published">منتشر شده (Published)</option>
                  <option value="draft">پیش‌نویس (Draft)</option>
                </select>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Meta & Cover Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cover Image */}
              <div className="md:col-span-1 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">تصویر شاخص مقاله</label>
                <MediaUploader
                  value={postCoverImage}
                  onChange={setPostCoverImage}
                  label="تصویر کاور مقاله"
                  helperText="ترجیحاً ابعاد افقی ۱۶:۹ با کیفیت بالا"
                  aspectRatio="banner"
                  requiredLandscape
                />
              </div>

              {/* Tags & Common Meta */}
              <div className="md:col-span-2 space-y-4">
                {/* Tags selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">برچسب‌های موضوعی</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPostModalOpen(false);
                        handleOpenTagModal();
                      }}
                      className="text-[11px] text-[#0082CA] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>افزودن برچسب جدید</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-sky-100 rounded-xl min-h-[50px]">
                    {tags.length === 0 ? (
                      <span className="text-xs text-slate-400">هنوز برچسبی تعریف نشده است.</span>
                    ) : (
                      tags.map((tag) => {
                        const isSelected = selectedTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              setSelectedTagIds((prev) =>
                                isSelected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                              );
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-[#0082CA] text-white shadow-sm"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span>{tag.name}</span>
                            {isSelected && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Persian Slug */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    نامک یکتا (Slug) به زبان فارسی
                  </label>
                  <Input
                    placeholder="post-title-in-farsi"
                    value={postSlug}
                    onChange={(e) => setPostSlug(e.target.value)}
                    dir="ltr"
                    className="font-mono text-xs rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    در آدرس URL صفحه قرار می‌گیرد. در صورت تغییر، سیستم به‌طور خودکار هدایت ۳۰۱ ایجاد می‌کند.
                  </p>
                </div>
              </div>
            </div>

            {/* Language Tabs (FA / EN / AR) */}
            <div className="border border-sky-100 rounded-2xl p-4 bg-slate-50/50">
              <Tabs value={activeLangTab} onValueChange={(val) => setActiveLangTab(val as BlogLanguage)} dir="rtl">
                <div className="flex items-center justify-between mb-4 border-b border-sky-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-[#0082CA]" />
                    <span className="text-xs font-bold text-slate-800">محتوای مقاله به تفکیک زبان:</span>
                  </div>

                  <TabsList className="bg-white border border-slate-200">
                    <TabsTrigger value="fa" className="text-xs gap-1.5 data-[state=active]:bg-[#0082CA] data-[state=active]:text-white">
                      <span>🇮🇷 فارسی</span>
                      <span className="text-[10px] opacity-75">(پایه)</span>
                    </TabsTrigger>
                    <TabsTrigger value="en" className="text-xs gap-1.5 data-[state=active]:bg-[#0082CA] data-[state=active]:text-white">
                      <span>🇬🇧 English</span>
                      {enTitle && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </TabsTrigger>
                    <TabsTrigger value="ar" className="text-xs gap-1.5 data-[state=active]:bg-[#0082CA] data-[state=active]:text-white">
                      <span>🇦🇪 العربية</span>
                      {arTitle && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab: Persian (FA) */}
                <TabsContent value="fa" className="space-y-4 m-0">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">عنوان مقاله (فارسی)</label>
                    <Input
                      placeholder="عنوان جذاب مقاله مد و پوشاک..."
                      value={postTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">چکیده مقاله (Excerpt)</label>
                      <span className="text-[11px] text-slate-400">{postExcerpt.length} / 500 کاراکتر</span>
                    </div>
                    <textarea
                      placeholder="خلاصه کوتاه مقاله برای نمایش در کارت‌ها و پیش‌نمایش شبکه‌های اجتماعی..."
                      value={postExcerpt}
                      onChange={(e) => setPostExcerpt(e.target.value.slice(0, 500))}
                      rows={2}
                      className="w-full text-xs rounded-xl p-3 border border-sky-100 bg-white outline-none focus:ring-1 focus:ring-[#0082CA]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">متن کامل مقاله (فارسی)</label>
                    <BlogRichEditor
                      value={postBodyHtml}
                      onChange={setPostBodyHtml}
                      dir="rtl"
                      placeholder="متن مقاله را به همراه تیترها، تصاویر و ویدیو اینجا تایپ کنید..."
                    />
                  </div>

                  {/* SEO Accordion/Card */}
                  <div className="p-4 bg-white rounded-xl border border-sky-100 space-y-3">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0082CA]" />
                      <span>تنظیمات متای سئو (فارسی - اختیاری)</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Meta Title</label>
                        <Input
                          placeholder="عنوان متای سئو..."
                          value={postMetaTitle}
                          onChange={(e) => setPostMetaTitle(e.target.value)}
                          className="text-xs rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Meta Description</label>
                        <Input
                          placeholder="توضیحات متای سئو..."
                          value={postMetaDesc}
                          onChange={(e) => setPostMetaDesc(e.target.value)}
                          className="text-xs rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: English (EN) */}
                <TabsContent value="en" className="space-y-4 m-0" dir="ltr">
                  <div className="text-left">
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Article Title (English)</label>
                    <Input
                      placeholder="e.g. 2026 Spring Fashion Trends and Styles..."
                      value={enTitle}
                      onChange={(e) => setEnTitle(e.target.value)}
                      className="rounded-xl font-bold"
                    />
                  </div>

                  <div className="text-left">
                    <label className="text-xs font-bold text-slate-700 mb-1 block">English Slug (Optional)</label>
                    <Input
                      placeholder="spring-fashion-trends-2026"
                      value={enSlug}
                      onChange={(e) => setEnSlug(e.target.value)}
                      className="font-mono text-xs rounded-xl"
                    />
                  </div>

                  <div className="text-left">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">Excerpt (English)</label>
                      <span className="text-[11px] text-slate-400">{enExcerpt.length} / 500 chars</span>
                    </div>
                    <textarea
                      placeholder="Short summary for English readers..."
                      value={enExcerpt}
                      onChange={(e) => setEnExcerpt(e.target.value.slice(0, 500))}
                      rows={2}
                      className="w-full text-xs rounded-xl p-3 border border-sky-100 bg-white outline-none focus:ring-1 focus:ring-[#0082CA]"
                    />
                  </div>

                  <div className="text-left">
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Full Body Content (English)</label>
                    <BlogRichEditor
                      value={enBodyHtml}
                      onChange={setEnBodyHtml}
                      dir="ltr"
                      placeholder="Write English article content here..."
                    />
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-sky-100 space-y-3 text-left">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0082CA]" />
                      <span>English SEO Metadata (Optional)</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Meta Title</label>
                        <Input
                          placeholder="SEO title in English..."
                          value={enMetaTitle}
                          onChange={(e) => setEnMetaTitle(e.target.value)}
                          className="text-xs rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Meta Description</label>
                        <Input
                          placeholder="SEO description in English..."
                          value={enMetaDesc}
                          onChange={(e) => setEnMetaDesc(e.target.value)}
                          className="text-xs rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Arabic (AR) */}
                <TabsContent value="ar" className="space-y-4 m-0" dir="rtl">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">عنوان المقال (العربية)</label>
                    <Input
                      placeholder="مثال: أحدث صيحات الموضة والأزياء الفاخرة..."
                      value={arTitle}
                      onChange={(e) => setArTitle(e.target.value)}
                      className="rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">الاسم اللطيف (Slug بالعربية یا الإنجليزية)</label>
                    <Input
                      placeholder="arabic-slug-or-transliteration"
                      value={arSlug}
                      onChange={(e) => setArSlug(e.target.value)}
                      dir="ltr"
                      className="font-mono text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">موجز المقال (Excerpt)</label>
                      <span className="text-[11px] text-slate-400">{arExcerpt.length} / 500 حرف</span>
                    </div>
                    <textarea
                      placeholder="ملخص قصير للمقال باللغة العربية..."
                      value={arExcerpt}
                      onChange={(e) => setArExcerpt(e.target.value.slice(0, 500))}
                      rows={2}
                      className="w-full text-xs rounded-xl p-3 border border-sky-100 bg-white outline-none focus:ring-1 focus:ring-[#0082CA]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">محتوى المقال (العربية)</label>
                    <BlogRichEditor
                      value={arBodyHtml}
                      onChange={setArBodyHtml}
                      dir="rtl"
                      placeholder="اكتب المحتوى العربي هنا مع العناوين والصور..."
                    />
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-sky-100 space-y-3">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0082CA]" />
                      <span>بيانات السيو باللغة العربية (اختياري)</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Meta Title</label>
                        <Input
                          placeholder="عنوان السيو بالعربية..."
                          value={arMetaTitle}
                          onChange={(e) => setArMetaTitle(e.target.value)}
                          className="text-xs rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Meta Description</label>
                        <Input
                          placeholder="وصف السيو بالعربية..."
                          value={arMetaDesc}
                          onChange={(e) => setArMetaDesc(e.target.value)}
                          className="text-xs rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter className="border-t border-sky-100 pt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsPostModalOpen(false)}
              disabled={isSavingPost}
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleSavePost}
              disabled={isSavingPost}
              className="bg-[#0082CA] hover:bg-[#006CA8] text-white shadow-md shadow-[#0082CA]/20 gap-2 font-bold"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingPost ? "در حال ذخیره‌سازی..." : editingPost ? "به‌روزرسانی مقاله" : "ثبت و انتشار مقاله"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Manager Dialog */}
      <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
        <DialogContent className="max-w-2xl p-6 font-sans" dir="rtl">
          <DialogHeader className="border-b border-sky-100 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-[#0082CA]" />
              <span>مدیریت برچسب‌های وبلاگ</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Create / Edit Tag Form */}
            <div className="p-4 bg-slate-50 border border-sky-100 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-slate-800">
                {editingTag ? "ویرایش برچسب انتخابی" : "افزودن برچسب جدید"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    نام فارسی برچسب *
                  </label>
                  <Input
                    placeholder="مثال: استایل پاییزه"
                    value={tagNameFa}
                    onChange={(e) => {
                      setTagNameFa(e.target.value);
                      if (!editingTag && !tagSlug) {
                        setTagSlug(e.target.value.trim().toLowerCase().replace(/\s+/g, "-"));
                      }
                    }}
                    className="text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    نامک (Slug) *
                  </label>
                  <Input
                    placeholder="autumn-style"
                    value={tagSlug}
                    onChange={(e) => setTagSlug(e.target.value)}
                    dir="ltr"
                    className="font-mono text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    ترجمه انگلیسی (اختیاری)
                  </label>
                  <Input
                    placeholder="Autumn Style"
                    value={tagNameEn}
                    onChange={(e) => setTagNameEn(e.target.value)}
                    dir="ltr"
                    className="text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    ترجمه عربی (اختیاری)
                  </label>
                  <Input
                    placeholder="أزياء الخريف"
                    value={tagNameAr}
                    onChange={(e) => setTagNameAr(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingTag && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTag(null);
                      setTagNameFa("");
                      setTagSlug("");
                      setTagNameEn("");
                      setTagNameAr("");
                    }}
                    className="text-xs"
                  >
                    انصراف از ویرایش
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveTag}
                  disabled={isSavingTag}
                  className="bg-[#0082CA] hover:bg-[#006CA8] text-white text-xs font-bold"
                >
                  {isSavingTag ? "در حال ذخیره..." : editingTag ? "به‌روزرسانی برچسب" : "افزودن برچسب"}
                </Button>
              </div>
            </div>

            {/* Tags List */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">برچسب‌های موجود ({tags.length})</p>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-sky-100 rounded-xl bg-white">
                {tags.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">برچسبی ثبت نشده است.</p>
                ) : (
                  tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <TagIcon className="w-4 h-4 text-[#0082CA]" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{tag.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span dir="ltr">slug: {tag.slug}</span>
                            {tag.name_en && <span>• EN: {tag.name_en}</span>}
                            {tag.name_ar && <span>• AR: {tag.name_ar}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleEditTagClick(tag)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-600 hover:text-[#0082CA]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => setDeleteTagId(tag.id)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsTagModalOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTagId)}
        onOpenChange={(open) => !open && setDeleteTagId(null)}
        title="حذف برچسب"
        description="آیا از حذف این برچسب اطمینان دارید؟"
        confirmText="حذف برچسب"
        variant="destructive"
        onConfirm={handleDeleteTag}
      />
    </div>
  );
}

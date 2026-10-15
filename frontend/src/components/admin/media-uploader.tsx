"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { UploadCloud, Image as ImageIcon, X, Check, Loader2, Link2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { getApiErrorMessage } from "@/lib/error-utils";

interface MediaUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: "square" | "portrait" | "banner";
  requiredLandscape?: boolean;
}

interface ImageDimensionMeta {
  width: number;
  height: number;
  isLandscape: boolean;
  ratio: number;
}

export default function MediaUploader({
  value,
  onChange,
  label = "تصویر محصول / بنر",
  helperText,
  aspectRatio = "portrait",
  requiredLandscape,
}: MediaUploaderProps) {
  const isBannerMode = aspectRatio === "banner" || requiredLandscape === true;
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value || "");
  const [imageMeta, setImageMeta] = useState<ImageDimensionMeta | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to inspect image dimensions from either File or URL
  const inspectDimensions = useCallback((src: string | File): Promise<ImageDimensionMeta> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let objectUrl: string | null = null;

      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const isLandscape = width > height;
        const ratio = height > 0 ? Number((width / height).toFixed(2)) : 1;

        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        resolve({ width, height, isLandscape, ratio });
      };

      img.onerror = () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        reject(new Error("Failed to load image"));
      };

      if (typeof src === "string") {
        img.src = src;
      } else {
        objectUrl = URL.createObjectURL(src);
        img.src = objectUrl;
      }
    });
  }, []);

  // Inspect initial/changed value
  useEffect(() => {
    if (value && typeof value === "string" && value.trim()) {
      setUrlInput(value);
      inspectDimensions(value)
        .then((meta) => setImageMeta(meta))
        .catch(() => setImageMeta(null));
    } else {
      setImageMeta(null);
    }
  }, [value, inspectDimensions]);

  const handleFileSelect = async (file?: File) => {
    if (!file) return;

    // Validate type & size
    if (!file.type.startsWith("image/")) {
      toast.error("لطفاً فقط فایل تصویری (JPG, PNG, WEBP) انتخاب نمایید.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیش از ۱۵ مگابایت باشد.");
      return;
    }

    // Dimension & orientation inspection
    try {
      const meta = await inspectDimensions(file);
      if (isBannerMode && !meta.isLandscape) {
        toast.error("تصویر بنر باید افقی (Landscape) باشد. تصاویر عمودی یا مربعی برای بنر مجاز نیستند.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (isBannerMode && (meta.ratio < 1.4 || meta.ratio > 2.3)) {
        toast.info(
          `تصویر افقی تایید شد (${meta.width}×${meta.height}). برای بهترین نمایش، نسبت استاندارد ۱۶:۹ پیشنهاد می‌شود.`
        );
      }

      setImageMeta(meta);
    } catch {
      // If client dimension reading fails, still allow proceed to backend validation
    }

    setIsUploading(true);
    try {
      const res = await adminApi.uploadImage(file);
      const uploadedUrl = res.image_url || res.url;
      onChange(uploadedUrl);
      setUrlInput(uploadedUrl);
      toast.success("تصویر با موفقیت در سرور ذخیره شد.");
    } catch (e: any) {
      console.error("Upload failed:", e);
      toast.error(getApiErrorMessage(e, "خطا در بارگذاری تصویر روی سرور"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlChange = async (newUrl: string) => {
    setUrlInput(newUrl);
    onChange(newUrl);

    if (!newUrl.trim()) {
      setImageMeta(null);
      return;
    }

    try {
      const meta = await inspectDimensions(newUrl.trim());
      setImageMeta(meta);

      if (isBannerMode && !meta.isLandscape) {
        toast.warning(
          "هشدار: این تصویر افقی نیست (عمودی/مربعی است) و برای بنر نامناسب خواهد بود."
        );
      }
    } catch {
      setImageMeta(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const getAspectClass = () => {
    if (aspectRatio === "square") return "aspect-square max-w-[200px]";
    if (aspectRatio === "banner") return "aspect-[16/9] w-full max-h-56";
    return "aspect-[3/4] max-w-[180px]";
  };

  return (
    <div className="space-y-3 text-right" dir="rtl">
      {/* Label and mode toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-300">{label}</label>
          {isBannerMode && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              افقی ۱۶:۹
            </span>
          )}
        </div>

        <div className="flex gap-1 bg-[#181818] p-0.5 rounded-lg border border-white/10 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === "upload" ? "bg-white text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            آپلود مستقیم
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === "url" ? "bg-white text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            لینک تصویر (CDN)
          </button>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-gray-400 leading-relaxed -mt-1">{helperText}</p>
      )}

      {activeTab === "upload" ? (
        <div className="space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            accept="image/*"
            className="hidden"
          />

          {value ? (
            /* Uploaded Image Preview */
            <div className="space-y-3 p-4 bg-[#181818] border border-white/10 rounded-2xl overflow-hidden">
              <div className={`relative ${getAspectClass()} mx-auto rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center`}>
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder-product.svg";
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      تصویر بارگذاری شده
                    </span>
                    {imageMeta && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                          imageMeta.isLandscape
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {imageMeta.width}×{imageMeta.height} ({imageMeta.isLandscape ? "افقی" : "عمودی"})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono truncate max-w-sm" dir="ltr">
                    {value}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    variant="outline"
                    className="h-8 px-3 text-xs border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl cursor-pointer"
                  >
                    تغییر تصویر
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setUrlInput("");
                      setImageMeta(null);
                    }}
                    variant="ghost"
                    className="h-8 px-3 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                  >
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Drag and Drop Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? "border-[#0082CA] bg-[#0082CA]/10"
                  : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              {isUploading ? (
                <div className="space-y-2 py-4">
                  <Loader2 className="w-8 h-8 text-[#0082CA] animate-spin mx-auto" />
                  <p className="text-xs text-gray-300 font-bold">در حال پردازش و تبدیل تصویر به فرمت بهینه WebP...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <UploadCloud className="w-6 h-6 text-[#0082CA]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">
                      فایل را اینجا بکشید یا برای انتخاب کلیک کنید
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {isBannerMode
                        ? "تصویر افقی با نسبت ۱۶:۹ (حداقل ۱۶۰۰×۹۰۰) — JPG, PNG, WEBP تا ۱۵ مگابایت"
                        : "فرمت‌های مجاز: JPG, PNG, WEBP (حداکثر ۱۵ مگابایت)"}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Manual URL / CDN Input */
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://cdn.example.com/banners/hero-spring.jpg"
                className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl font-mono pl-8"
                dir="ltr"
              />
              <Link2 className="w-4 h-4 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {urlInput && (
              <Button
                type="button"
                onClick={() => handleUrlChange("")}
                variant="ghost"
                className="h-11 px-3 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Validation Feedback & Preview for URL */}
          {urlInput && (
            <div className="p-3 bg-[#181818] border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                {imageMeta ? (
                  imageMeta.isLandscape ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                      <Check className="w-3.5 h-3.5" />
                      تصویر افقی معتبر ({imageMeta.width}×{imageMeta.height} — نسبت {imageMeta.ratio}:1)
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1.5 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      تصویر عمودی یا مربعی است ({imageMeta.width}×{imageMeta.height}). برای بنر از تصویر افقی استفاده کنید.
                    </span>
                  )
                ) : (
                  <span className="text-gray-400 text-[11px] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    در حال اعتبارسنجی تصویر از آدرس اینترنتی...
                  </span>
                )}
              </div>

              <div className={`relative ${getAspectClass()} rounded-lg overflow-hidden bg-black/40 border border-white/5`}>
                <img
                  src={urlInput}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setImageMeta(null)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

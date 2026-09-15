"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Check,
  Loader2,
  Link2,
  Star,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { getApiErrorMessage } from "@/lib/error-utils";

interface MultiMediaUploaderProps {
  values?: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxFiles?: number;
}

export default function MultiMediaUploader({
  values = [],
  onChange,
  label = "تصاویر محصول (گالری چندتایی)",
  maxFiles = 20,
}: MultiMediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = async (files?: FileList | File[] | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate maximum limit
    if (values.length + fileArray.length > maxFiles) {
      toast.error(`حداکثر می‌توانید ${maxFiles} تصویر برای یک محصول آپلود کنید.`);
      return;
    }

    // Validate format and size
    const validFiles: File[] = [];
    for (const f of fileArray) {
      if (!f.type.startsWith("image/")) {
        toast.error(`فایل "${f.name}" تصویر معتبر نیست.`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`حجم فایل "${f.name}" بیشتر از ۱۰ مگابایت است.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: validFiles.length });

    const newUploadedUrls: string[] = [];
    let completedCount = 0;

    for (const file of validFiles) {
      try {
        const res = await adminApi.uploadImage(file);
        const uploadedUrl = res.image_url || res.url;
        if (uploadedUrl) {
          newUploadedUrls.push(uploadedUrl);
        }
      } catch (e: any) {
        console.error(`Upload failed for ${file.name}:`, e);
        toast.error(getApiErrorMessage(e, `خطا در بارگذاری فایل ${file.name}`));
      } finally {
        completedCount++;
        setUploadProgress({ current: completedCount, total: validFiles.length });
      }
    }

    if (newUploadedUrls.length > 0) {
      const updated = [...values, ...newUploadedUrls];
      onChange(updated);
      toast.success(`${newUploadedUrls.length} تصویر با موفقیت آپلود شد.`);
    }

    setIsUploading(false);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://") && !cleanUrl.startsWith("/")) {
      toast.error("لطفاً آدرس معتبر اینترنتی تصویر را وارد کنید.");
      return;
    }

    if (values.includes(cleanUrl)) {
      toast.error("این تصویر قبلاً اضافه شده است.");
      return;
    }

    const updated = [...values, cleanUrl];
    onChange(updated);
    setUrlInput("");
    toast.success("لینک تصویر به گالری اضافه شد.");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = values.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
    toast.info("تصویر از گالری حذف شد.");
  };

  const handleSetAsPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const target = values[indexToPrimary];
    const rest = values.filter((_, idx) => idx !== indexToPrimary);
    const updated = [target, ...rest];
    onChange(updated);
    toast.success("این تصویر به عنوان تصویر شاخص (کاور کالا) تنظیم شد.");
  };

  const handleMove = (index: number, direction: "left" | "right") => {
    const newIndex = direction === "left" ? index + 1 : index - 1;
    if (newIndex < 0 || newIndex >= values.length) return;

    const updated = [...values];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    onChange(updated);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Label and mode toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            {label}
          </label>
          <p className="text-[11px] text-gray-400">
            اولین تصویر به عنوان عکس شاخص کالا در کاتالوگ و کارت‌ها نمایش داده می‌شود.
          </p>
        </div>

        <div className="flex gap-1 bg-[#181818] p-0.5 rounded-lg border border-white/10 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "upload"
                ? "bg-white text-black font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            آپلود مستقیم
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "url"
                ? "bg-white text-black font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            افزودن لینک
          </button>
        </div>
      </div>

      {/* Hidden Multi-file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFilesSelect(e.target.files)}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Upload or URL input area */}
      {activeTab === "upload" ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? "border-amber-400 bg-amber-400/10"
              : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10"
          }`}
        >
          {isUploading ? (
            <div className="space-y-2 py-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-gray-300 font-bold">
                در حال بارگذاری تصاویر روی سرور...
              </p>
              {uploadProgress && (
                <div className="flex items-center justify-center gap-2 text-[11px] text-amber-400 font-mono" dir="ltr">
                  <span>
                    {uploadProgress.current} / {uploadProgress.total}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                <UploadCloud className="w-6 h-6 text-amber-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">
                  تصاویر را اینجا بکشید یا برای انتخاب دسته‌جمعی کلیک کنید
                </p>
                <p className="text-[10px] text-gray-500">
                  انتخاب همزمان چندین تصویر مجاز است (JPG, PNG, WEBP تا ۱۰ مگابایت)
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="https://example.com/dress-front.jpg"
            className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl font-sans"
            dir="ltr"
          />
          <Button
            type="button"
            onClick={() => handleAddUrl()}
            disabled={!urlInput.trim()}
            className="h-11 px-4 text-xs font-bold bg-white text-black hover:bg-gray-200 rounded-xl shrink-0"
          >
            <Plus className="w-4 h-4 ml-1" />
            افزودن به گالری
          </Button>
        </div>
      )}

      {/* Image Gallery Grid */}
      {values.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              گالری کالا: <strong className="text-white font-bold">{values.length}</strong> تصویر
            </span>
            <span className="text-[10px] text-zinc-500">
              با دکمه‌های زیر هر عکس می‌توانید ترتیب و تصویر شاخص را تعیین کنید
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {values.map((url, idx) => {
              const isPrimary = idx === 0;

              return (
                <div
                  key={`${url}-${idx}`}
                  className={`group relative rounded-xl overflow-hidden bg-[#181818] border transition-all flex flex-col ${
                    isPrimary
                      ? "border-amber-400 ring-2 ring-amber-400/30"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {/* Aspect Preview Container */}
                  <div className="relative aspect-[3/4] w-full bg-black/40 overflow-hidden">
                    <img
                      src={url}
                      alt={`Product image ${idx + 1}`}
                      className="w-full h-full object-cover object-center"
                    />

                    {/* Primary Badge */}
                    {isPrimary && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[10px] font-black flex items-center gap-1 shadow-lg">
                          <Star className="w-3 h-3 fill-current" />
                          عکس شاخص
                        </span>
                      </div>
                    )}

                    {/* Index Number Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-mono border border-white/10">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Delete button (top right overlay on non-primary, or corner) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white backdrop-blur-md transition-colors opacity-90 hover:opacity-100 z-10"
                      title="حذف این تصویر"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Action Bar Beneath Each Image */}
                  <div className="p-1.5 bg-[#141414] border-t border-white/5 flex items-center justify-between gap-1 text-[10px]">
                    {/* Make Cover Button */}
                    {!isPrimary ? (
                      <button
                        type="button"
                        onClick={() => handleSetAsPrimary(idx)}
                        className="text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-0.5 truncate"
                        title="تنظیم به عنوان تصویر اصلی"
                      >
                        <Star className="w-3 h-3" />
                        شاخص
                      </button>
                    ) : (
                      <span className="text-amber-400 font-bold text-[10px]">کاور اصلی</span>
                    )}

                    {/* Order Controls */}
                    <div className="flex items-center gap-1 mr-auto" dir="ltr">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, "right")}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
                        title="انتقال به قبل"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === values.length - 1}
                        onClick={() => handleMove(idx, "left")}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
                        title="انتقال به بعد"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Card */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[3/4] rounded-xl border border-dashed border-white/20 hover:border-amber-400/50 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-[11px] font-bold">افزودن تصویر</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

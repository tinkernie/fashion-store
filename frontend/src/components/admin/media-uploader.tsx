"use client";

import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, X, Check, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";

interface MediaUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: "square" | "portrait" | "banner";
}

export default function MediaUploader({
  value,
  onChange,
  label = "تصویر محصول / بنر",
  aspectRatio = "portrait",
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file?: File) => {
    if (!file) return;

    // Validate type & size
    if (!file.type.startsWith("image/")) {
      toast.error("لطفاً فقط فایل تصویری (JPG, PNG, WEBP) انتخاب نمایید.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیش از ۱۰ مگابایت باشد.");
      return;
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
      toast.error(e?.response?.data?.detail || "خطا در بارگذاری تصویر روی سرور");
    } finally {
      setIsUploading(false);
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
    if (aspectRatio === "banner") return "aspect-[21/9] w-full";
    return "aspect-[3/4] max-w-[180px]";
  };

  return (
    <div className="space-y-3 text-right" dir="rtl">
      {/* Label and mode toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-300">{label}</label>
        <div className="flex gap-1 bg-[#181818] p-0.5 rounded-lg border border-white/10 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "upload" ? "bg-white text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            آپلود مستقیم
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === "url" ? "bg-white text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            لینک تصویر
          </button>
        </div>
      </div>

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
            <div className="flex items-start gap-4 p-4 bg-[#181818] border border-white/10 rounded-2xl">
              <div className={`relative ${getAspectClass()} rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0`}>
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  تصویر آماده است
                </span>
                <p className="text-[11px] text-gray-400 font-mono truncate max-w-xs" dir="ltr">
                  {value}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    variant="outline"
                    className="h-8 text-xs border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl"
                  >
                    تغییر تصویر
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setUrlInput("");
                    }}
                    variant="ghost"
                    className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl"
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
                  ? "border-amber-400 bg-amber-400/10"
                  : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              {isUploading ? (
                <div className="space-y-2 py-4">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <p className="text-xs text-gray-300 font-bold">در حال بارگذاری تصویر روی سرور...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <UploadCloud className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">
                      فایل را اینجا بکشید یا برای انتخاب کلیک کنید
                    </p>
                    <p className="text-[10px] text-gray-500">
                      فرمت‌های مجاز: JPG, PNG, WEBP (حداکثر ۱۰ مگابایت)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Manual URL Input */
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="https://example.com/image.jpg"
            className="bg-[#181818] border-white/10 h-11 text-xs text-white rounded-xl font-sans"
            dir="ltr"
          />
          {urlInput && (
            <Button
              type="button"
              onClick={() => {
                setUrlInput("");
                onChange("");
              }}
              variant="ghost"
              className="h-11 px-3 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

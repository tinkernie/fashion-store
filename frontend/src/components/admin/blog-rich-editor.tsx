"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Table as TableIcon,
  Minus,
  Code,
  Code2,
  Undo,
  Redo,
  Sparkles,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface BlogRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  dir?: "rtl" | "ltr";
}

const ALLOWED_FONTS = [
  { label: "وزیرمتن (پیش‌فرض)", value: "Vazirmatn" },
  { label: "استعداد (Estedad)", value: "Estedad" },
  { label: "نسخ عربی (Noto Naskh)", value: "Noto Naskh Arabic" },
  { label: "تاهوما (Tahoma)", value: "Tahoma" },
  { label: "آریال (Arial)", value: "Arial" },
];

const ALLOWED_SIZES = [
  { label: "کوچک (12px)", value: "12px" },
  { label: "معمولی (14px)", value: "14px" },
  { label: "متن بدنه (16px)", value: "16px" },
  { label: "متوسط (18px)", value: "18px" },
  { label: "بزرگ (20px)", value: "20px" },
  { label: "تیتر کوچک (24px)", value: "24px" },
  { label: "تیتر بزرگ (28px)", value: "28px" },
];

const PRESET_COLORS = [
  { label: "مشکی تیره", value: "#0f172a" },
  { label: "آبی ماوی", value: "#0082CA" },
  { label: "خاکستری", value: "#64748b" },
  { label: "سبز زمردی", value: "#059669" },
  { label: "کهربایی", value: "#d97706" },
  { label: "یاقوتی", value: "#e11d48" },
];

export default function BlogRichEditor({
  value,
  onChange,
  placeholder = "محتوای مقاله را اینجا بنویسید...",
  minHeight = "400px",
  dir = "rtl",
}: BlogRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceCode, setSourceCode] = useState(value || "");

  // Purely compute word count without effect setState cascading
  const wordCount = useMemo(() => {
    if (!value) return 0;
    const txt = value.replace(/<[^>]*>/g, " ").trim();
    return txt ? txt.split(/\s+/).filter(Boolean).length : 0;
  }, [value]);

  // Dialog Modals
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");

  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaEmbedUrl, setMediaEmbedUrl] = useState("");
  const [mediaType, setMediaType] = useState<"embed" | "video">("embed");

  // Sync incoming value to contentEditable on initial mount or when switching modes
  useEffect(() => {
    if (editorRef.current && !isSourceMode) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, isSourceMode]);

  const sanitizeClientHtml = (html: string): string => {
    if (typeof window === "undefined") return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Remove scripts and style tags
    doc.querySelectorAll("script, style, link, meta").forEach((el) => el.remove());

    // Convert any h1 to h2 (h1 is reserved for page title)
    doc.querySelectorAll("h1").forEach((el) => {
      const h2 = doc.createElement("h2");
      h2.innerHTML = el.innerHTML;
      el.replaceWith(h2);
    });

    // Convert div to p
    doc.querySelectorAll("div").forEach((el) => {
      const p = doc.createElement("p");
      p.innerHTML = el.innerHTML;
      el.replaceWith(p);
    });

    return doc.body.innerHTML;
  };

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const rawHtml = editorRef.current.innerHTML;
    const cleaned = sanitizeClientHtml(rawHtml);
    setSourceCode(cleaned);
    onChange(cleaned);
  }, [onChange]);

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setSourceCode(newVal);
    onChange(newVal);
  };

  // Helper to execute document commands safely
  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    if (isSourceMode) return;
    document.execCommand(cmd, false, val);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleFormatBlock = (tag: string) => {
    execCmd("formatBlock", `<${tag}>`);
  };

  const handleApplyFont = (fontFamily: string) => {
    if (!fontFamily || isSourceMode) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontFamily = fontFamily;
    try {
      range.surroundContents(span);
    } catch {
      execCmd("fontName", fontFamily);
    }
    handleInput();
  };

  const handleApplySize = (fontSize: string) => {
    if (!fontSize || isSourceMode) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = fontSize;
    try {
      range.surroundContents(span);
    } catch {
      // fallback
    }
    handleInput();
  };

  const handleApplyColor = (color: string) => {
    if (!color || isSourceMode) return;
    execCmd("foreColor", color);
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.trim();
    if (linkText.trim()) {
      const a = `<a href="${url}" target="_blank" rel="noopener">${linkText.trim()}</a>`;
      execCmd("insertHTML", a);
    } else {
      execCmd("createLink", url);
    }
    setLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleInsertImage = () => {
    if (!imageUrl.trim()) return;
    const url = imageUrl.trim();
    const alt = imageAlt.trim() || "تصویر مقاله";
    const caption = imageCaption.trim();

    let html = "";
    if (caption) {
      html = `<figure class="my-6 text-center"><img src="${url}" alt="${alt}" class="rounded-2xl max-w-full mx-auto shadow-sm" /><figcaption class="text-xs text-slate-500 mt-2">${caption}</figcaption></figure>`;
    } else {
      html = `<figure class="my-6"><img src="${url}" alt="${alt}" class="rounded-2xl max-w-full mx-auto shadow-sm" /></figure>`;
    }
    execCmd("insertHTML", html);
    setImageModalOpen(false);
    setImageUrl("");
    setImageAlt("");
    setImageCaption("");
  };

  const handleInsertMedia = () => {
    if (!mediaEmbedUrl.trim()) return;
    const url = mediaEmbedUrl.trim();

    let html = "";
    if (mediaType === "embed") {
      // Aparat or YouTube embed
      let src = url;
      if (url.includes("aparat.com/v/")) {
        const id = url.split("v/")[1]?.split("/")[0]?.split("?")[0];
        src = `https://www.aparat.com/video/video/embed/videohash/${id}/vt/frame`;
      } else if (url.includes("youtube.com/watch")) {
        const id = new URL(url).searchParams.get("v");
        src = `https://www.youtube-nocookie.com/embed/${id}`;
      } else if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0];
        src = `https://www.youtube-nocookie.com/embed/${id}`;
      }

      html = `<div class="aspect-video w-full my-6 rounded-2xl overflow-hidden shadow-sm bg-slate-900"><iframe src="${src}" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    } else {
      // Direct MP4/WebM video
      html = `<div class="w-full my-6 rounded-2xl overflow-hidden shadow-sm bg-black"><video src="${url}" controls class="w-full max-h-[500px]"></video></div>`;
    }

    execCmd("insertHTML", html);
    setMediaModalOpen(false);
    setMediaEmbedUrl("");
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table class="w-full my-6 border-collapse border border-slate-200 rounded-xl overflow-hidden text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <th class="p-3 text-right border-l border-slate-200">عنوان ۱</th>
            <th class="p-3 text-right border-l border-slate-200">عنوان ۲</th>
            <th class="p-3 text-right">عنوان ۳</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr>
            <td class="p-3 border-l border-slate-200">محتوا ۱</td>
            <td class="p-3 border-l border-slate-200">محتوا ۲</td>
            <td class="p-3">محتوا ۳</td>
          </tr>
          <tr>
            <td class="p-3 border-l border-slate-200">محتوا ۴</td>
            <td class="p-3 border-l border-slate-200">محتوا ۵</td>
            <td class="p-3">محتوا ۶</td>
          </tr>
        </tbody>
      </table>
    `;
    execCmd("insertHTML", tableHtml);
  };

  // Clean paste handler to prevent disallowed markup injection
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const html = e.clipboardData.getData("text/html");

    if (html) {
      const cleaned = sanitizeClientHtml(html);
      execCmd("insertHTML", cleaned);
    } else {
      execCmd("insertText", text);
    }
  };

  return (
    <div className="w-full border border-sky-100 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col font-sans">
      {/* Toolbar */}
      <div className="bg-slate-50/80 border-b border-sky-100 p-2 flex flex-wrap items-center gap-1.5 select-none" dir="rtl">
        {/* Undo / Redo */}
        <div className="flex items-center bg-white rounded-lg border border-slate-200/80 p-0.5">
          <button
            type="button"
            onClick={() => execCmd("undo")}
            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors"
            title="بازگردانی (Undo)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("redo")}
            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors"
            title="تکرار (Redo)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center bg-white rounded-lg border border-slate-200/80 p-0.5">
          <button
            type="button"
            onClick={() => handleFormatBlock("p")}
            className="px-2 py-1 text-xs font-semibold hover:bg-slate-100 text-slate-700 rounded transition-colors flex items-center gap-1"
            title="پاراگراف عادی"
          >
            <Pilcrow className="w-3.5 h-3.5" />
            <span>متن</span>
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock("h2")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="تیتر اصلی ۲ (H2)"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock("h3")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="زیرتیتر ۳ (H3)"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock("h4")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="بخش ۴ (H4)"
          >
            <Heading4 className="w-4 h-4" />
          </button>
        </div>

        {/* Inline formatting */}
        <div className="flex items-center bg-white rounded-lg border border-slate-200/80 p-0.5">
          <button
            type="button"
            onClick={() => execCmd("bold")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="ضخیم (Bold)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("italic")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="کج (Italic)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("underline")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="خط زیر (Underline)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("strikeThrough")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="خط‌خورده (Strike)"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock("pre")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="کد یا متن خام"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center bg-white rounded-lg border border-slate-200/80 p-0.5">
          <button
            type="button"
            onClick={() => execCmd("justifyRight")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="راست‌چین"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyCenter")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="وسط‌چین"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyLeft")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="چپ‌چین"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("justifyFull")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="هم‌تراز (Justify)"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center bg-white rounded-lg border border-slate-200/80 p-0.5">
          <button
            type="button"
            onClick={() => execCmd("insertUnorderedList")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="لیست نشانه‌دار"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertOrderedList")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="لیست شماره‌دار"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock("blockquote")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="نقل‌قول"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertHorizontalRule")}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="خط افقی جداکننده"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Fonts & Sizes */}
        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200/80 p-1">
          <select
            onChange={(e) => handleApplyFont(e.target.value)}
            defaultValue=""
            className="text-xs bg-transparent border-0 text-slate-700 cursor-pointer outline-none font-medium"
            title="فونت"
          >
            <option value="" disabled>فونت...</option>
            {ALLOWED_FONTS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          <span className="text-slate-200">|</span>

          <select
            onChange={(e) => handleApplySize(e.target.value)}
            defaultValue=""
            className="text-xs bg-transparent border-0 text-slate-700 cursor-pointer outline-none font-medium"
            title="اندازه قلم"
          >
            <option value="" disabled>اندازه...</option>
            {ALLOWED_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200/80 p-1">
          <Palette className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => handleApplyColor(c.value)}
              className="w-4 h-4 rounded-full border border-black/10 hover:scale-110 transition-transform"
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>

        {/* Media Inserts */}
        <div className="flex items-center bg-white rounded-lg border border-slate-200/80 p-0.5">
          <button
            type="button"
            onClick={() => setLinkModalOpen(true)}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="افزودن لینک"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setImageModalOpen(true)}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="افزودن تصویر"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMediaModalOpen(true)}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="افزودن ویدیو یا آپارات"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertTable}
            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
            title="افزودن جدول"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Source Code Toggle */}
        <div className="mr-auto flex items-center">
          <button
            type="button"
            onClick={() => {
              if (!isSourceMode) {
                setSourceCode(editorRef.current?.innerHTML || value || "");
              }
              setIsSourceMode(!isSourceMode);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
              isSourceMode
                ? "bg-[#0082CA] text-white border-[#0082CA] shadow-sm"
                : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{isSourceMode ? "ویرایشگر بصری" : "کد HTML"}</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 p-4 bg-white" style={{ minHeight }}>
        {isSourceMode ? (
          <textarea
            value={sourceCode}
            onChange={handleSourceChange}
            dir="ltr"
            className="w-full h-full font-mono text-xs text-slate-800 bg-slate-900 text-emerald-400 p-4 rounded-xl outline-none resize-y"
            style={{ minHeight: "360px" }}
            placeholder="<p>HTML محتوا را اینجا وارد کنید...</p>"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            dir={dir}
            className="prose prose-slate max-w-none outline-none focus:outline-none min-h-[360px] text-slate-800 leading-relaxed font-sans text-sm selection:bg-sky-100"
            style={{ minHeight: "360px" }}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 border-t border-sky-100 px-4 py-2 flex items-center justify-between text-xs text-slate-500" dir="rtl">
        <div className="flex items-center gap-3">
          <span>
            تعداد کلمات: <strong className="text-slate-700 font-bold">{wordCount}</strong>
          </span>
          <span>•</span>
          <span>
            زمان تقریبی مطالعه: <strong className="text-slate-700 font-bold">{Math.max(1, Math.round(wordCount / 200))} دقیقه</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Sparkles className="w-3 h-3 text-[#0082CA]" />
          <span>قالب‌بندی مطابق استاندارد امنیتی وبلاگ</span>
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="sm:max-w-[425px] font-sans" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">درج یا ویرایش پیوند (لینک)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">آدرس پیوند (URL)</label>
              <Input
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">متن نمایشی (اختیاری)</label>
              <Input
                placeholder="متن دلخواه پیوند..."
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setLinkModalOpen(false)}>انصراف</Button>
            <Button onClick={handleInsertLink} className="bg-[#0082CA] text-white hover:bg-[#006CA8]">درج پیوند</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="sm:max-w-[425px] font-sans" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">درج تصویر در محتوا</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">آدرس تصویر (URL)</label>
              <Input
                placeholder="https://... یا /media/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">متن جایگزین (Alt Text)</label>
              <Input
                placeholder="توضیح کوتاه تصویر برای سئو..."
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">زیرنویس تصویر (اختیاری)</label>
              <Input
                placeholder="توضیح زیر تصویر..."
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setImageModalOpen(false)}>انصراف</Button>
            <Button onClick={handleInsertImage} className="bg-[#0082CA] text-white hover:bg-[#006CA8]">درج تصویر</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media / Video Dialog */}
      <Dialog open={mediaModalOpen} onOpenChange={setMediaModalOpen}>
        <DialogContent className="sm:max-w-[425px] font-sans" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">درج ویدیو یا فریم چندرسانه‌ای</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mediaType === "embed" ? "default" : "outline"}
                size="sm"
                className={mediaType === "embed" ? "bg-[#0082CA] text-white" : ""}
                onClick={() => setMediaType("embed")}
              >
                آپارات / یوتیوب
              </Button>
              <Button
                type="button"
                variant={mediaType === "video" ? "default" : "outline"}
                size="sm"
                className={mediaType === "video" ? "bg-[#0082CA] text-white" : ""}
                onClick={() => setMediaType("video")}
              >
                فایل ویدیویی (.mp4)
              </Button>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                {mediaType === "embed" ? "لینک ویدیو در آپارات یا یوتیوب" : "آدرس مستقیم فایل MP4"}
              </label>
              <Input
                placeholder={mediaType === "embed" ? "https://www.aparat.com/v/xyz..." : "https://domain.com/video.mp4"}
                value={mediaEmbedUrl}
                onChange={(e) => setMediaEmbedUrl(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setMediaModalOpen(false)}>انصراف</Button>
            <Button onClick={handleInsertMedia} className="bg-[#0082CA] text-white hover:bg-[#006CA8]">درج رسانه</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

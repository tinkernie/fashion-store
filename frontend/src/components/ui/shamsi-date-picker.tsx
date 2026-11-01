"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Calendar, ChevronRight, ChevronLeft, X } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEK_DAYS_SHORT,
  gregorianToJalali,
  jalaliToGregorian,
  getJalaliMonthDays,
  getJalaliFirstDayOfWeek,
  formatShamsiDate,
} from "@/lib/jalali";
import { cn } from "@/lib/utils";

export interface ShamsiDatePickerProps {
  value?: string; // ISO date string, 'YYYY-MM-DD', or Jalali 'YYYY/MM/DD'
  onChange: (dateStr: string) => void;
  outputFormat?: "iso" | "jalali"; // default: "iso"
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  theme?: "dark" | "light"; // default: "dark"
  minYear?: number;
  maxYear?: number;
  yearOrder?: "asc" | "desc";
}

export function ShamsiDatePicker({
  value,
  onChange,
  outputFormat = "iso",
  placeholder = "انتخاب تاریخ...",
  className = "",
  disabled = false,
  theme = "dark",
  minYear,
  maxYear,
  yearOrder,
}: ShamsiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Current today in Jalali
  const today = new Date();
  const [todayJy, todayJm, todayJd] = gregorianToJalali(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );

  const [viewYear, setViewYear] = useState<number>(todayJy);
  const [viewMonth, setViewMonth] = useState<number>(todayJm); // 1-12

  // Parse current selected value to Jalali if present
  let selectedJy: number | null = null;
  let selectedJm: number | null = null;
  let selectedJd: number | null = null;

  if (value && typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    // Check if value is already a Jalali date: YYYY/MM/DD or YYYY-MM-DD with year < 1600
    const jalaliMatch = trimmed.match(/^(1[34]\d{2})[/\-.](0?[1-9]|1[0-2])[/\-.](0?[1-9]|[12]\d|3[01])$/);
    if (jalaliMatch) {
      selectedJy = parseInt(jalaliMatch[1], 10);
      selectedJm = parseInt(jalaliMatch[2], 10);
      selectedJd = parseInt(jalaliMatch[3], 10);
    } else {
      try {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          const [jy, jm, jd] = gregorianToJalali(
            d.getFullYear(),
            d.getMonth() + 1,
            d.getDate()
          );
          selectedJy = jy;
          selectedJm = jm;
          selectedJd = jd;
        }
      } catch {
        // ignore
      }
    }
  }

  // Sync view to selected value when opened
  useEffect(() => {
    if (selectedJy && selectedJm) {
      setViewYear(selectedJy);
      setViewMonth(selectedJm);
    }
  }, [isOpen, selectedJy, selectedJm]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    if (outputFormat === "jalali") {
      const mm = viewMonth < 10 ? `0${viewMonth}` : `${viewMonth}`;
      const dd = day < 10 ? `0${day}` : `${day}`;
      onChange(`${viewYear}/${mm}/${dd}`);
    } else {
      const [gy, gm, gd] = jalaliToGregorian(viewYear, viewMonth, day);
      const mm = gm < 10 ? `0${gm}` : `${gm}`;
      const dd = gd < 10 ? `0${gd}` : `${gd}`;
      onChange(`${gy}-${mm}-${dd}`);
    }
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    if (outputFormat === "jalali") {
      const mm = todayJm < 10 ? `0${todayJm}` : `${todayJm}`;
      const dd = todayJd < 10 ? `0${todayJd}` : `${todayJd}`;
      onChange(`${todayJy}/${mm}/${dd}`);
    } else {
      const [gy, gm, gd] = jalaliToGregorian(todayJy, todayJm, todayJd);
      const mm = gm < 10 ? `0${gm}` : `${gm}`;
      const dd = gd < 10 ? `0${gd}` : `${gd}`;
      onChange(`${gy}-${mm}-${dd}`);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  // Calendar calculations
  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const firstDayOfWeek = getJalaliFirstDayOfWeek(viewYear, viewMonth); // 0 (شنبه) to 6 (جمعه)

  // Generate Year options
  const startYear = minYear ?? (outputFormat === "jalali" ? 1320 : todayJy - 5);
  const endYear = maxYear ?? (outputFormat === "jalali" ? todayJy : todayJy + 15);
  const isDesc = yearOrder ?? (outputFormat === "jalali" ? "desc" : "asc");

  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      list.push(y);
    }
    return isDesc === "desc" ? list.reverse() : list;
  }, [startYear, endYear, isDesc]);

  // Display text in button
  const displayText = useMemo(() => {
    if (!value) return null;
    if (selectedJy && selectedJm && selectedJd) {
      return `${selectedJd.toLocaleString("fa-IR")} ${JALALI_MONTH_NAMES[selectedJm - 1]} ${selectedJy.toLocaleString("fa-IR").replace(/٬|,/g, "")}`;
    }
    return formatShamsiDate(value, { mode: "full" });
  }, [value, selectedJy, selectedJm, selectedJd]);

  const isLight = theme === "light";

  return (
    <div className={cn("relative w-full text-right", className)} dir="rtl">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "w-full text-right flex items-center justify-between transition-colors focus:outline-none shadow-sm cursor-pointer",
              isLight
                ? "h-12 px-3.5 bg-sky-50/50 border border-sky-200 hover:border-sky-300 rounded-xl text-sm text-slate-900 focus:border-[#0082CA] focus:ring-2 focus:ring-[#0082CA]/20"
                : "h-11 px-3 bg-[#141414] border border-white/10 hover:border-white/20 rounded-xl text-xs text-white focus:border-[#0082CA]/70 focus:ring-2 focus:ring-[#0082CA]/30"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Calendar className="w-4 h-4 text-[#0082CA] shrink-0" />
              {displayText ? (
                <span className={cn("font-bold", isLight ? "text-slate-900" : "text-white")}>
                  {displayText}
                </span>
              ) : (
                <span className={isLight ? "text-slate-400 font-normal" : "text-gray-400 font-normal"}>
                  {placeholder}
                </span>
              )}
            </div>
            {value && !disabled && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  isLight
                    ? "hover:text-rose-600 text-slate-400 hover:bg-slate-100"
                    : "hover:text-rose-400 text-gray-400 hover:bg-white/5"
                )}
                title="پاک کردن تاریخ"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          avoidCollisions={true}
          className={cn(
            "w-[min(calc(100vw-32px),320px)] p-4 z-50 rounded-2xl shadow-2xl backdrop-blur-xl",
            isLight
              ? "bg-white border border-slate-200 text-slate-800"
              : "bg-[#121212] border border-white/15 text-white"
          )}
          dir="rtl"
        >
          <div className="space-y-4">
            {/* Header Navigation with Selects */}
            <div
              className={cn(
                "flex items-center justify-between gap-1 pb-3 border-b",
                isLight ? "border-slate-100" : "border-white/10"
              )}
            >
              <button
                type="button"
                onClick={handlePrevMonth}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    : "bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white"
                )}
                title="ماه قبل"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                {/* Month Selector */}
                <Select
                  value={viewMonth.toString()}
                  onValueChange={(val) => setViewMonth(Number(val))}
                >
                  <SelectTrigger
                    className={cn(
                      "h-8 w-[105px] text-xs font-bold rounded-lg cursor-pointer",
                      isLight
                        ? "bg-slate-100 border-slate-200 text-slate-800"
                        : "bg-[#1a1a1a] border-white/10 text-white"
                    )}
                  >
                    <SelectValue placeholder="ماه" />
                  </SelectTrigger>
                  <SelectContent
                    className={cn(
                      "rounded-xl max-h-60",
                      isLight
                        ? "bg-white border-slate-200 text-slate-800 shadow-xl"
                        : "bg-[#1a1a1a] border-white/10 text-white"
                    )}
                  >
                    {JALALI_MONTH_NAMES.map((name, idx) => (
                      <SelectItem
                        key={name}
                        value={(idx + 1).toString()}
                        className="text-xs focus:bg-[#0082CA]/20 cursor-pointer"
                      >
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Year Selector */}
                <Select
                  value={viewYear.toString()}
                  onValueChange={(val) => setViewYear(Number(val))}
                >
                  <SelectTrigger
                    className={cn(
                      "h-8 w-[95px] text-xs font-bold rounded-lg font-mono cursor-pointer",
                      isLight
                        ? "bg-slate-100 border-slate-200 text-slate-800"
                        : "bg-[#1a1a1a] border-white/10 text-white"
                    )}
                  >
                    <SelectValue placeholder="سال" />
                  </SelectTrigger>
                  <SelectContent
                    className={cn(
                      "rounded-xl max-h-60",
                      isLight
                        ? "bg-white border-slate-200 text-slate-800 shadow-xl"
                        : "bg-[#1a1a1a] border-white/10 text-white"
                    )}
                  >
                    {yearOptions.map((y) => (
                      <SelectItem
                        key={y}
                        value={y.toString()}
                        className="text-xs font-mono focus:bg-[#0082CA]/20 cursor-pointer"
                      >
                        {y.toLocaleString("fa-IR").replace(/٬|,/g, "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    : "bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white"
                )}
                title="ماه بعد"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Labels (ش، ی، د...) */}
            <div
              className={cn(
                "grid grid-cols-7 gap-1 text-center text-[11px] font-bold",
                isLight ? "text-slate-400" : "text-gray-400"
              )}
            >
              {JALALI_WEEK_DAYS_SHORT.map((day, idx) => (
                <span
                  key={day}
                  className={idx === 6 ? "text-rose-500" : undefined}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Empty filler slots for previous month offset */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {/* Days of current month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  selectedJy === viewYear &&
                  selectedJm === viewMonth &&
                  selectedJd === dayNum;
                const isToday =
                  todayJy === viewYear &&
                  todayJm === viewMonth &&
                  todayJd === dayNum;
                const isFriday = (firstDayOfWeek + i) % 7 === 6;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={cn(
                      "h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative cursor-pointer",
                      isSelected
                        ? "bg-[#0082CA] text-white shadow-md shadow-[#0082CA]/30 font-black scale-105 z-10"
                        : isToday
                        ? isLight
                          ? "bg-sky-50 text-[#0082CA] border border-sky-300"
                          : "bg-white/15 text-white border border-[#0082CA]/60 text-[#0082CA]"
                        : isFriday
                        ? isLight
                          ? "hover:bg-rose-50 text-rose-500"
                          : "hover:bg-rose-500/20 text-rose-300"
                        : isLight
                        ? "hover:bg-slate-100 text-slate-700"
                        : "hover:bg-white/10 text-gray-200"
                    )}
                  >
                    {dayNum.toLocaleString("fa-IR")}
                    {isToday && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-[#0082CA] absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Shortcuts */}
            <div
              className={cn(
                "flex items-center justify-between pt-3 border-t text-xs",
                isLight ? "border-slate-100" : "border-white/10"
              )}
            >
              <button
                type="button"
                onClick={handleSelectToday}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer",
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    : "bg-white/10 hover:bg-white/20 text-white"
                )}
              >
                امروز ({todayJd.toLocaleString("fa-IR")}{" "}
                {JALALI_MONTH_NAMES[todayJm - 1]})
              </button>

              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  پاک کردن
                </button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ShamsiDatePicker;

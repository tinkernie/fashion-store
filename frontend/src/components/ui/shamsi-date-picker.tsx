"use client";

import React, { useState, useEffect } from "react";
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
  value?: string; // ISO date string or 'YYYY-MM-DD'
  onChange: (isoString: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ShamsiDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ شمسی...",
  className = "",
  disabled = false,
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

  if (value) {
    try {
      const d = new Date(value);
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

  // Sync view to selected value when opened
  useEffect(() => {
    if (selectedJy && selectedJm) {
      setViewYear(selectedJy);
      setViewMonth(selectedJm);
    }
  }, [isOpen]);

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
    const [gy, gm, gd] = jalaliToGregorian(viewYear, viewMonth, day);
    const mm = gm < 10 ? `0${gm}` : `${gm}`;
    const dd = gd < 10 ? `0${gd}` : `${gd}`;
    const isoDate = `${gy}-${mm}-${dd}`;
    onChange(isoDate);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const [gy, gm, gd] = jalaliToGregorian(todayJy, todayJm, todayJd);
    const mm = gm < 10 ? `0${gm}` : `${gm}`;
    const dd = gd < 10 ? `0${gd}` : `${gd}`;
    onChange(`${gy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  // Calendar calculations
  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const firstDayOfWeek = getJalaliFirstDayOfWeek(viewYear, viewMonth); // 0 (شنبه) to 6 (جمعه)

  // Generate Year options (e.g. 1400 to 1415)
  const yearOptions = Array.from({ length: 20 }, (_, i) => todayJy - 5 + i);

  return (
    <div className={cn("relative w-full text-right", className)} dir="rtl">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="w-full h-11 px-3 bg-[#141414] border border-white/10 hover:border-white/20 rounded-xl text-xs text-right flex items-center justify-between text-white transition-colors focus:outline-none focus:border-[#0082CA]/70 focus:ring-2 focus:ring-[#0082CA]/30 shadow-sm"
          >
            <div className="flex items-center gap-2 truncate">
              <Calendar className="w-4 h-4 text-[#0082CA] shrink-0" />
              {value ? (
                <span className="font-bold text-white">
                  {formatShamsiDate(value, { mode: "full" })}
                </span>
              ) : (
                <span className="text-gray-400">{placeholder}</span>
              )}
            </div>
            {value && !disabled && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:text-rose-400 text-gray-400 rounded-md transition-colors"
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
          collisionPadding={16}
          avoidCollisions={true}
          className="w-auto p-4 z-50 bg-[#121212] border border-white/15 text-white rounded-2xl shadow-2xl backdrop-blur-xl"
          dir="rtl"
        >
          <div className="space-y-4 w-[280px] sm:w-[310px]">
            {/* Header Navigation with Selects */}
            <div className="flex items-center justify-between gap-1 border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
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
                  <SelectTrigger className="h-8 w-[105px] text-xs font-bold bg-[#1a1a1a] border-white/10 text-white rounded-lg">
                    <SelectValue placeholder="ماه" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 text-white rounded-xl">
                    {JALALI_MONTH_NAMES.map((name, idx) => (
                      <SelectItem key={name} value={(idx + 1).toString()} className="text-xs focus:bg-[#0082CA]/20">
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
                  <SelectTrigger className="h-8 w-[95px] text-xs font-bold bg-[#1a1a1a] border-white/10 text-white rounded-lg font-mono">
                    <SelectValue placeholder="سال" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 text-white rounded-xl">
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y.toString()} className="text-xs font-mono focus:bg-[#0082CA]/20">
                        {y.toLocaleString("fa-IR").replace(/٬|,/g, "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                title="ماه بعد"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Labels (ش، ی، د...) */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400">
              {JALALI_WEEK_DAYS_SHORT.map((day, idx) => (
                <span
                  key={day}
                  className={idx === 6 ? "text-rose-400" : "text-gray-400"}
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
                      "h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative",
                      isSelected
                        ? "bg-[#0082CA] text-white shadow-md shadow-[#0082CA]/30 font-black scale-105 z-10"
                        : isToday
                        ? "bg-white/15 text-white border border-[#0082CA]/60 text-[#0082CA]"
                        : isFriday
                        ? "hover:bg-rose-500/20 text-rose-300"
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
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
              <button
                type="button"
                onClick={handleSelectToday}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
              >
                امروز ({todayJd.toLocaleString("fa-IR")}{" "}
                {JALALI_MONTH_NAMES[todayJm - 1]})
              </button>

              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
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

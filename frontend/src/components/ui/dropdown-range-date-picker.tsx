"use client";

import * as React from "react";
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export interface ShamsiDateRange {
  from?: string; // ISO date YYYY-MM-DD
  to?: string;   // ISO date YYYY-MM-DD
}

export interface DropdownRangeDatePickerProps {
  value?: ShamsiDateRange;
  onChange?: (range: ShamsiDateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DropdownRangeDatePicker({
  value,
  onChange,
  placeholder = "انتخاب بازه تاریخی به شمسی...",
  className,
  disabled = false,
}: DropdownRangeDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalRange, setInternalRange] = React.useState<ShamsiDateRange | undefined>(value);

  // Sync with controlled value
  React.useEffect(() => {
    setInternalRange(value);
  }, [value]);

  // Current today in Jalali
  const today = new Date();
  const [todayJy, todayJm, todayJd] = gregorianToJalali(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );

  // View state (Year & Month)
  const [viewYear, setViewYear] = React.useState<number>(() => {
    if (value?.from) {
      const d = new Date(value.from);
      if (!isNaN(d.getTime())) {
        return gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())[0];
      }
    }
    return todayJy;
  });

  const [viewMonth, setViewMonth] = React.useState<number>(() => {
    if (value?.from) {
      const d = new Date(value.from);
      if (!isNaN(d.getTime())) {
        return gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())[1];
      }
    }
    return todayJm;
  });

  // Year options: e.g. 1395 to 1415
  const yearOptions = React.useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => todayJy - 10 + i);
  }, [todayJy]);

  // Convert Jalali [y, m, d] to ISO 'YYYY-MM-DD'
  const toIso = (y: number, m: number, d: number) => {
    const [gy, gm, gd] = jalaliToGregorian(y, m, d);
    const mm = gm < 10 ? `0${gm}` : `${gm}`;
    const dd = gd < 10 ? `0${gd}` : `${gd}`;
    return `${gy}-${mm}-${dd}`;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (day: number) => {
    const clickedIso = toIso(viewYear, viewMonth, day);
    const from = internalRange?.from;
    const to = internalRange?.to;

    if (!from || (from && to)) {
      // Start a new range
      const nextRange: ShamsiDateRange = { from: clickedIso, to: undefined };
      setInternalRange(nextRange);
    } else if (from && !to) {
      // Finish the range
      if (clickedIso < from) {
        setInternalRange({ from: clickedIso, to: from });
      } else {
        setInternalRange({ from, to: clickedIso });
      }
    }
  };

  const handleClear = () => {
    setInternalRange(undefined);
    if (onChange) onChange(undefined);
  };

  const handleApply = () => {
    if (onChange) onChange(internalRange);
    setOpen(false);
  };

  // Calendar calculations
  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const firstDayOfWeek = getJalaliFirstDayOfWeek(viewYear, viewMonth); // 0 (ش) to 6 (ج)

  // Label formatting
  const formattedLabel = React.useMemo(() => {
    const from = internalRange?.from;
    const to = internalRange?.to;
    if (from && to) {
      return `${formatShamsiDate(from, { mode: "full" })} تا ${formatShamsiDate(to, { mode: "full" })}`;
    }
    if (from) {
      return `از ${formatShamsiDate(from, { mode: "full" })}`;
    }
    return placeholder;
  }, [internalRange, placeholder]);

  return (
    <div className={cn("relative inline-block w-full text-right", className)} dir="rtl">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full h-11 justify-between text-right font-normal rounded-xl border border-white/10 bg-[#141414] hover:bg-white/5 hover:border-white/20 px-3 text-xs text-white transition-all shadow-sm focus:ring-2 focus:ring-[#0082CA]/40",
              !internalRange?.from && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <CalendarIcon className="h-4 w-4 text-[#0082CA] shrink-0" />
              <span className="truncate">{formattedLabel}</span>
            </div>
            {internalRange?.from && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 rounded-md text-gray-400 hover:text-rose-400 transition-colors"
                title="پاک کردن بازه"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </span>
            )}
          </Button>
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
          <div className="space-y-4 w-[290px] sm:w-[320px]">
            {/* Header: Month & Year Selects with Navigation */}
            <div className="flex items-center justify-between gap-1 pb-3 border-b border-white/10">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handlePrevMonth}
                className="h-8 w-8 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
                title="ماه قبل"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                {/* Month Dropdown */}
                <Select
                  value={viewMonth.toString()}
                  onValueChange={(val) => setViewMonth(Number(val))}
                >
                  <SelectTrigger className="h-8 w-[110px] text-xs font-bold bg-[#1a1a1a] border-white/10 text-white rounded-lg">
                    <SelectValue placeholder="ماه" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 text-white rounded-xl">
                    {JALALI_MONTH_NAMES.map((name, i) => (
                      <SelectItem key={name} value={(i + 1).toString()} className="text-xs focus:bg-[#0082CA]/20">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Year Dropdown */}
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

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleNextMonth}
                className="h-8 w-8 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
                title="ماه بعد"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekdays Header: Saturday (ش) to Friday (ج) */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-gray-400">
              {JALALI_WEEK_DAYS_SHORT.map((wd, idx) => (
                <div key={wd} className={cn("py-1", idx === 6 && "text-rose-400 font-black")}>
                  {wd}
                </div>
              ))}
            </div>

            {/* Month Day Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty leading days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {/* Days 1 to daysInMonth */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayIso = toIso(viewYear, viewMonth, day);
                const from = internalRange?.from;
                const to = internalRange?.to;

                const isStart = from === dayIso;
                const isEnd = to === dayIso;
                const isSelected = isStart || isEnd;
                const isInRange = Boolean(from && to && dayIso > from && dayIso < to);
                const isToday = viewYear === todayJy && viewMonth === todayJm && day === todayJd;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "h-8 w-full text-xs font-medium rounded-lg transition-all flex items-center justify-center",
                      isSelected
                        ? "bg-[#0082CA] text-white font-bold shadow-md shadow-[#0082CA]/30 scale-105 z-10"
                        : isInRange
                        ? "bg-[#0082CA]/20 text-sky-200 rounded-none first:rounded-r-lg last:rounded-l-lg"
                        : isToday
                        ? "border border-amber-400/60 text-amber-300 hover:bg-white/10"
                        : "text-gray-200 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {day.toLocaleString("fa-IR")}
                  </button>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-white hover:bg-white/5"
              >
                پاک کردن
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={!internalRange?.from}
                className="bg-[#0082CA] hover:bg-[#006CA8] text-white text-xs font-bold px-4 rounded-lg shadow-md shadow-[#0082CA]/20"
              >
                تایید و اعمال
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DropdownRangeDatePicker;

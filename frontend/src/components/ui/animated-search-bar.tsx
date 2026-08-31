"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const defaultFashionSuggestions = [
  "پالتو پشمی کشمیر",
  "پیراهن ماکسی ساتن",
  "کت بلیزر میلان",
  "کیف دستی چرم",
  "بوت چرم نوک‌تیز",
  "شال ابریشم طبیعی",
  "بارانی ضدآب",
  "پیراهن لینن ارگانیک",
  "ست کت و شلوار",
  "اکسسوری چرم دست‌ساز",
];

const GooeyFilter = () => {
  return (
    <svg aria-hidden="true" className="absolute w-0 h-0 pointer-events-none">
      <defs>
        <filter id="goo-effect">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
};

export const isUnsupportedBrowser = () => {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();

  const isSafari =
    ua.includes("safari") &&
    !ua.includes("chrome") &&
    !ua.includes("chromium") &&
    !ua.includes("android") &&
    !ua.includes("firefox");

  const isChromeOniOS = ua.includes("crios");

  return isSafari || isChromeOniOS;
};

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const getResultItemVariants = (index: number, isUnsupported: boolean) => ({
  initial: {
    y: 0,
    scale: 0.3,
    filter: isUnsupported ? "none" : "blur(10px)",
    opacity: 0,
  },
  animate: {
    y: (index + 1) * 52,
    scale: 1,
    filter: "blur(0px)",
    opacity: 1,
  },
  exit: {
    y: isUnsupported ? 0 : -4,
    scale: 0.8,
    opacity: 0,
  },
});

const getResultItemTransition = (index: number) => ({
  duration: 0.65,
  delay: index * 0.08,
  type: "spring" as const,
  bounce: 0.3,
  exit: { duration: 0.2 },
});

export interface AnimatedSearchBarProps {
  suggestions?: string[];
  placeholder?: string;
  buttonLabel?: string;
  initialValue?: string;
  onSearch?: (query: string) => void;
  onSelect?: (item: string) => void;
  autoExpand?: boolean;
  className?: string;
  inputWidth?: number;
}

export function GooeySearchBar({
  suggestions = defaultFashionSuggestions,
  placeholder = "جستجوی محصول، برند، استایل...",
  buttonLabel = "جستجو",
  initialValue = "",
  onSearch,
  onSelect,
  autoExpand = false,
  className,
  inputWidth = 280,
}: AnimatedSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<1 | 2>(autoExpand || initialValue ? 2 : 1);
  const [searchText, setSearchText] = useState(initialValue);
  const [searchData, setSearchData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearchText = useDebounce(searchText, 300);
  const isUnsupported = useMemo(() => isUnsupportedBrowser(), []);

  const handleButtonClick = () => {
    setStep(2);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchText.trim() && onSearch) {
        onSearch(searchText.trim());
        setSearchData([]);
      }
    }
  };

  const handleItemClick = (item: string) => {
    setSearchText(item);
    setSearchData([]);
    if (onSelect) {
      onSelect(item);
    } else if (onSearch) {
      onSearch(item);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSearchData([]);
        if (!searchText && !autoExpand) {
          setStep(1);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchText, autoExpand]);

  useEffect(() => {
    if (step === 2) {
      inputRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (debouncedSearchText.trim()) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        const query = debouncedSearchText.trim().toLowerCase();
        const filtered = suggestions
          .filter((item) => item.toLowerCase().includes(query))
          .slice(0, 4);

        setSearchData(filtered);
        setIsLoading(false);
      }, 200);

      return () => clearTimeout(timer);
    } else {
      setSearchData([]);
      setIsLoading(false);
    }
  }, [debouncedSearchText, suggestions]);

  const buttonVariants = {
    initial: { width: 110 },
    step1: { width: 110 },
    step2: { width: inputWidth },
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col items-center justify-center select-none",
        isUnsupported ? "no-goo" : "filter-gooey",
        className,
      )}
      dir="rtl"
    >
      <GooeyFilter />

      <div className="relative flex justify-center items-center z-30">
        <motion.div
          className="relative flex items-center"
          initial="initial"
          animate={step === 1 ? "step1" : "step2"}
          transition={{ duration: 0.5, type: "spring", bounce: 0.15 }}
        >
          {/* Main Expanding Search Pill */}
          <motion.div
            variants={buttonVariants}
            onClick={handleButtonClick}
            whileHover={{ scale: step === 2 ? 1 : 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex items-center justify-between h-12 bg-white text-black rounded-full px-4 shadow-xl border border-zinc-200 cursor-pointer overflow-hidden transition-colors",
              step === 2 && "cursor-text",
            )}
            role="search"
          >
            {step === 1 ? (
              <div className="flex items-center justify-center w-full gap-2 text-xs md:text-sm font-black text-black">
                <Search className="w-4 h-4 text-black" />
                <span>{buttonLabel}</span>
              </div>
            ) : (
              <div className="flex items-center w-full gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchText}
                  className="w-full bg-transparent border-none outline-none text-xs md:text-sm text-black font-medium placeholder:text-zinc-400 pr-1 pl-6"
                  placeholder={placeholder}
                  aria-label="Search input"
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchText("");
                      setSearchData([]);
                    }}
                    className="p-1 text-zinc-400 hover:text-black rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Trailing Icon Indicator */}
            {step === 2 && (
              <div className="shrink-0 flex items-center justify-center pl-1 text-black">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                ) : (
                  <Search
                    className="w-4 h-4 text-zinc-700 cursor-pointer hover:text-black transition-colors"
                    onClick={() => {
                      if (searchText.trim() && onSearch) {
                        onSearch(searchText.trim());
                        setSearchData([]);
                      }
                    }}
                  />
                )}
              </div>
            )}
          </motion.div>

          {/* Morphing Gooey Search Suggestions Dropdown */}
          <AnimatePresence mode="popLayout">
            {searchData.length > 0 && (
              <motion.div
                key="search-results-list"
                className="absolute top-0 right-0 left-0 flex flex-col items-center z-10 pointer-events-none"
                role="listbox"
                aria-label="Search results"
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <AnimatePresence mode="popLayout">
                  {searchData.map((item, index) => (
                    <motion.div
                      key={item}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      variants={getResultItemVariants(index, isUnsupported)}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={getResultItemTransition(index)}
                      onClick={() => handleItemClick(item)}
                      className="pointer-events-auto absolute flex items-center justify-between bg-white text-black rounded-full px-5 py-2.5 text-xs font-bold shadow-2xl border border-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors"
                      style={{ width: inputWidth - 20, height: 44 }}
                      role="option"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                      <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default GooeySearchBar;

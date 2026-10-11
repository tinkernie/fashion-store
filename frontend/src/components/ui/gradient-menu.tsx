"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  badge?: string | number | React.ReactNode;
}

export interface GradientMenuProps {
  items: MenuItem[];
  activeId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export default function GradientMenu({
  items,
  activeId,
  onChange,
  className,
}: GradientMenuProps) {
  return (
    <div className={cn("flex items-center w-full overflow-x-auto hide-scrollbar py-2", className)} dir="rtl">
      <ul className="flex items-center gap-3 md:gap-4 p-2 bg-white/95 backdrop-blur-xl border border-sky-100 rounded-full shadow-lg shadow-sky-950/5">
        {items.map(({ id, title, icon, badge }) => {
          const isActive = activeId === id;
          return (
            <li
              key={id}
              onClick={() => onChange?.(id)}
              className={cn(
                "relative h-11 sm:h-12 rounded-full flex items-center justify-center px-3.5 sm:px-5 transition-all duration-300 cursor-pointer select-none shrink-0 border gap-2",
                isActive
                  ? "bg-[#0082CA] text-white border-[#0082CA] shadow-md shadow-[#0082CA]/20 font-bold"
                  : "bg-sky-50/60 hover:bg-sky-100/80 text-slate-600 hover:text-slate-900 border-sky-100 hover:border-sky-200 font-medium"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex items-center justify-center shrink-0 text-base",
                  isActive ? "text-white" : "text-slate-500"
                )}
              >
                {icon}
              </div>

              {/* Title & Badge */}
              <div className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm">
                <span>{title}</span>
                {badge !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-sky-100 text-[#006CA8]"
                    )}
                  >
                    {badge}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { GradientMenu };

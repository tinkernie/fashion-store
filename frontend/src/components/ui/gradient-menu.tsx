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
                "relative h-12 rounded-full flex items-center justify-center transition-all duration-500 ease-out cursor-pointer select-none group shrink-0 overflow-hidden",
                isActive
                  ? "w-auto min-w-[160px] px-6 bg-[#0082CA] text-white shadow-lg shadow-[#0082CA]/25 ring-1 ring-[#0082CA]/30 font-bold"
                  : "w-12 hover:min-w-[160px] hover:px-6 bg-sky-50/60 hover:bg-sky-100/80 text-slate-500 hover:text-slate-900 border border-sky-100 hover:border-sky-200"
              )}
            >
              {/* Subtle luxury glow on hover/active */}
              <span
                className={cn(
                  "absolute inset-0 rounded-full transition-opacity duration-500 pointer-events-none -z-10",
                  isActive
                    ? "bg-[#0082CA]/20 blur-md opacity-100"
                    : "bg-sky-200/50 blur-md opacity-0 group-hover:opacity-60"
                )}
              />

              {/* Icon Container: Visible when compact, scales slightly or centers */}
              <div
                className={cn(
                  "flex items-center justify-center transition-all duration-500 shrink-0",
                  isActive
                    ? "opacity-100 ml-2 scale-100 text-white"
                    : "group-hover:opacity-100 group-hover:ml-2 text-slate-500 group-hover:text-slate-900"
                )}
              >
                <span className="text-lg flex items-center">{icon}</span>
              </div>

              {/* Title & Badge: Expands smoothly */}
              <div
                className={cn(
                  "whitespace-nowrap font-bold text-xs md:text-sm transition-all duration-500 flex items-center gap-1.5",
                  isActive
                    ? "opacity-100 scale-100 text-white"
                    : "opacity-0 w-0 group-hover:w-auto group-hover:opacity-100 scale-95 group-hover:scale-100 text-slate-900"
                )}
              >
                <span>{title}</span>
                {badge !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-sky-100 text-slate-700 group-hover:bg-sky-200 group-hover:text-slate-900"
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

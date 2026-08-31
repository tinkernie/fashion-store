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
      <ul className="flex items-center gap-3 md:gap-4 p-2 bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
        {items.map(({ id, title, icon, badge }) => {
          const isActive = activeId === id;
          return (
            <li
              key={id}
              onClick={() => onChange?.(id)}
              className={cn(
                "relative h-12 rounded-full flex items-center justify-center transition-all duration-500 ease-out cursor-pointer select-none group shrink-0 overflow-hidden",
                isActive
                  ? "w-auto min-w-[160px] px-6 bg-white text-black shadow-xl shadow-white/10 ring-1 ring-white/30"
                  : "w-12 hover:min-w-[160px] hover:px-6 bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20"
              )}
            >
              {/* Subtle luxury glow on hover/active */}
              <span
                className={cn(
                  "absolute inset-0 rounded-full transition-opacity duration-500 pointer-events-none -z-10",
                  isActive
                    ? "bg-white/20 blur-md opacity-100"
                    : "bg-white/10 blur-md opacity-0 group-hover:opacity-60"
                )}
              />

              {/* Icon Container: Visible when compact, scales slightly or centers */}
              <div
                className={cn(
                  "flex items-center justify-center transition-all duration-500 shrink-0",
                  isActive
                    ? "opacity-100 ml-2 scale-100 text-black"
                    : "group-hover:opacity-100 group-hover:ml-2 text-zinc-400 group-hover:text-white"
                )}
              >
                <span className="text-lg flex items-center">{icon}</span>
              </div>

              {/* Title & Badge: Expands smoothly */}
              <div
                className={cn(
                  "whitespace-nowrap font-bold text-xs md:text-sm transition-all duration-500 flex items-center gap-1.5",
                  isActive
                    ? "opacity-100 scale-100 text-black"
                    : "opacity-0 w-0 group-hover:w-auto group-hover:opacity-100 scale-95 group-hover:scale-100 text-white"
                )}
              >
                <span>{title}</span>
                {badge !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors",
                      isActive
                        ? "bg-black/10 text-black"
                        : "bg-white/10 text-zinc-300 group-hover:bg-white/20 group-hover:text-white"
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

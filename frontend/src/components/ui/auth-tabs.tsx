"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuthTabsProps {
  activeTab: "login" | "signup";
  onTabChange: (tab: "login" | "signup") => void;
  className?: string;
}

export function AuthTabs({ activeTab, onTabChange, className }: AuthTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="انتخاب نوع ورود یا ثبت‌نام"
      className={cn(
        "relative flex items-center w-full p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/70 select-none shadow-inner shadow-slate-200/50",
        className
      )}
    >
      {/* 1. Login Tab (Right in Persian RTL) */}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "login"}
        onClick={() => onTabChange("login")}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0082CA]",
          activeTab === "login"
            ? "text-[#0082CA] font-black"
            : "text-slate-500 hover:text-slate-900 font-bold"
        )}
      >
        {activeTab === "login" && (
          <motion.div
            layoutId="activeAuthIndicator"
            className="absolute inset-0 bg-white rounded-xl shadow-sm shadow-slate-900/10 border border-slate-200/50"
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <LogIn className="w-4 h-4" />
          <span>ورود</span>
        </span>
      </button>

      {/* 2. Signup Tab (Left in Persian RTL) */}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "signup"}
        onClick={() => onTabChange("signup")}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0082CA]",
          activeTab === "signup"
            ? "text-[#0082CA] font-black"
            : "text-slate-500 hover:text-slate-900 font-bold"
        )}
      >
        {activeTab === "signup" && (
          <motion.div
            layoutId="activeAuthIndicator"
            className="absolute inset-0 bg-white rounded-xl shadow-sm shadow-slate-900/10 border border-slate-200/50"
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          <span>ثبت‌نام</span>
        </span>
      </button>
    </div>
  );
}

export default AuthTabs;

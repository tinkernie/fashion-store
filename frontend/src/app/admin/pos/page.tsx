"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Store, Barcode } from "lucide-react";
import { PosTerminal } from "@/components/admin/pos-terminal";

export default function AdminPosPage() {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/admin" className="hover:text-white transition-colors">
            داشبورد
          </Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-white font-bold">صندوق فروش حضوری و بارکدخوان</span>
        </div>
      </div>

      {/* POS Terminal Wrapper */}
      <div className="bg-[#141414] border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[75vh]">
        <PosTerminal isModal={false} />
      </div>
    </div>
  );
}

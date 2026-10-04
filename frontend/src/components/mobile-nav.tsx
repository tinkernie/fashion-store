"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, User, Search, LayoutGrid } from "lucide-react";
import { useCart } from "@/store/cart";

export default function MobileNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-sky-100 shadow-[0_-4px_20px_rgba(0,130,202,0.06)] pb-safe">
      <div className="flex items-center justify-around h-16 px-4">
        
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/" ? "text-[#0082CA] font-bold" : "text-slate-500 hover:text-[#0082CA]"}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">خانه</span>
        </Link>

        <Link 
          href="/products" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/products" || pathname === "/search" ? "text-[#0082CA] font-bold" : "text-slate-500 hover:text-[#0082CA]"}`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px]">فروشگاه</span>
        </Link>

        <Link 
          href="/checkout" 
          className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/checkout" ? "text-[#0082CA] font-bold" : "text-slate-500 hover:text-[#0082CA]"}`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#0082CA] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">سبد خرید</span>
        </Link>

        <Link 
          href="/profile" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/profile" ? "text-[#0082CA] font-bold" : "text-slate-500 hover:text-[#0082CA]"}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">پروفایل</span>
        </Link>
        
      </div>
    </div>
  );
}
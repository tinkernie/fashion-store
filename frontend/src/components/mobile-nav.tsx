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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0082CA] backdrop-blur-2xl border-t border-white/20 shadow-2xl shadow-[#0082CA]/30 pb-safe text-white">
      <div className="flex items-center justify-around h-16 px-4">
        
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${pathname === "/" ? "text-white font-bold bg-white/15 rounded-xl py-1" : "text-white/75 hover:text-white"}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">خانه</span>
        </Link>

        <Link 
          href="/products" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${pathname === "/products" || pathname === "/search" ? "text-white font-bold bg-white/15 rounded-xl py-1" : "text-white/75 hover:text-white"}`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px]">فروشگاه</span>
        </Link>

        <Link 
          href="/checkout" 
          className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${pathname === "/checkout" ? "text-white font-bold bg-white/15 rounded-xl py-1" : "text-white/75 hover:text-white"}`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-white text-[#0082CA] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-md">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">سبد خرید</span>
        </Link>

        <Link 
          href="/profile" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${pathname === "/profile" ? "text-white font-bold bg-white/15 rounded-xl py-1" : "text-white/75 hover:text-white"}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">پروفایل</span>
        </Link>
        
      </div>
    </div>
  );
}
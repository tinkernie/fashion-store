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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around h-16 px-4">
        
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">خانه</span>
        </Link>

        <Link 
          href="/women" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/women" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-medium">فروشگاه</span>
        </Link>

        <Link 
          href="/checkout" 
          className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/checkout" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-white text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">سبد خرید</span>
        </Link>

        <Link 
          href="/profile" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${pathname === "/profile" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">پروفایل</span>
        </Link>
        
      </div>
    </div>
  );
}
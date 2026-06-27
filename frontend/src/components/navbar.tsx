"use client";

import Link from "next/link";
import { ShoppingBag, User, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/store/cart";

export default function Navbar() {
  const { items, removeItem, getTotal } = useCart();
  
  // Calculate total amount of items in the cart
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="w-full max-w-5xl bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-full h-16 flex items-center justify-between px-8 text-white shadow-2xl">
        {/* Brand Logo */}
        <Link href="/" className="text-xl font-black tracking-widest uppercase text-white">
          فشن استور
        </Link>

        {/* Categories */}
        <div className="hidden md:flex items-center gap-12 text-base font-medium text-gray-300">
          <Link href="/women" className="hover:text-white transition-colors">کالکشن بانوان</Link>
          <Link href="/men" className="hover:text-white transition-colors">کالکشن آقایان</Link>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-6 text-gray-300">
          <button className="hover:text-white transition-colors"><Search className="w-5 h-5" /></button>
          <button className="hover:text-white transition-colors"><User className="w-5 h-5" /></button>
          
          {/* Cart Slide-out Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="relative hover:text-white transition-colors cursor-pointer">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -left-2 bg-white text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {itemCount.toLocaleString('fa-IR')}
                </span>
              </button>
            </SheetTrigger>
            
            <SheetContent side="left" className="bg-[#0a0a0a] border-r-white/10 text-white w-full sm:max-w-md flex flex-col p-6">
              <SheetHeader className="text-right pb-6 border-b border-white/10">
                <SheetTitle className="text-white text-2xl font-black font-sans">سبد خرید</SheetTitle>
              </SheetHeader>
              
              {/* Dynamic Cart Items Container */}
              <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                    <p>سبد خرید شما خالی است</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex gap-4 items-center">
                      <div className="w-20 h-24 bg-[#111111] rounded-xl overflow-hidden border border-white/5 shrink-0">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                        <span className="text-xs text-gray-400">سایز: {item.size} | تعداد: {item.quantity.toLocaleString('fa-IR')}</span>
                        <span className="text-sm font-medium text-gray-300 mt-2">
                          {(item.price * item.quantity).toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id, item.size)}
                        className="text-gray-500 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Summary */}
              {items.length > 0 && (
                <div className="pt-6 border-t border-white/10 space-y-6">
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>جمع کل:</span>
                    <span>{getTotal().toLocaleString('fa-IR')} تومان</span>
                  </div>
                  <Button className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    ثبت سفارش
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
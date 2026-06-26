import Link from "next/link";
import { ShoppingBag, User, Search } from "lucide-react";

export default function Navbar() {
  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="w-full max-w-5xl bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-full h-16 flex items-center justify-between px-8 text-white shadow-2xl">
        {/* Brand Logo */}
        <Link href="/" className="text-xl font-black tracking-widest uppercase text-white">
          فشن استور
        </Link>

        {/* Categories */}
        <div className="hidden md:flex items-center space-x-reverse space-x-10 text-sm font-medium text-gray-300">
          <Link href="/women" className="hover:text-white transition-colors">کالکشن بانوان</Link>
          <Link href="/men" className="hover:text-white transition-colors">کالکشن آقایان</Link>
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-reverse space-x-6 text-gray-300">
          <button className="hover:text-white transition-colors"><Search className="w-5 h-5" /></button>
          <button className="hover:text-white transition-colors"><User className="w-5 h-5" /></button>
          <button className="relative hover:text-white transition-colors">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -left-2 bg-white text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">۰</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
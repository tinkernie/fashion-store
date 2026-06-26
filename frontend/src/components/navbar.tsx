import Link from "next/link";
import { ShoppingBag, User, Search } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="text-xl font-bold tracking-widest uppercase">
          FASHION
        </Link>

        {/* Categories */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide text-gray-600">
          <Link href="/new" className="hover:text-black transition-colors">New Arrivals</Link>
          <Link href="/clothing" className="hover:text-black transition-colors">Clothing</Link>
          <Link href="/accessories" className="hover:text-black transition-colors">Accessories</Link>
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-6 text-gray-700">
          <button className="hover:text-black transition-colors"><Search className="w-5 h-5" /></button>
          <button className="hover:text-black transition-colors"><User className="w-5 h-5" /></button>
          <button className="relative hover:text-black transition-colors">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
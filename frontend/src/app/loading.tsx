import { HoneycombLoader } from "@/components/ui/honeycomb-loader";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-20 pb-24 px-6 max-w-7xl mx-auto" dir="rtl">
      <HoneycombLoader 
        size="lg" 
        text="در حال آماده‌سازی و بارگذاری اطلاعات..." 
      />
    </main>
  );
}
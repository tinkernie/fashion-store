"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, TrendingUp, Sparkles, Flame, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { CollectionsSection } from "@/components/collections-section";
import { CoverflowCarousel, CoverflowSlide } from "@/components/ui/coverflow-carousel";
import { Banner } from "@/components/ui/banner";

export default function Home() {
  const [bestsellers, setBestsellers] = useState<any[]>([]);
  const [heroContent, setHeroContent] = useState({
    badge: "کالکشن جدید ۲۰۲۶",
    headline: "شکوه و ظرافت جاودان",
    subtitle: "طراحی‌های خیره‌کننده با مرغوب‌ترین الیاف کشمیر، ابریشم و چرم طبیعی ایتالیا",
    cta_label: "مشاهده جدیدترین‌ها",
    cta_link: "/women",
    image_url: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1920&auto=format&fit=crop",
  });
  const [announcement, setAnnouncement] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, heroRes, announceRes] = await Promise.allSettled([
          api.get('/api/products/'),
          api.get('/api/site-content/hero/'),
          api.get('/api/site-content/announcement/'),
        ]);

        if (productsRes.status === 'fulfilled') {
          const productsList = Array.isArray(productsRes.value.data) ? productsRes.value.data : productsRes.value.data.results || [];
          setBestsellers(productsList.slice(0, 4));
        }

        if (heroRes.status === 'fulfilled' && heroRes.value.data) {
          const heroData = heroRes.value.data.hero || heroRes.value.data;
          if (heroData && heroData.headline) {
            setHeroContent((prev: any) => ({ ...prev, ...heroData }));
          }
        }

        if (announceRes.status === 'fulfilled' && announceRes.value.data) {
          const annData = announceRes.value.data.announcement || announceRes.value.data;
          if (annData && annData.enabled !== false && annData.text) {
            setAnnouncement(annData);
          }
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      }
    };
    fetchData();
  }, []);

  // 1. جدیدترین محصولات (New Arrivals Slides)
  const newArrivalsSlides: CoverflowSlide[] = [
    {
      src: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=900&auto=format&fit=crop",
      alt: "پالتو پشمی کشمیر Luxe Noir",
      title: "پالتو پشمی کشمیر دست‌دوز Luxe Noir",
      subtitle: "دوخت سفارشی با پشم کشمیر صددرصد طبیعی و آستر ابریشم",
      price: 8450000,
      badge: "جدیدترین ۲۰۲۶",
      href: "/products/prod-1",
      meta: [
        { label: "جنس پارچه", value: "۱۰۰٪ پشم کشمیر ایتالیایی" },
        { label: "کالکشن", value: "پاییز و زمستان ۲۰۲۶" },
        { label: "وضعیت موجودی", value: "موجود در انبار تهران" },
      ],
    },
    {
      src: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=900&auto=format&fit=crop",
      alt: "پیراهن ماکسی ساتن ابریشم Emerald Gala",
      title: "پیراهن ماکسی ساتن ابریشم خالص Emerald Gala",
      subtitle: "طراحی دراماتیک با یقه دراپه و پشت باز اشرافی",
      price: 6900000,
      badge: "کالکشن گالا",
      href: "/products/prod-2",
      meta: [
        { label: "جنس پارچه", value: "ساتن ابریشم توت طبیعی" },
        { label: "رنگ", value: "سبز زمردی اشرافی" },
        { label: "سایزبندی", value: "XS, S, M, L" },
      ],
    },
    {
      src: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=900&auto=format&fit=crop",
      alt: "کت بلیزر ساختاری Milan Tailored",
      title: "کت بلیزر چهار دکمه ساختاری Milan Tailored",
      subtitle: "برش دقیق شانه و فرم آزاد مدرن برای موقعیت‌های رسمی",
      price: 5200000,
      badge: "مینیمال لوکس",
      href: "/products/prod-3",
      meta: [
        { label: "برش و دوخت", value: "تیلور میلان ساختاری" },
        { label: "رنگ", value: "کرم استخوانی مات" },
        { label: "مناسبت", value: "بیزنس و کژوال اشرافی" },
      ],
    },
    {
      src: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=900&auto=format&fit=crop",
      alt: "کیف دستی چرم طبیعی کالفسکین Florence",
      title: "کیف دستی چرم طبیعی کالفسکین Florence Tote",
      subtitle: "دست‌ساز در فلورانس با یراق‌آلات آبکاری طلای ۲۴ عیار",
      price: 4950000,
      badge: "دست‌ساز",
      href: "/products/prod-4",
      meta: [
        { label: "چرم", value: "کالفسکین فول گرین ایتالیا" },
        { label: "یراق‌آلات", value: "آبکاری طلا ضدخش" },
        { label: "گنجایش", value: "لپ‌تاپ تا ۱۳ اینچ" },
      ],
    },
    {
      src: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=900&auto=format&fit=crop",
      alt: "بوت چرم پاشنه‌دار نوک‌تیز Verona",
      title: "بوت چرم پاشنه‌دار نوک‌تیز Verona Heeled Boot",
      subtitle: "پاشنه ۷ سانتی معماری با کفی فوق‌العاده راحت ارگونومیک",
      price: 4600000,
      badge: "پرفروش",
      href: "/products/prod-5",
      meta: [
        { label: "ارتفاع پاشنه", value: "۷ سانتی‌متر ژئومتریک" },
        { label: "کفی", value: "مموری فوم ضدخستگی" },
        { label: "زیپ", value: "YKK ژاپن مخفی" },
      ],
    },
    {
      src: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=900&auto=format&fit=crop",
      alt: "شال ابریشم تویل طرح Renaissance",
      title: "شال ابریشم تویل طرح اختصاصی Renaissance Silk",
      subtitle: "چاپ دیجیتال ارگانیک روی ابریشم ۱۰۰٪ طبیعی با دوردوزی دست‌دوز",
      price: 1850000,
      badge: "اکسسوری لوکس",
      href: "/products/prod-6",
      meta: [
        { label: "ابعاد", value: "۹۰×۹۰ سانتی‌متر" },
        { label: "لبه‌دوزی", value: "لول دست‌دوز هنرمندان" },
        { label: "بسته‌بندی", value: "جعبه کادویی هاردباکس" },
      ],
    },
  ];

  // 2. فروش ویژه (Special Sale Slides)
  const specialSaleSlides: CoverflowSlide[] = [
    {
      src: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=900&auto=format&fit=crop",
      alt: "پالتو فوتر ایتالیایی Camel Classic",
      title: "پالتو فوتر ایتالیایی رنگ شتری Camel Classic",
      subtitle: "کاهش قیمت ویژه به مدت محدود در حراج فصل",
      price: 5760000,
      compareAtPrice: 7200000,
      badge: "۲۰٪ تخفیف",
      href: "/products/prod-1",
      meta: [
        { label: "کد تخفیف ویژه", value: "LUXE20" },
        { label: "میزان تخفیف", value: "۱,۴۴۰,۰۰۰ تومان" },
        { label: "ارسال", value: "رایگان با پست پیشتاز" },
      ],
    },
    {
      src: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=900&auto=format&fit=crop",
      alt: "پیراهن شب ساتن کرپ Ruby Red",
      title: "پیراهن شب ساتن کرپ فرانسوی Ruby Red",
      subtitle: "پرفروش‌ترین پیراهن مجلسی فصل با تخفیف طلایی",
      price: 5200000,
      compareAtPrice: 6500000,
      badge: "۲۰٪ تخفیف",
      href: "/products/prod-2",
      meta: [
        { label: "کد تخفیف", value: "LUXE20" },
        { label: "تخفیف اعمالی", value: "۱,۳۰۰,۰۰۰ تومان" },
        { label: "موجودی باقیمانده", value: "فقط ۵ عدد" },
      ],
    },
    {
      src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=900&auto=format&fit=crop",
      alt: "ست کت و شلوار فرمال Charcoal",
      title: "ست کت و شلوار دوتکه Charcoal Minimal",
      subtitle: "شامل کت بلیزر و شلوار راسته پارچه کرپ ترک",
      price: 4640000,
      compareAtPrice: 5800000,
      badge: "۲۰٪ تخفیف",
      href: "/products/prod-3",
      meta: [
        { label: "تخفیف حراج", value: "۱,۱۶۰,۰۰۰ تومان" },
        { label: "اقلام همراه", value: "کت + شلوار راسته" },
        { label: "ضمانت", value: "۷ روز تعویض سایز رایگان" },
      ],
    },
    {
      src: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=900&auto=format&fit=crop",
      alt: "کیف دوشی چرم کروکودیل Sienna Bag",
      title: "کیف دوشی چرم طبیعی طرح کروکودیل Sienna",
      subtitle: "طراحی اشرافی با چرم طبیعی برجسته و قفل مغناطیسی",
      price: 3360000,
      compareAtPrice: 4200000,
      badge: "تخفیف ویژه",
      href: "/products/prod-4",
      meta: [
        { label: "سود شما از خرید", value: "۸۴۰,۰۰۰ تومان" },
        { label: "متریال", value: "چرم طبیعی امبوسد کروکودیل" },
        { label: "کد تخفیف", value: "LUXE20" },
      ],
    },
    {
      src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop",
      alt: "بارانی و ترنچ کت ضدآب British Classic",
      title: "ترنچ کت دبل برست ضدآب British Classic",
      subtitle: "پارچه گاباردین ضدآب با کمربند سگک‌دار کلاسیک",
      price: 3990000,
      compareAtPrice: 4990000,
      badge: "۲۰٪ تخفیف",
      href: "/products/prod-1",
      meta: [
        { label: "پارچه", value: "گاباردین کتان صددرصد ضدآب" },
        { label: "تخفیف", value: "۱,۰۰۰,۰۰۰ تومان" },
        { label: "رنگ‌بندی", value: "کرم، سرمه‌ای، مشکی" },
      ],
    },
    {
      src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=900&auto=format&fit=crop",
      alt: "پیراهن لینن اورسایز Riviera Summer",
      title: "پیراهن ساحلی لینن ارگانیک Riviera Summer",
      subtitle: "خنک و سبک، بافته شده از لینن طبیعی خالص اروپایی",
      price: 1980000,
      compareAtPrice: 2600000,
      badge: "۲۴٪ تخفیف",
      href: "/products/prod-2",
      meta: [
        { label: "تخفیف استثنایی", value: "۶۲۰,۰۰۰ تومان" },
        { label: "جنس الیاف", value: "۱۰۰٪ لینن خالص فرانسه" },
        { label: "تن‌خور", value: "آزاد و تنفس‌پذیر" },
      ],
    },
  ];

  return (
    <main className="min-h-screen pb-24">
      {/* Hero Section - Full Bleed Immersive Background */}
      <section className="relative w-full min-h-[90vh] md:min-h-screen flex flex-col justify-between overflow-hidden px-4 md:px-6 pt-28 md:pt-32 pb-16">
        {/* Background Image spanning from the very top behind Navbar */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroContent.image_url || "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1920&auto=format&fit=crop"} 
            alt="Hero Background" 
            className="w-full h-full object-cover object-top opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0a0a0a]"></div>
        </div>

        {/* Dynamic Animated Rainbow/Luxury Banner */}
        {announcement ? (
          <div className="relative z-10 w-full max-w-4xl mx-auto mb-6 px-4">
            <Banner
              id="top-hero-announcement"
              variant="rainbow"
              className="rounded-2xl border border-amber-400/30 bg-black/60 shadow-2xl backdrop-blur-xl"
              height="3.25rem"
              rainbowColors={[
                "rgba(245,158,11,0.75)",
                "rgba(251,191,36,0.9)",
                "transparent",
                "rgba(245,158,11,0.8)",
                "transparent",
                "rgba(217,119,6,0.85)",
              ]}
            >
              <Link
                href={announcement.link || "/women"}
                className="flex items-center justify-center gap-2.5 text-xs md:text-sm font-bold text-white hover:text-amber-300 transition-colors"
              >
                {announcement.badge && (
                  <span className="bg-amber-400 text-black text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-full shadow-md">
                    {announcement.badge}
                  </span>
                )}
                <span>{announcement.text}</span>
              </Link>
            </Banner>
          </div>
        ) : (
          <div className="h-2" />
        )}

        {/* Hero Headline & Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-4xl mx-auto space-y-6 md:space-y-8 my-auto w-full"
        >
          {heroContent.badge && (
            <span className="inline-block bg-white/10 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase backdrop-blur-md border border-white/10">
              {heroContent.badge}
            </span>
          )}
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight md:leading-tight tracking-tight">
            {heroContent.headline}
          </h1>
          
          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed px-2">
            {heroContent.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-2 md:pt-4 w-full max-w-xs sm:max-w-none mx-auto">
            <Button asChild className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl bg-white text-black hover:bg-gray-200 text-base md:text-lg font-bold transition-all shadow-xl">
              <Link href={heroContent.cta_link || "/women"}>{heroContent.cta_label || "مشاهده محصولات"}</Link>
            </Button>
            <Button asChild className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl bg-[#111111] border border-white/20 text-white hover:bg-white hover:text-black text-base md:text-lg font-bold transition-all backdrop-blur-md">
              <Link href="/women">کالکشن جدید</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ==================================================================== */}
      {/* 1. 3D COVERFLOW SHOWCASE: جدیدترین محصولات (NEW ARRIVALS)             */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2.5 text-amber-400 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-black tracking-wider uppercase">جدیدترین‌های فصل</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              جدیدترین محصولات کالکشن ۲۰۲۶
            </h2>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              مجموعه‌ای اختصاصی از جدیدترین پالتوها، لباس‌های مجلسی و اکسسوری‌های لوکس
            </p>
          </div>
          <Link
            href="/women"
            className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-gray-300 hover:text-white transition-colors"
          >
            مشاهده همه جدیدترین‌ها
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* 3D Coverflow Carousel for New Arrivals */}
        <div className="bg-[#111111]/40 border border-white/5 rounded-3xl p-4 md:p-8 backdrop-blur-sm shadow-2xl">
          <CoverflowCarousel
            slides={newArrivalsSlides}
            showCaption={true}
            showNavigation={true}
            showPagination={true}
            cardWidth="clamp(200px, 30vw, 300px)"
            rotate={40}
            depth={0.58}
          />
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. 3D COVERFLOW SHOWCASE: فروش ویژه (SPECIAL SALE & OFFERS)           */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2.5 text-rose-400 mb-2">
              <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
              <span className="text-xs font-black tracking-wider uppercase">حراج محدود فصل</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              فروش ویژه و تخفیف‌های طلایی
            </h2>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              فرصت استثنایی خرید کالاهای برند با ۲۰٪ تخفیف نقدی با کد «LUXE20»
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-xl text-xs font-bold">
              <Tag className="w-3.5 h-3.5" />
              کد: LUXE20
            </span>
            <Link
              href="/women"
              className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-gray-300 hover:text-white transition-colors mr-2"
            >
              مشاهده همه تخفیف‌ها
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3D Coverflow Carousel for Special Sales */}
        <div className="bg-gradient-to-b from-rose-950/20 via-[#111111]/40 to-[#111111]/40 border border-rose-500/10 rounded-3xl p-4 md:p-8 backdrop-blur-sm shadow-2xl">
          <CoverflowCarousel
            slides={specialSaleSlides}
            showCaption={true}
            showNavigation={true}
            showPagination={true}
            cardWidth="clamp(200px, 30vw, 300px)"
            rotate={40}
            depth={0.58}
          />
        </div>
      </section>

      {/* Collections API Block */}
      <CollectionsSection />

      {/* Bestsellers Section */}
      <section className="relative max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 z-0 overflow-hidden" dir="rtl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[1000px] h-[600px] md:h-[1000px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none -z-10"></div>
        
        <div className="flex items-end justify-between mb-8 md:mb-12 relative z-10 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">پرفروش‌ترین‌ها</h2>
            </div>
            <p className="text-sm text-gray-400">محصولاتی که بیشترین رضایت و توجه خریداران را به همراه داشته‌اند</p>
          </div>
          <Link href="/women" className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium text-sm">
            مشاهده همه
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 hide-scrollbar">
          {bestsellers.map((product, index) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group flex flex-col w-[150px] min-w-[150px] max-w-[150px] sm:w-[200px] sm:min-w-[200px] sm:max-w-[200px] md:w-auto md:min-w-0 md:max-w-none shrink-0 snap-start"
            >
              <Link href={`/products/${product.id}`} className="block relative aspect-[4/5] md:aspect-[3/4] overflow-hidden rounded-2xl md:rounded-3xl bg-[#111111] border border-white/5 mb-2 md:mb-4">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="bg-white text-black px-3 md:px-6 py-2 md:py-3 rounded-full font-bold text-[10px] md:text-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1 md:gap-2">
                    <ShoppingBag className="w-3 h-3 md:w-4 md:h-4" />
                    مشاهده
                  </span>
                </div>
              </Link>
              <div className="flex flex-col px-1">
                <h3 className="text-sm md:text-lg font-bold text-white mb-0.5 md:mb-1 line-clamp-1">{product.name}</h3>
                <span className="text-[10px] md:text-sm text-gray-500 mb-1 md:mb-2">{(product.category || "").split('-')[1]?.trim() || product.category}</span>
                <span className="text-white font-medium text-xs md:text-base">
                  {typeof product.price === 'number' ? product.price.toLocaleString("fa-IR") : product.price} تومان
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
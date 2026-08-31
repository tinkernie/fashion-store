// ============================================================================
// MOCK DATA STORE FOR LUXE FASHION STORE (STANDALONE FRONTEND MODE)
//
// NOTE: This file is used only when running the frontend without a backend.
// To remove later: Delete this file and remove its import in `lib/mock-server.ts`.
// ============================================================================

export interface MockProduct {
  id: string;
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  compare_at_price?: number;
  category: string;
  category_id: string;
  collection_slug?: string;
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
  status: "published" | "draft";
  availability: "in_stock" | "out_of_stock" | "pre_order";
  rating: number;
  reviews_count: number;
  imageUrl: string;
  image_url: string;
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  options: Array<{
    id: string;
    name: string;
    values: Array<{ id: string; value: string }>;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    price: number;
    compare_at_price?: number;
    weight: number;
    status: string;
    availability: string;
    inventory: {
      available_quantity: number;
      reserved_quantity: number;
      safety_stock: number;
      status: string;
    };
    options: Record<string, string>;
  }>;
}

export const MOCK_CATEGORIES = [
  {
    id: "cat-1",
    name: "پالتو و بارانی",
    slug: "coats-jackets",
    title: "پالتو و بارانی",
    description: "انواع پالتوهای پشمی، فوتر ایتالیایی و بارانی‌های کلاسیک ضدآب",
    image_url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=800&auto=format&fit=crop",
    parent_id: null,
    level: 0,
    children: [
      { id: "cat-1-1", name: "پالتو پشمی", slug: "wool-coats", parent_id: "cat-1", level: 1 },
      { id: "cat-1-2", name: "ترنچ کت", slug: "trench-coats", parent_id: "cat-1", level: 1 },
      { id: "cat-1-3", name: "کاپشن و بامبر", slug: "jackets-bombers", parent_id: "cat-1", level: 1 },
    ],
  },
  {
    id: "cat-2",
    name: "پیراهن و لباس مجلسی",
    slug: "dresses",
    title: "پیراهن و لباس مجلسی",
    description: "پیراهن‌های ماکسی ابریشمی، ساتن و اوت‌کوتور مناسب مجالس لوکس",
    image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop",
    parent_id: null,
    level: 0,
    children: [
      { id: "cat-2-1", name: "پیراهن ماکسی", slug: "maxi-dresses", parent_id: "cat-2", level: 1 },
      { id: "cat-2-2", name: "پیراهن ساتن", slug: "satin-dresses", parent_id: "cat-2", level: 1 },
      { id: "cat-2-3", name: "لباس شب", slug: "evening-gowns", parent_id: "cat-2", level: 1 },
    ],
  },
  {
    id: "cat-3",
    name: "کت و شلوار زنانه",
    slug: "suits-blazers",
    title: "کت و شلوار زنانه",
    description: "کت‌های بلیزر اورسایز، ست‌های دوخت شخصی و شلوارهای فرمال",
    image_url: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=800&auto=format&fit=crop",
    parent_id: null,
    level: 0,
    children: [
      { id: "cat-3-1", name: "کت بلیزر", slug: "blazers", parent_id: "cat-3", level: 1 },
      { id: "cat-3-2", name: "ست کت و شلوار", slug: "full-suits", parent_id: "cat-3", level: 1 },
      { id: "cat-3-3", name: "شلوار راسته و بوت‌کات", slug: "trousers", parent_id: "cat-3", level: 1 },
    ],
  },
  {
    id: "cat-4",
    name: "کیف و کفش چرم",
    slug: "bags-shoes",
    title: "کیف و کفش چرم",
    description: "کیف‌های دستی چرم طبیعی ایتالیا، بوت و کفش‌های پاشنه‌دار طراحی اختصاصی",
    image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&auto=format&fit=crop",
    parent_id: null,
    level: 0,
    children: [
      { id: "cat-4-1", name: "کیف دوشی و دستی", slug: "handbags", parent_id: "cat-4", level: 1 },
      { id: "cat-4-2", name: "کفش پاشنه‌دار", slug: "heels", parent_id: "cat-4", level: 1 },
      { id: "cat-4-3", name: "بوت و نیم‌بوت", slug: "boots", parent_id: "cat-4", level: 1 },
    ],
  },
  {
    id: "cat-5",
    name: "اکسسوری و زیورآلات",
    slug: "accessories",
    title: "اکسسوری و زیورآلات",
    description: "شال و روسری ابریشم خالص، عینک آفتابی و اکسسوری‌های استیتمنت",
    image_url: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=800&auto=format&fit=crop",
    parent_id: null,
    level: 0,
    children: [
      { id: "cat-5-1", name: "شال ابریشم", slug: "silk-scarves", parent_id: "cat-5", level: 1 },
      { id: "cat-5-2", name: "عینک و کمربند", slug: "belts-eyewear", parent_id: "cat-5", level: 1 },
    ],
  },
];

export const MOCK_COLLECTIONS = [
  {
    id: "col-1",
    slug: "fall-winter-2026",
    name: "کالکشن پاییز و زمستان ۲۰۲۶",
    title: "کالکشن پاییز و زمستان ۲۰۲۶",
    description: "تلفیق شکوه پارچه‌های پشمی با برش‌های معماری مدرن برای استایل گرم و اشرافی",
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
    is_active: true,
  },
  {
    id: "col-2",
    slug: "minimalist-elegance",
    name: "ظرافت مینیمال (Minimalist Elegance)",
    title: "ظرافت مینیمال",
    description: "طراحی‌های ساده، پارچه‌های تنفس‌پذیر خنثی و دوخت‌های خطی لوکس برای استفاده روزمره و خاص",
    image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
    is_active: true,
  },
  {
    id: "col-3",
    slug: "luxury-evening",
    name: "لباس‌های شب و گالا (Gala & Evening)",
    title: "لباس‌های شب و گالا",
    description: "ساتن براق، ابریشم توت طبیعی و جزئیات دست‌دوز خیره‌کننده برای لحظات درخشان شما",
    image_url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop",
    is_active: true,
  },
];

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "prod-1",
    slug: "cashmere-wool-overcoat",
    name: "پالتو پشمی کشمیر دست‌دوز Luxe Noir",
    title: "پالتو پشمی کشمیر دست‌دوز Luxe Noir",
    subtitle: "دوخت سفارشی با پشم کشمیر صددرصد طبیعی و آستر ابریشم",
    description: "این پالتو با بهره‌گیری از مرغوب‌ترین الیاف کشمیر ایتالیایی و آستر دوزی ابریشم طبیعی طراحی شده است. فرم برش راسته و اورسایز آن استایلی مدرن و در عین حال جاودان را به ارمغان می‌آورد. دارای جیب‌های مخفی فیلتو و دکمه‌های طبیعی استخوانی دست‌ساز.",
    price: 8450000,
    compare_at_price: 9800000,
    category: "پالتو و بارانی",
    category_id: "cat-1",
    collection_slug: "fall-winter-2026",
    is_featured: true,
    is_bestseller: true,
    is_new: true,
    status: "published",
    availability: "in_stock",
    rating: 4.9,
    reviews_count: 24,
    imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1000&auto=format&fit=crop",
    image_url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
    ],
    colors: [
      { name: "مشکی زغالی", hex: "#1a1a1a" },
      { name: "شکلاتی تیره", hex: "#3e2723" },
      { name: "کرم شتری", hex: "#c19a6b" },
    ],
    sizes: ["S", "M", "L", "XL"],
    options: [
      {
        id: "opt-size-1",
        name: "سایز",
        values: [
          { id: "val-s", value: "S" },
          { id: "val-m", value: "M" },
          { id: "val-l", value: "L" },
          { id: "val-xl", value: "XL" },
        ],
      },
      {
        id: "opt-color-1",
        name: "رنگ",
        values: [
          { id: "val-blk", value: "مشکی زغالی" },
          { id: "val-brn", value: "شکلاتی تیره" },
          { id: "val-cml", value: "کرم شتری" },
        ],
      },
    ],
    variants: [
      {
        id: "var-1-1",
        sku: "COAT-CASH-S-BLK",
        price: 8450000,
        compare_at_price: 9800000,
        weight: 1200,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 14, reserved_quantity: 0, safety_stock: 2, status: "in_stock" },
        options: { سایز: "S", رنگ: "مشکی زغالی" },
      },
      {
        id: "var-1-2",
        sku: "COAT-CASH-M-BLK",
        price: 8450000,
        compare_at_price: 9800000,
        weight: 1200,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 20, reserved_quantity: 1, safety_stock: 2, status: "in_stock" },
        options: { سایز: "M", رنگ: "مشکی زغالی" },
      },
      {
        id: "var-1-3",
        sku: "COAT-CASH-L-BLK",
        price: 8450000,
        compare_at_price: 9800000,
        weight: 1200,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 8, reserved_quantity: 0, safety_stock: 2, status: "in_stock" },
        options: { سایز: "L", رنگ: "مشکی زغالی" },
      },
      {
        id: "var-1-4",
        sku: "COAT-CASH-M-CML",
        price: 8450000,
        compare_at_price: 9800000,
        weight: 1200,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 12, reserved_quantity: 0, safety_stock: 2, status: "in_stock" },
        options: { سایز: "M", رنگ: "کرم شتری" },
      },
    ],
  },
  {
    id: "prod-2",
    slug: "silk-satin-evening-maxi-dress",
    name: "پیراهن ماکسی ساتن ابریشم خالص Emerald Gala",
    title: "پیراهن ماکسی ساتن ابریشم خالص Emerald Gala",
    subtitle: "طراحی دراماتیک با یقه دراپه و پشت باز اشرافی",
    description: "پیراهن مجلسی باشکوه بافته شده از ساتن ابریشم توت طبیعی ۱۰۰٪ با ریزش فوق‌العاده. رنگ سبز زمردی عمیق جلوه‌ای بی‌نظیر به مراسم‌های شبانه شما می‌بخشد. دارای چاک کناری متوازن و دوخت‌های دست‌دوز نامرئی.",
    price: 6900000,
    compare_at_price: 7500000,
    category: "پیراهن و لباس مجلسی",
    category_id: "cat-2",
    collection_slug: "luxury-evening",
    is_featured: true,
    is_bestseller: true,
    is_new: true,
    status: "published",
    availability: "in_stock",
    rating: 5.0,
    reviews_count: 18,
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop",
    image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop",
    ],
    colors: [
      { name: "سبز زمردی", hex: "#064e3b" },
      { name: "قرمز یاقوتی", hex: "#881337" },
      { name: "مشکی کریستال", hex: "#0a0a0a" },
    ],
    sizes: ["XS", "S", "M", "L"],
    options: [
      {
        id: "opt-size-2",
        name: "سایز",
        values: [{ id: "val-xs", value: "XS" }, { id: "val-s", value: "S" }, { id: "val-m", value: "M" }, { id: "val-l", value: "L" }],
      },
    ],
    variants: [
      {
        id: "var-2-1",
        sku: "DRESS-SILK-S",
        price: 6900000,
        compare_at_price: 7500000,
        weight: 450,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 10, reserved_quantity: 0, safety_stock: 1, status: "in_stock" },
        options: { سایز: "S" },
      },
      {
        id: "var-2-2",
        sku: "DRESS-SILK-M",
        price: 6900000,
        compare_at_price: 7500000,
        weight: 450,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 15, reserved_quantity: 0, safety_stock: 1, status: "in_stock" },
        options: { سایز: "M" },
      },
    ],
  },
  {
    id: "prod-3",
    slug: "tailored-double-breasted-blazer",
    name: "کت بلیزر چهار دکمه ساختاری Milan Tailored",
    title: "کت بلیزر چهار دکمه ساختاری Milan Tailored",
    subtitle: "برش دقیق شانه و فرم آزاد مدرن برای موقعیت‌های بیزنس و کژوال لوکس",
    description: "کت بلیزر شش دکمه ساختاری با طراحی الهام گرفته از خیاطی‌های سنتی میلان. پد شانه متوازن و یقه انگلیسی پهن استایلی قدرتمند خلق می‌کند. قابلیت ست شدن با شلوارهای راسته و دامن‌های میدی.",
    price: 5200000,
    compare_at_price: 5900000,
    category: "کت و شلوار زنانه",
    category_id: "cat-3",
    collection_slug: "minimalist-elegance",
    is_featured: true,
    is_bestseller: false,
    is_new: true,
    status: "published",
    availability: "in_stock",
    rating: 4.8,
    reviews_count: 12,
    imageUrl: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop",
    image_url: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop",
    ],
    colors: [
      { name: "کرم استخوانی", hex: "#f5f5f0" },
      { name: "مشکی کلاسیک", hex: "#111111" },
    ],
    sizes: ["36", "38", "40", "42"],
    options: [
      {
        id: "opt-size-3",
        name: "سایز",
        values: [{ id: "val-36", value: "36" }, { id: "val-38", value: "38" }, { id: "val-40", value: "40" }, { id: "val-42", value: "42" }],
      },
    ],
    variants: [
      {
        id: "var-3-1",
        sku: "BLAZER-MILAN-38",
        price: 5200000,
        weight: 800,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 18, reserved_quantity: 0, safety_stock: 2, status: "in_stock" },
        options: { سایز: "38" },
      },
      {
        id: "var-3-2",
        sku: "BLAZER-MILAN-40",
        price: 5200000,
        weight: 800,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 12, reserved_quantity: 0, safety_stock: 2, status: "in_stock" },
        options: { سایز: "40" },
      },
    ],
  },
  {
    id: "prod-4",
    slug: "italian-calfskin-structured-tote",
    name: "کیف دستی چرم طبیعی کالفسکین Florence Tote",
    title: "کیف دستی چرم طبیعی کالفسکین Florence Tote",
    subtitle: "دست‌ساز در فلورانس با یراق‌آلات آبکاری طلای ۲۴ عیار",
    description: "کیف دستی ساختاری فوق‌العاده با چرم گوساله فول گرین دباغی شده به روش گیاهی. دارای بخش‌های تفکیک شده داخلی برای لپ‌تاپ، تبلت و اکسسوری‌ها همراه با بند رودوشی چرمی قابل تنظیم.",
    price: 4950000,
    compare_at_price: 5400000,
    category: "کیف و کفش چرم",
    category_id: "cat-4",
    collection_slug: "minimalist-elegance",
    is_featured: true,
    is_bestseller: true,
    is_new: false,
    status: "published",
    availability: "in_stock",
    rating: 4.9,
    reviews_count: 31,
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop",
    image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop",
    ],
    colors: [
      { name: "عسلی نوبل", hex: "#b45309" },
      { name: "مشکی مات", hex: "#1c1917" },
    ],
    sizes: ["Medium", "Large"],
    options: [
      {
        id: "opt-size-4",
        name: "سایز",
        values: [{ id: "val-med", value: "Medium" }, { id: "val-lrg", value: "Large" }],
      },
    ],
    variants: [
      {
        id: "var-4-1",
        sku: "BAG-FLOR-MED",
        price: 4950000,
        weight: 950,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 9, reserved_quantity: 0, safety_stock: 1, status: "in_stock" },
        options: { سایز: "Medium" },
      },
    ],
  },
  {
    id: "prod-5",
    slug: "leather-pointed-toe-ankle-boots",
    name: "بوت چرم پاشنه‌دار نوک‌تیز Verona Heeled Boot",
    title: "بوت چرم پاشنه‌دار نوک‌تیز Verona Heeled Boot",
    subtitle: "پاشنه ۷ سانتی معماری با کفی فوق‌العاده راحت ارگونومیک",
    description: "نیم‌بوت‌های شیک و جذاب ورونا، ساخته شده از چرم براق ایتالیایی با زیپ مخفی فلزی ژاپنی YKK. کفی ارگونومیک مموری‌فوم راحتی ساعت‌ها پیاده‌روی را بدون خستگی تضمین می‌کند.",
    price: 4600000,
    compare_at_price: 5200000,
    category: "کیف و کفش چرم",
    category_id: "cat-4",
    collection_slug: "fall-winter-2026",
    is_featured: false,
    is_bestseller: true,
    is_new: true,
    status: "published",
    availability: "in_stock",
    rating: 4.7,
    reviews_count: 15,
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop",
    image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop",
    ],
    colors: [{ name: "مشکی براق", hex: "#000000" }],
    sizes: ["37", "38", "39", "40"],
    options: [
      {
        id: "opt-size-5",
        name: "سایز",
        values: [{ id: "val-37", value: "37" }, { id: "val-38", value: "38" }, { id: "val-39", value: "39" }, { id: "val-40", value: "40" }],
      },
    ],
    variants: [
      {
        id: "var-5-1",
        sku: "BOOT-VER-38",
        price: 4600000,
        weight: 1100,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 7, reserved_quantity: 0, safety_stock: 1, status: "in_stock" },
        options: { سایز: "38" },
      },
      {
        id: "var-5-2",
        sku: "BOOT-VER-39",
        price: 4600000,
        weight: 1100,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 11, reserved_quantity: 0, safety_stock: 1, status: "in_stock" },
        options: { سایز: "39" },
      },
    ],
  },
  {
    id: "prod-6",
    slug: "pure-silk-twill-printed-scarf",
    name: "شال ابریشم تویل طرح اختصاصی Renaissance Silk",
    title: "شال ابریشم تویل طرح اختصاصی Renaissance Silk",
    subtitle: "چاپ دیجیتال ارگانیک روی ابریشم ۱۰۰٪ طبیعی با دوردوزی دست‌دوز",
    description: "شال فاخر با ابعاد ۹۰×۹۰ سانتی‌متر چاپ اختصاصی الهام گرفته از نقاشی‌های رنسانس. لبه‌های لول شده با دست توسط هنرمندان برجسته.",
    price: 1850000,
    compare_at_price: 2200000,
    category: "اکسسوری و زیورآلات",
    category_id: "cat-5",
    collection_slug: "minimalist-elegance",
    is_featured: false,
    is_bestseller: false,
    is_new: false,
    status: "published",
    availability: "in_stock",
    rating: 4.9,
    reviews_count: 8,
    imageUrl: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=1000&auto=format&fit=crop",
    image_url: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=1000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=1000&auto=format&fit=crop",
    ],
    colors: [{ name: "طرح رز و طلا", hex: "#d97706" }],
    sizes: ["90x90"],
    options: [
      {
        id: "opt-size-6",
        name: "سایز",
        values: [{ id: "val-90", value: "90x90" }],
      },
    ],
    variants: [
      {
        id: "var-6-1",
        sku: "SCARF-REN-90",
        price: 1850000,
        weight: 120,
        status: "published",
        availability: "in_stock",
        inventory: { available_quantity: 35, reserved_quantity: 0, safety_stock: 5, status: "in_stock" },
        options: { سایز: "90x90" },
      },
    ],
  },
];

export const MOCK_REVIEWS: Record<string, Array<{ id: string; user_name: string; rating: number; comment: string; created_at: string; is_verified_purchase: boolean }>> = {
  "prod-1": [
    {
      id: "rev-1",
      user_name: "مریم احمدی",
      rating: 5,
      comment: "کیفیت پارچه و دوخت این پالتو واقعاً در حد برندهای لوکس خارجی هست. توی تن بسیار خوش‌فرمه و کاملاً گرم می‌کنه.",
      created_at: "2026-08-15T14:30:00Z",
      is_verified_purchase: true,
    },
    {
      id: "rev-2",
      user_name: "سارا حسینی",
      rating: 5,
      comment: "رنگ مشکی زغالی فوق‌العاده براق و اصیله. بسته‌بندی پالتو هم بسیار شیک و تمیز ارسال شد.",
      created_at: "2026-08-20T10:15:00Z",
      is_verified_purchase: true,
    },
  ],
  "prod-2": [
    {
      id: "rev-3",
      user_name: "نگار کریمی",
      rating: 5,
      comment: "برای مراسم عروسی خواهرم خریدم و همه از پارچه و طراحیش تعریف می‌کردن. ریزش ساتن واقعاً عالیه.",
      created_at: "2026-08-18T18:00:00Z",
      is_verified_purchase: true,
    },
  ],
};

export const MOCK_USER = {
  id: "usr-admin-1",
  email: "admin@luxe.com",
  first_name: "مهدی",
  last_name: "مرادی",
  is_staff: true,
  is_superuser: true,
  date_joined: "2026-01-01T00:00:00Z",
  phone: "09123456789",
  addresses: [
    {
      id: "addr-1",
      fullName: "مهدی مرادی",
      phone: "09123456789",
      province: "تهران",
      city: "تهران",
      address: "خیابان فرشته، برج آریا، طبقه ۸، واحد ۱۶",
      postalCode: "1965874123",
      isDefault: true,
    },
  ],
};

export const MOCK_ORDERS = [
  {
    id: "ord-1001",
    order_number: "LUXE-94821",
    status: "delivered",
    status_display: "تحویل داده شده",
    total: "8450000.00",
    subtotal: "8450000.00",
    discount_amount: "0.00",
    shipping_cost: "0.00",
    placed_at: "2026-08-10T12:00:00Z",
    created_at: "2026-08-10T12:00:00Z",
    shipping_address: {
      full_name: "مهدی مرادی",
      phone: "09123456789",
      province: "تهران",
      city: "تهران",
      address: "خیابان فرشته، برج آریا، طبقه ۸، واحد ۱۶",
      postal_code: "1965874123",
    },
    items: [
      {
        id: "item-1",
        variant_id: "var-1-2",
        product_snapshot: {
          title: "پالتو پشمی کشمیر دست‌دوز Luxe Noir",
          sku: "COAT-CASH-M-BLK",
          options: "سایز: M, رنگ: مشکی زغالی",
          image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=600&auto=format&fit=crop",
        },
        quantity: 1,
        price_snapshot: "8450000.00",
        line_total: "8450000.00",
      },
    ],
    status_history: [
      { id: "h-1", status: "pending", note: "سفارش ثبت شد", created_at: "2026-08-10T12:00:00Z" },
      { id: "h-2", status: "paid", note: "پرداخت موفق", created_at: "2026-08-10T12:02:00Z" },
      { id: "h-3", status: "shipping", note: "ارسال با پست پیشتاز", created_at: "2026-08-11T09:30:00Z" },
      { id: "h-4", status: "delivered", note: "تحویل به مشتری", created_at: "2026-08-13T14:00:00Z" },
    ],
  },
  {
    id: "ord-1002",
    order_number: "LUXE-95140",
    status: "shipping",
    status_display: "در حال ارسال",
    total: "6900000.00",
    subtotal: "6900000.00",
    discount_amount: "0.00",
    shipping_cost: "0.00",
    placed_at: "2026-08-28T16:45:00Z",
    created_at: "2026-08-28T16:45:00Z",
    shipping_address: {
      full_name: "مهدی مرادی",
      phone: "09123456789",
      province: "تهران",
      city: "تهران",
      address: "خیابان فرشته، برج آریا، طبقه ۸، واحد ۱۶",
      postal_code: "1965874123",
    },
    items: [
      {
        id: "item-2",
        variant_id: "var-2-1",
        product_snapshot: {
          title: "پیراهن ماکسی ساتن ابریشم خالص Emerald Gala",
          sku: "DRESS-SILK-S",
          options: "سایز: S",
          image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
        },
        quantity: 1,
        price_snapshot: "6900000.00",
        line_total: "6900000.00",
      },
    ],
    status_history: [
      { id: "h-5", status: "pending", note: "سفارش ثبت شد", created_at: "2026-08-28T16:45:00Z" },
      { id: "h-6", status: "paid", note: "پرداخت تایید شد", created_at: "2026-08-28T16:47:00Z" },
      { id: "h-7", status: "shipping", note: "کد رهگیری پستی: 198273645019", created_at: "2026-08-29T11:00:00Z" },
    ],
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "order_status_change",
    subject: "سفارش شما ارسال شد",
    body: "سفارش LUXE-95140 بسته‌بندی و تحویل پست شد. کد رهگیری: 198273645019",
    is_read: false,
    created_at: "2026-08-29T11:00:00Z",
  },
  {
    id: "notif-2",
    type: "welcome",
    subject: "به خانواده LUXE خوش آمدید",
    body: "از همراهی شما با ما سپاسگزاریم. برای خرید اول خود از کد تخفیف WELCOME10 استفاده کنید.",
    is_read: true,
    created_at: "2026-08-01T08:00:00Z",
  },
];

export const MOCK_COUPONS = [
  {
    id: "cpn-1",
    code: "LUXE20",
    discount_type: "percentage",
    discount_value: "20.00",
    min_purchase: "2000000.00",
    max_uses: 100,
    used_count: 34,
    is_active: true,
  },
  {
    id: "cpn-2",
    code: "WELCOME10",
    discount_type: "percentage",
    discount_value: "10.00",
    min_purchase: "0.00",
    max_uses: 500,
    used_count: 82,
    is_active: true,
  },
  {
    id: "cpn-3",
    code: "VIP50",
    discount_type: "fixed",
    discount_value: "500000.00",
    min_purchase: "5000000.00",
    max_uses: 50,
    used_count: 12,
    is_active: true,
  },
];

export const MOCK_CMS_PAGES = [
  {
    slug: "about-us",
    title: "درباره برند LUXE",
    status: "published",
    content: [
      {
        type: "paragraph",
        heading: "تلفیق هنر اصیل و خیاطی مدرن",
        body: "برند لوکس با هدف ارائه پوشاک سطح بالا و دوخت‌های معماری در سال ۲۰۲۲ تاسیس شد. ما بر این باوریم که پوشش، بازتابی از شخصیت، اعتمادبه‌نفس و سلیقه بی‌بدیل شماست.",
      },
    ],
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    slug: "terms",
    title: "قوانین و مقررات خرید",
    status: "published",
    content: [
      {
        type: "paragraph",
        heading: "شرایط عودت و تعویض کالا",
        body: "تمامی سفارشات تا ۷ روز پس از تحویل در صورت عدم استفاده و حفظ برچسب‌های اصالت، امکان تعویض سایز یا عودت وجه را دارند.",
      },
    ],
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    slug: "privacy",
    title: "حریم خصوصی کاربران",
    status: "published",
    content: [
      {
        type: "paragraph",
        heading: "حفاظت از اطلاعات شخصی",
        body: "اطلاعات کاربران نزد لوکس محفوظ بوده و تحت پروتکل‌های امنیتی SSL محافظت می‌شود.",
      },
    ],
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    slug: "contact",
    title: "تماس با پشتیبانی",
    status: "published",
    content: [
      {
        type: "paragraph",
        heading: "راه‌های ارتباطی",
        body: "پشتیبانی تلفنی: ۰۲۱-۸۸۸۸۸۸۸۸ | ساعات پاسخگویی: شنبه تا پنجشنبه ۹ الی ۲۱",
      },
    ],
    updated_at: "2026-08-01T00:00:00Z",
  },
];

export const MOCK_SITE_CONTENT = {
  announcement: {
    enabled: true,
    text: "✨ حراج فصل پاییزه لوکس: ۲۰٪ تخفیف روی تمامی پالتوها با کد LUXE20",
    link: "/women",
    badge: "تخفیف ویژه",
  },
  hero: {
    badge: "کالکشن جدید ۲۰۲۶",
    headline: "شکوه و ظرافت جاودان",
    subtitle: "طراحی‌های خیره‌کننده با مرغوب‌ترین الیاف کشمیر، ابریشم و چرم طبیعی ایتالیا",
    cta_label: "مشاهده جدیدترین‌ها",
    cta_link: "/women",
    image_url: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1920&auto=format&fit=crop",
  },
  footer: {
    description: "فروشگاه آنلاین پوشاک لوکس زنانه، ارائه‌دهنده مرغوب‌ترین متریال‌های ابریشم، چرم و پشم با طراحی مدرن و دوخت سفارشی.",
    phone: "۰۲۱-۸۸۸۸۸۸۸۸",
    email: "support@luxe.com",
    address: "تهران، خیابان فرشته، برج آریا، واحد ۱۶",
    working_hours: "شنبه تا پنج‌شنبه ۹ الی ۲۱",
  },
};

export const MOCK_ADMIN_DASHBOARD = {
  stats: {
    total_revenue: 142500000,
    total_orders: 148,
    active_users: 320,
    conversion_rate: "3.4%",
    average_order_value: 962800,
  },
  recent_orders: MOCK_ORDERS,
  sales_chart: [
    { date: "فروردین", sales: 18500000 },
    { date: "اردیبهشت", sales: 24000000 },
    { date: "خرداد", sales: 19800000 },
    { date: "تیر", sales: 31200000 },
    { date: "مرداد", sales: 49000000 },
  ],
};

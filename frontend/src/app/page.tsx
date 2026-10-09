import HomeClient from "@/components/home-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ماوی (MAVI) — فروشگاه تخصصی مد و پوشاک فاخر",
  description: "جدیدترین کالکشن‌های مد، استایل و پوشاک لوکس زنانه و مردانه با مرغوب‌ترین متریال در فروشگاه ماوی (MAVI)",
  openGraph: {
    title: "ماوی (MAVI) — فروشگاه تخصصی مد و پوشاک فاخر",
    description: "جدیدترین کالکشن‌های مد، استایل و پوشاک لوکس در فروشگاه ماوی (MAVI)",
    siteName: "ماوی MAVI",
  },
};

async function getInitialData() {
  const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  let hero = null;
  let announcement = null;
  let discountSection = null;
  let categories = [];
  let catalogProducts = [];
  let collections = [];

  try {
    const [heroRes, announceRes, discountSecRes, categoriesRes, catalogRes, collectionsRes] = await Promise.allSettled([
      fetch(`${backendUrl}/api/site-content/hero/`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/site-content/announcement/`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/site-content/discount_section/`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/categories/flat/`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/products/?ordering=newest&page_size=24`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/collections/`, { cache: "no-store" }),
    ]);

    if (heroRes.status === "fulfilled" && heroRes.value.ok) {
      const data = await heroRes.value.json();
      hero = data.hero || data;
    }

    if (announceRes.status === "fulfilled" && announceRes.value.ok) {
      const data = await announceRes.value.json();
      announcement = data.announcement || data;
    }

    if (discountSecRes.status === "fulfilled" && discountSecRes.value.ok) {
      const data = await discountSecRes.value.json();
      discountSection = data.discount_section || data;
    }

    if (categoriesRes.status === "fulfilled" && categoriesRes.value.ok) {
      const data = await categoriesRes.value.json();
      categories = Array.isArray(data) ? data : data.results || [];
    }

    if (catalogRes.status === "fulfilled" && catalogRes.value.ok) {
      const data = await catalogRes.value.json();
      catalogProducts = Array.isArray(data) ? data : data.results || [];
    }

    if (collectionsRes.status === "fulfilled" && collectionsRes.value.ok) {
      const data = await collectionsRes.value.json();
      collections = Array.isArray(data) ? data : data.results || [];
    }
  } catch (error) {
    console.error("Failed to fetch initial home data on server:", error);
  }

  return { hero, announcement, discountSection, categories, catalogProducts, collections };
}

export default async function Home() {
  const { hero, announcement, discountSection, categories, catalogProducts, collections } = await getInitialData();

  return (
    <HomeClient
      initialHero={hero}
      initialAnnouncement={announcement}
      initialDiscountSection={discountSection}
      initialCategories={categories}
      initialProducts={catalogProducts}
      initialCollections={collections}
    />
  );
}
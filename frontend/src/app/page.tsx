import HomeClient from "@/components/home-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه لوکس پوشاک | Fashion Store",
  description: "جدیدترین کالکشن‌های مد و پوشاک فاخر زنانه و مردانه با مرغوب‌ترین متریال و طراحی‌های بین‌المللی",
};

async function getInitialData() {
  const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  let hero = null;
  let announcement = null;
  let products = [];
  let bestSellers = [];
  let trending = [];

  try {
    const [heroRes, announceRes, productsRes, bestSellersRes, trendingRes] = await Promise.allSettled([
      fetch(`${backendUrl}/api/site-content/hero/`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/site-content/announcement/`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/products/?page_size=12`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/products/?ordering=best_selling&page_size=8`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/products/?ordering=trending&page_size=8`, { cache: "no-store" }),
    ]);

    if (heroRes.status === "fulfilled" && heroRes.value.ok) {
      const data = await heroRes.value.json();
      hero = data.hero || data;
    }

    if (announceRes.status === "fulfilled" && announceRes.value.ok) {
      const data = await announceRes.value.json();
      announcement = data.announcement || data;
    }

    if (productsRes.status === "fulfilled" && productsRes.value.ok) {
      const data = await productsRes.value.json();
      products = Array.isArray(data) ? data : data.results || [];
    }

    if (bestSellersRes.status === "fulfilled" && bestSellersRes.value.ok) {
      const data = await bestSellersRes.value.json();
      bestSellers = Array.isArray(data) ? data : data.results || [];
    }

    if (trendingRes.status === "fulfilled" && trendingRes.value.ok) {
      const data = await trendingRes.value.json();
      trending = Array.isArray(data) ? data : data.results || [];
    }
  } catch (error) {
    console.error("Failed to fetch initial home data on server:", error);
  }

  return { hero, announcement, products, bestSellers, trending };
}

export default async function Home() {
  const { hero, announcement, products, bestSellers, trending } = await getInitialData();

  return (
    <HomeClient
      initialHero={hero}
      initialAnnouncement={announcement}
      initialProducts={products}
      initialBestSellers={bestSellers}
      initialTrending={trending}
    />
  );
}
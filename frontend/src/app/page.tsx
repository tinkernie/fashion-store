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

  try {
    const [heroRes, announceRes, productsRes] = await Promise.allSettled([
      fetch(`${backendUrl}/api/site-content/hero/`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/site-content/announcement/`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/products/?page_size=20`, { cache: "no-store" }),
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
  } catch (error) {
    console.error("Failed to fetch initial home data on server:", error);
  }

  return { hero, announcement, products };
}

export default async function Home() {
  const { hero, announcement, products } = await getInitialData();

  return (
    <HomeClient
      initialHero={hero}
      initialAnnouncement={announcement}
      initialProducts={products}
    />
  );
}
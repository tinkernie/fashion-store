import { Metadata } from "next";

export function getApiBaseUrl(): string {
  const url =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";
  return url.replace(/\/+$/, "");
}

export function getSiteBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

/**
 * Fetch a single product by slug or id on the server
 */
export async function fetchProduct(idOrSlug: string): Promise<any | null> {
  const base = getApiBaseUrl();
  const cleanId = encodeURIComponent(idOrSlug.trim());

  try {
    const res = await fetch(`${base}/api/products/${cleanId}/`, {
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Backend may be offline or product not found
  }

  return null;
}

/**
 * Fetch full product data in parallel on the server (options, variants, reviews, related)
 */
export async function fetchProductFullData(idOrSlug: string) {
  const base = getApiBaseUrl();
  const cleanId = encodeURIComponent(idOrSlug.trim());

  const [prodRes, optRes, varRes, revRes, relRes] = await Promise.allSettled([
    fetch(`${base}/api/products/${cleanId}/`, { next: { revalidate: 60 } }),
    fetch(`${base}/api/products/${cleanId}/options/`, { next: { revalidate: 60 } }),
    fetch(`${base}/api/products/${cleanId}/variants/`, { next: { revalidate: 60 } }),
    fetch(`${base}/api/products/${cleanId}/reviews/`, { next: { revalidate: 60 } }),
    fetch(`${base}/api/products/${cleanId}/related/?limit=8`, { next: { revalidate: 60 } }),
  ]);

  let product: any = null;
  if (prodRes.status === "fulfilled" && prodRes.value.ok) {
    try {
      product = await prodRes.value.json();
    } catch {
      product = null;
    }
  }

  // Fallback to fetchProduct if backend was unreachable
  if (!product) {
    product = await fetchProduct(idOrSlug);
  }

  let options: any[] = [];
  if (optRes.status === "fulfilled" && optRes.value.ok) {
    try {
      const data = await optRes.value.json();
      options = Array.isArray(data) ? data : data.results || [];
    } catch {}
  } else if (product?.options && Array.isArray(product.options)) {
    options = product.options;
  }

  let variants: any[] = [];
  if (varRes.status === "fulfilled" && varRes.value.ok) {
    try {
      const data = await varRes.value.json();
      variants = Array.isArray(data) ? data : data.results || [];
    } catch {}
  } else if (product?.variants && Array.isArray(product.variants)) {
    variants = product.variants;
  }

  let reviews: any[] = [];
  if (revRes.status === "fulfilled" && revRes.value.ok) {
    try {
      const data = await revRes.value.json();
      reviews = Array.isArray(data) ? data : data.results || [];
    } catch {}
  }

  let related: any[] = [];
  if (relRes.status === "fulfilled" && relRes.value.ok) {
    try {
      const data = await relRes.value.json();
      related = Array.isArray(data) ? data : data.results || [];
    } catch {}
  } else if (Array.isArray(product?.related_products)) {
    related = product.related_products;
  }

  return { product, options, variants, reviews, related };
}

/**
 * Builds Next.js Metadata for Product Detail Pages
 */
export function buildProductMetadata(product: any, idOrSlug: string): Metadata {
  const prod = product || {};
  const siteUrl = getSiteBaseUrl();
  const rawTitle =
    prod.meta_title || `${prod.title || prod.name || "محصول"} | ماوی MAVI`;
  const rawDescription =
    prod.meta_description ||
    (prod.description
      ? prod.description.replace(/<[^>]*>/g, "").slice(0, 160)
      : "") ||
    "مشاهده جزئیات، مشخصات و خرید آنلاین محصول در فروشگاه تخصصی مد و پوشاک ماوی (MAVI)";

  const canonical =
    prod.canonical_url || `${siteUrl}/products/${prod.slug || idOrSlug}`;

  const ogImages: { url: string; alt?: string }[] = [];
  if (prod.og_image) {
    ogImages.push({ url: prod.og_image, alt: prod.title || prod.name });
  } else if (prod.imageUrl || prod.image_url) {
    ogImages.push({
      url: prod.imageUrl || prod.image_url,
      alt: prod.title || prod.name,
    });
  } else if (Array.isArray(prod.images) && prod.images.length > 0) {
    const first =
      typeof prod.images[0] === "string"
        ? prod.images[0]
        : prod.images[0]?.url;
    if (first) {
      ogImages.push({ url: first, alt: prod.title || prod.name });
    }
  }

  const languages: Record<string, string> = {};
  if (Array.isArray(prod.hreflang)) {
    for (const item of prod.hreflang) {
      if (item.hreflang && item.href) {
        languages[item.hreflang] = item.href;
      }
    }
  }

  return {
    title: { absolute: rawTitle },
    description: rawDescription,
    alternates: {
      canonical,
      languages: Object.keys(languages).length > 0 ? languages : undefined,
    },
    openGraph: {
      title: rawTitle,
      description: rawDescription,
      url: canonical,
      siteName: "ماوی MAVI",
      locale: "fa_IR",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: rawTitle,
      description: rawDescription,
      images: ogImages.map((img) => img.url),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

/**
 * Builds Schema.org JSON-LD for a Product
 */
export function buildProductJsonLd(product: any, idOrSlug: string): Record<string, any> {
  if (product.seo_schema && typeof product.seo_schema === "object") {
    return product.seo_schema;
  }

  const siteUrl = getSiteBaseUrl();
  const canonical =
    product.canonical_url || `${siteUrl}/products/${product.slug || idOrSlug}`;

  const images: string[] = [];
  if (product.og_image) images.push(product.og_image);
  if (product.imageUrl) images.push(product.imageUrl);
  if (product.image_url) images.push(product.image_url);
  if (Array.isArray(product.images)) {
    product.images.forEach((img: any) => {
      const u = typeof img === "string" ? img : img?.url;
      if (u && !images.includes(u)) images.push(u);
    });
  }

  const breadcrumbsList = [
    { "@type": "ListItem", position: 1, name: "خانه", item: `${siteUrl}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: product.category || product.category_name || "پوشاک",
      item: `${siteUrl}/products`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: product.title || product.name,
      item: canonical,
    },
  ];

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title || product.name,
    description: (product.description || "").slice(0, 300),
    sku: product.slug || idOrSlug,
    url: canonical,
    image: images.slice(0, 5),
    category: product.category || product.category_name,
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: product.price || 0,
      availability:
        product.stock_quantity && product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: canonical,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbsList,
    },
  };

  const ratingVal = Number(product.average_rating || product.rating);
  const ratingCnt = Number(product.reviews_count || product.review_count);
  if (!isNaN(ratingVal) && ratingVal > 0 && !isNaN(ratingCnt) && ratingCnt > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingVal,
      reviewCount: ratingCnt,
    };
  }

  return schema;
}

/**
 * Fetch category detail by slug
 */
export async function fetchCategory(slug: string): Promise<any | null> {
  const base = getApiBaseUrl();
  const cleanSlug = encodeURIComponent(slug.trim());

  try {
    const res = await fetch(`${base}/api/categories/${cleanSlug}/`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return null;
}

/**
 * Fetch products belonging to a category
 */
export async function fetchCategoryProducts(slug: string, pageSize = 24): Promise<any[]> {
  const base = getApiBaseUrl();
  const cleanSlug = encodeURIComponent(slug.trim());

  try {
    const res = await fetch(
      `${base}/api/products/?category=${cleanSlug}&page_size=${pageSize}`,
      { next: { revalidate: 60 }, headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : data.results || [];
    }
  } catch {}

  return [];
}

/**
 * Builds Next.js Metadata for Category Pages
 */
export function buildCategoryMetadata(category: any, slug: string): Metadata {
  const cat = category || {};
  const siteUrl = getSiteBaseUrl();
  const name = cat.name || cat.title || "دسته‌بندی";
  const title = cat.meta_title || `${name} | ماوی MAVI`;
  const description =
    cat.meta_description ||
    `خرید آنلاین جدیدترین مدل‌های ${name} با بالاترین کیفیت، ارسال سریع و ضمانت اصالت در فروشگاه ماوی (MAVI)`;
  const canonical = cat.canonical_url || `${siteUrl}/categories/${slug}`;

  const ogImages = cat.image ? [{ url: cat.image, alt: name }] : [];

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "ماوی MAVI",
      locale: "fa_IR",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((i: any) => i.url),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Builds Schema.org JSON-LD for Category Pages
 */
export function buildCategoryJsonLd(category: any, products: any[] = []): Record<string, any> {
  const cat = category || {};
  const siteUrl = getSiteBaseUrl();
  const name = cat.name || cat.title || "دسته‌بندی";
  const canonical = cat.canonical_url || `${siteUrl}/categories/${cat.slug || ""}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description: cat.description || `کالکشن دسته‌بندی ${name}`,
    url: canonical,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "خانه", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "دسته‌بندی‌ها", item: `${siteUrl}/products` },
        { "@type": "ListItem", position: 3, name, item: canonical },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (products || []).slice(0, 16).map((prod, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${siteUrl}/products/${prod.slug || prod.id}`,
        name: prod.title || prod.name,
      })),
    },
  };
}

/**
 * Fetch collection detail by slug
 */
export async function fetchCollection(slug: string): Promise<any | null> {
  const base = getApiBaseUrl();
  const cleanSlug = encodeURIComponent(slug.trim());

  try {
    const res = await fetch(`${base}/api/collections/${cleanSlug}/`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return null;
}

/**
 * Builds Next.js Metadata for Collections
 */
export function buildCollectionMetadata(collection: any, slug: string): Metadata {
  const col = collection || {};
  const siteUrl = getSiteBaseUrl();
  const name = col.name || col.title || "کالکشن";
  const title = `${name} | کالکشن ماوی MAVI`;
  const description =
    col.description ||
    "مشاهده و خرید آنلاین محصولات کالکشن اختصاصی و استایل‌های منتخب ماوی (MAVI)";
  const canonical = `${siteUrl}/collections/${slug}`;

  const banner =
    col.hero_banner ||
    col.image_url ||
    col.image ||
    (col as any).seo_metadata?.hero_banner;
  const ogImages = banner ? [{ url: banner, alt: name }] : [];

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "ماوی MAVI",
      locale: "fa_IR",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

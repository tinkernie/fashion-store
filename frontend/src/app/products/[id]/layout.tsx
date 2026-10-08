import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const backendUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

  try {
    const res = await fetch(`${backendUrl}/api/products/${id}/`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        title: "جزئیات محصول | ماوی MAVI",
        description: "مشاهده جزئیات، مشخصات و خرید آنلاین محصول در فروشگاه تخصصی مد و پوشاک ماوی (MAVI)",
      };
    }
    const product = await res.json();
    const title = product.meta_title || `${product.title || product.name || "محصول"} | ماوی MAVI`;
    const description =
      product.meta_description ||
      product.description?.slice(0, 160) ||
      "خرید آنلاین با بهترین کیفیت و ضمانت اصالت در ماوی";
    const canonical = product.canonical_url;
    const ogImage = product.og_image || product.media?.[0]?.url || product.image;

    const languages: Record<string, string> = {};
    if (Array.isArray(product.hreflang)) {
      for (const item of product.hreflang) {
        if (item.hreflang && item.href) {
          languages[item.hreflang] = item.href;
        }
      }
    }

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: Object.keys(languages).length > 0 ? languages : undefined,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        locale: "fa_IR",
        type: "website",
        images: ogImage ? [{ url: ogImage }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ogImage ? [ogImage] : [],
      },
    };
  } catch {
    return {
      title: "جزئیات محصول | ماوی MAVI",
      description: "مشاهده جزئیات، مشخصات و خرید آنلاین محصول در فروشگاه تخصصی مد و پوشاک ماوی (MAVI)",
    };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

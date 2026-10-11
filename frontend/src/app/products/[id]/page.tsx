import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  fetchProduct,
  fetchProductFullData,
  buildProductMetadata,
  buildProductJsonLd,
} from "@/lib/server-api";
import ProductDetailClient from "@/components/products/product-detail-client";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    return {
      title: "محصول یافت نشد",
      description: "متاسفانه محصول مورد نظر در فروشگاه ماوی یافت نشد یا حذف شده است.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildProductMetadata(product, product.slug || id);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const { product, options, variants, reviews, related } =
    await fetchProductFullData(id);

  if (!product) {
    notFound();
  }

  // Canonicalize raw UUID URLs to clean SEO English slug
  if (product.slug && id === product.id) {
    redirect(`/products/${product.slug}`);
  }

  const jsonLd = buildProductJsonLd(product, id);

  return (
    <>
      {/* Server-Rendered JSON-LD Structured Data for Search Engine Bots */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ProductDetailClient
        initialProduct={product}
        initialOptions={options}
        initialVariants={variants}
        initialReviews={reviews}
        initialRelated={related}
        productIdOrSlug={id}
      />
    </>
  );
}
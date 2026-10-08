import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Tag, Layers } from "lucide-react";
import {
  fetchCategory,
  fetchCategoryProducts,
  buildCategoryMetadata,
  buildCategoryJsonLd,
  getSiteBaseUrl,
} from "@/lib/server-api";
import CategoryProductsClient from "@/components/categories/category-products-client";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);

  if (!category) {
    return {
      title: "دسته‌بندی یافت نشد | ماوی MAVI",
      description: "دسته‌بندی مورد نظر در فروشگاه ماوی یافت نشد.",
      robots: { index: false, follow: false },
    };
  }

  return buildCategoryMetadata(category, slug);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await fetchCategory(slug);

  if (!category) {
    notFound();
  }

  const products = await fetchCategoryProducts(slug, 36);
  const jsonLd = buildCategoryJsonLd(category, products);

  return (
    <>
      {/* Server-Rendered JSON-LD for Category / Collection SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        className="min-h-screen bg-[#FAFCFE] text-[#0B192C] pt-24 md:pt-28 pb-24 px-4 md:px-6 max-w-7xl mx-auto"
        dir="rtl"
      >
        {/* Breadcrumbs Navigation */}
        <nav
          aria-label="مسیر راهنما"
          className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-6"
        >
          <Link href="/" className="hover:text-[#0082CA] transition-colors">
            صفحه اصلی
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/products" className="hover:text-[#0082CA] transition-colors">
            دسته‌بندی‌ها
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-[#0B192C] font-bold">{category.name}</span>
        </nav>

        {/* Category Header Hero */}
        <div className="relative rounded-3xl overflow-hidden border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-sky-100/40 p-6 md:p-10 mb-8 shadow-sm">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#0082CA] border border-sky-200 text-xs font-bold shadow-sm">
              <Layers className="w-3.5 h-3.5" />
              <span>دسته‌بندی محصولات ماوی</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-[#0B192C] tracking-tight">
              {category.name}
            </h1>

            {category.description && (
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {/* Products Grid and Client Filters */}
        <CategoryProductsClient initialProducts={products} category={category} />
      </main>
    </>
  );
}

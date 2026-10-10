import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchCollection,
  buildCollectionMetadata,
  getSiteBaseUrl,
} from "@/lib/server-api";
import CollectionProductsClient from "@/components/collections/collection-products-client";

export const dynamic = "force-dynamic";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await fetchCollection(slug);

  if (!collection) {
    return {
      title: "کالکشن یافت نشد | ماوی MAVI",
      description: "کالکشن مورد نظر در فروشگاه ماوی یافت نشد.",
      robots: { index: false, follow: false },
    };
  }

  return buildCollectionMetadata(collection, slug);
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await fetchCollection(slug);

  if (!collection) {
    notFound();
  }

  const products = collection.products || [];
  const bannerImg =
    collection.hero_banner ||
    collection.image_url ||
    collection.image ||
    (collection as any).seo_metadata?.hero_banner;
  const siteUrl = getSiteBaseUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name || collection.title,
    description: collection.description || "کالکشن اختصاصی ماوی",
    url: `${siteUrl}/collections/${slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.slice(0, 20).map((prod: any, idx: number) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${siteUrl}/products/${prod.slug || prod.id}`,
        name: prod.title || prod.name,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        className="min-h-screen bg-[#FAFCFE] text-[#0B192C] pt-24 md:pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto"
        dir="rtl"
      >
        {/* Responsive Event Banner */}
        {bannerImg ? (
          <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-sky-100 mb-8 md:mb-12 aspect-[2/1] sm:aspect-[16/7] md:aspect-[21/8] bg-sky-50 shadow-xl shadow-sky-950/5">
            <img
              src={bannerImg}
              alt={collection.name || collection.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] sm:text-xs text-white font-bold w-max mb-2">
                رویداد ویژه و کالکشن
              </span>
              <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white mb-1 sm:mb-2">
                {collection.name || collection.title}
              </h1>
              {collection.description && (
                <p className="text-xs sm:text-sm md:text-base text-gray-200 max-w-2xl line-clamp-2 sm:line-clamp-3">
                  {collection.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-[#0B192C] mb-4">
              {collection.name || collection.title}
            </h1>
            {collection.description && (
              <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base">
                {collection.description}
              </p>
            )}
          </div>
        )}

        {/* Collection Products Client with Filter, Search and Sorting */}
        <CollectionProductsClient
          initialProducts={products}
          collectionName={collection.name || collection.title || "کالکشن"}
        />
      </main>
    </>
  );
}
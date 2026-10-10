import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  fetchCollection,
  buildCollectionMetadata,
  getSiteBaseUrl,
} from "@/lib/server-api";
import { formatPrice, getDiscountInfo } from "@/lib/price-utils";

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

        {products.length === 0 ? (
          <div className="text-center text-slate-400 py-16 bg-white rounded-3xl border border-sky-100 p-8 shadow-sm">
            محصولی در این کالکشن وجود ندارد.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product: any) => {
              const disc = getDiscountInfo(product);
              const imgUrl =
                product.imageUrl ||
                product.image_url ||
                (Array.isArray(product.images) && product.images[0]?.url) ||
                (Array.isArray(product.images) && typeof product.images[0] === "string" ? product.images[0] : null) ||
                "/placeholder-product.svg";

              return (
                <Link
                  key={product.id || product.slug}
                  href={`/products/${product.slug || product.id}`}
                  className="group flex flex-col bg-white rounded-2xl border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-xl hover:shadow-sky-950/5 transition-all overflow-hidden"
                >
                  <div className="relative aspect-[3/4] bg-sky-50/50 overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={product.title || product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    {disc.hasDiscount && (
                      <div className="absolute top-2.5 right-2.5 z-20">
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-md">
                          ٪{disc.discountPercent} تخفیف
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-2">
                    <h3 className="text-xs sm:text-sm font-bold text-[#0B192C] group-hover:text-[#0082CA] transition-colors line-clamp-2">
                      {product.name || product.title}
                    </h3>
                    <div className="flex flex-col">
                      {disc.hasDiscount ? (
                        <>
                          <span className="text-[11px] text-slate-400 line-through">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-[#0082CA]">
                            {formatPrice(disc.discountPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs sm:text-sm font-black text-[#0B192C]">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
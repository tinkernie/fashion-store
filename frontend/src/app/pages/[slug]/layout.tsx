import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const backendUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

  try {
    const res = await fetch(`${backendUrl}/api/pages/${encodeURIComponent(slug)}/`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const page = await res.json();
      const title = page.meta_title || `${page.title} | ماوی MAVI`;
      const description =
        page.meta_description ||
        page.content?.replace(/<[^>]*>/g, "").slice(0, 160) ||
        "مشاهده برگه در فروشگاه ماوی (MAVI)";
      return {
        title: { absolute: title },
        description,
        alternates: { canonical: `/pages/${slug}` },
        openGraph: {
          title,
          description,
          url: `/pages/${slug}`,
          siteName: "ماوی MAVI",
          locale: "fa_IR",
          type: "article",
        },
        twitter: {
          card: "summary",
          title,
          description,
        },
      };
    }
  } catch {}

  return {
    title: "برگه | ماوی MAVI",
    description: "فروشگاه تخصصی مد و پوشاک فاخر ماوی (MAVI)",
  };
}

export default function CMSPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

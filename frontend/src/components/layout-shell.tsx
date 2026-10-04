"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <div className="min-h-screen bg-background text-foreground flex-1 w-full min-w-0">{children}</div>;
  }

  return (
    <>
      <Navbar />
      <div className="flex-1 w-full min-w-0">{children}</div>
      <Footer />
    </>
  );
}

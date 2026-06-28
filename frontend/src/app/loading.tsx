import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 max-w-7xl mx-auto">
      {/* Hero Skeleton */}
      <Skeleton className="w-full h-[300px] md:h-[400px] rounded-3xl bg-white/5 mb-16" />

      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-8 w-24 bg-white/5" />
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-4">
            <Skeleton className="h-[350px] w-full rounded-3xl bg-white/5" />
            <div className="space-y-2 px-2">
              <Skeleton className="h-4 w-3/4 bg-white/5" />
              <Skeleton className="h-4 w-1/2 bg-white/5" />
              <Skeleton className="h-5 w-1/3 bg-white/5 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
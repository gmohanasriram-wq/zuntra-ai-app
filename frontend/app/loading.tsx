import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <Skeleton className="mb-6 h-16 w-full" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[360px] w-full rounded-[28px]" />
        ))}
      </div>
    </main>
  );
}

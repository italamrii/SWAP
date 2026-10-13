import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page pt-7" aria-busy="true" aria-label="جارٍ تحميل الإعلان">
      <Skeleton className="h-4 w-72" />
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-12">
        <div>
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <div className="mt-3 flex gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] w-24 rounded-lg" />)}</div>
          <Skeleton className="mt-8 h-6 w-40" />
          <Skeleton className="mt-4 h-48 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

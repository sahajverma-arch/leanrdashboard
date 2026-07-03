// Opportunity: five titled sections (Renewal, Part Payment, Extension, Referral,
// Reactivation), each a row of KPI cards. Mirrors the real page so the swap to
// live content doesn't jump.

function Shimmer({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 ${className}`} />
}

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Shimmer className="h-3 w-24" />
      <Shimmer className="mt-2 h-7 w-20" />
    </div>
  )
}

function SectionSkeleton({ cols }: { cols: 3 | 4 }) {
  const grid = cols === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
  return (
    <section>
      <Shimmer className="mb-2 h-4 w-28" />
      <div className={`grid gap-3 ${grid}`}>
        {Array.from({ length: cols }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    </section>
  )
}

export default function Loading() {
  return (
    <>
      <div className="mb-5">
        <Shimmer className="h-6 w-44" />
        <Shimmer className="mt-2 h-4 w-72" />
      </div>
      <div className="space-y-6">
        <SectionSkeleton cols={4} />
        <SectionSkeleton cols={3} />
        <SectionSkeleton cols={3} />
        <SectionSkeleton cols={3} />
        <SectionSkeleton cols={3} />
      </div>
    </>
  )
}

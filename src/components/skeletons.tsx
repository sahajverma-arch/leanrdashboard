// Loading skeletons rendered instantly on navigation (via each route's
// loading.tsx) while the page's server data streams in. The layout mirrors the
// real pages so the swap to live content is seamless rather than a layout jump.

function Shimmer({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-zinc-200 ${className}`} />
}

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <Shimmer className="h-3 w-20" />
      <Shimmer className="mt-2 h-7 w-24" />
      <Shimmer className="mt-2 h-3 w-16" />
    </div>
  )
}

function PanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-4 ${className}`}>
      <Shimmer className="mb-4 h-4 w-40" />
      <Shimmer className="h-[280px] w-full" />
    </section>
  )
}

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
      <Shimmer className="mb-4 h-4 w-40" />
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Shimmer key={i} className="h-7 w-full" />
        ))}
      </div>
    </section>
  )
}

export function DashboardSkeleton({
  kpis = 4,
  kpiCols = 'md:grid-cols-4',
  panels = 2,
  wideLastPanel = false,
  table = false,
}: {
  kpis?: number
  kpiCols?: string
  panels?: number
  wideLastPanel?: boolean
  table?: boolean
}) {
  return (
    <>
      {/* Page header */}
      <div className="mb-5">
        <Shimmer className="h-6 w-44" />
        <Shimmer className="mt-2 h-4 w-60" />
      </div>

      {/* Filter bar */}
      <Shimmer className="mb-4 h-12 w-full" />

      {/* KPI row */}
      <div className={`grid grid-cols-2 gap-3 ${kpiCols}`}>
        {Array.from({ length: kpis }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>

      {/* Chart panels */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: panels }).map((_, i) => (
          <PanelSkeleton
            key={i}
            className={wideLastPanel && i === panels - 1 ? 'lg:col-span-2' : ''}
          />
        ))}
      </div>

      {table && <TableSkeleton />}
    </>
  )
}

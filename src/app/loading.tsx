import { DashboardSkeleton } from '@/components/skeletons'

// Overview: KPI cards only — no filter bar, no charts.
export default function Loading() {
  return (
    <DashboardSkeleton
      kpis={6}
      kpiCols="md:grid-cols-3 lg:grid-cols-6"
      panels={0}
      filter={false}
    />
  )
}

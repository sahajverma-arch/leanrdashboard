import { DashboardSkeleton } from '@/components/skeletons'

// Overview: date-range filter, then KPI cards (no charts).
export default function Loading() {
  return (
    <DashboardSkeleton
      kpis={6}
      kpiCols="md:grid-cols-3 lg:grid-cols-6"
      panels={0}
    />
  )
}

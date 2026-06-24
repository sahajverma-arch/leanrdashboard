import { DashboardSkeleton } from '@/components/skeletons'

// Overview: 6 KPIs, 2 chart panels, no table.
export default function Loading() {
  return (
    <DashboardSkeleton kpis={6} kpiCols="md:grid-cols-3 lg:grid-cols-6" panels={2} />
  )
}

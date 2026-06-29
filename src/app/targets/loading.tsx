import { DashboardSkeleton } from '@/components/skeletons'

// Sales Target: 5 target KPIs + a single team table (no filter bar, no charts).
export default function Loading() {
  return (
    <DashboardSkeleton
      kpis={5}
      kpiCols="md:grid-cols-5"
      panels={0}
      table
      filter={false}
    />
  )
}

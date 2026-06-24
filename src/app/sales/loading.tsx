import { DashboardSkeleton } from '@/components/skeletons'

// Sales: 4 KPIs, 3 chart panels (last full-width), recent-sales table.
export default function Loading() {
  return <DashboardSkeleton kpis={4} panels={3} wideLastPanel table />
}

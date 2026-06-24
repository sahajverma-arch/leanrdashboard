import { DashboardSkeleton } from '@/components/skeletons'

// CSAT: 4 KPIs, 4 chart panels, no table.
export default function Loading() {
  return <DashboardSkeleton kpis={4} panels={4} />
}

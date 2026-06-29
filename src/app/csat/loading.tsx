import { DashboardSkeleton } from '@/components/skeletons'

// CSAT: month filter, 4 KPIs, a top-3 table, then 2 chart panels.
export default function Loading() {
  return <DashboardSkeleton kpis={4} panels={2} table />
}

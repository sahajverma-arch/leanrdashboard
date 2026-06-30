import { DashboardSkeleton } from '@/components/skeletons'

// Opportunity: 4 KPIs, then the coach-wise and team-wise tables.
export default function Loading() {
  return <DashboardSkeleton kpis={4} panels={0} filter={false} table />
}

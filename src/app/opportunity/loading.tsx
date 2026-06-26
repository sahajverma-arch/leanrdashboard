import { DashboardSkeleton } from '@/components/skeletons'

// Opportunity: 4 KPIs, two by-coach table panels, no filter bar.
export default function Loading() {
  return <DashboardSkeleton kpis={4} panels={2} filter={false} />
}

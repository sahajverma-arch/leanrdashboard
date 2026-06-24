import { DashboardSkeleton } from '@/components/skeletons'

// Coaches: 4 KPIs, 2 chart panels, coach-breakdown table.
export default function Loading() {
  return <DashboardSkeleton kpis={4} panels={2} table />
}

import { DashboardSkeleton } from '@/components/skeletons'

// Coach & Dietitian view: sub-tab bar (approximated by the filter row), 4 KPIs,
// no chart panels, one per-coach table.
export default function Loading() {
  return <DashboardSkeleton kpis={4} panels={0} table />
}

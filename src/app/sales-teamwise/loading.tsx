import { DashboardSkeleton } from '@/components/skeletons'

// Sales teamwise: month filter, 4 KPIs, then the department × order-type table.
export default function Loading() {
  return <DashboardSkeleton kpis={4} panels={0} table />
}

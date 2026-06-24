import { DashboardSkeleton } from '@/components/skeletons'

// Clients: 5 KPIs, 2 chart panels, client-roster table.
export default function Loading() {
  return <DashboardSkeleton kpis={5} kpiCols="md:grid-cols-5" panels={2} table />
}

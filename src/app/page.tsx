import { getData } from '@/lib/data'
import { PageHeader, Kpi, Panel, SetupNotice } from '@/components/ui'
import { RevenueLineChart, StatusPieChart } from '@/components/charts'
import {
  computeKpis,
  revenueByMonth,
  clientsByStatus,
  avgWeightLost,
  formatINR,
} from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  const { data, error } = await getData()
  if (!data) return <SetupNotice error={error} />

  const { coaches, clients, sales, csat } = data
  const k = computeKpis(coaches, clients, sales, csat)

  return (
    <>
      <PageHeader title="Overview" subtitle="Top-line LEANR performance" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Total revenue" value={formatINR(k.totalRevenue)} sub={`${k.totalSales} sales`} />
        <Kpi
          label="Active clients"
          value={`${k.activeClients}/${k.totalClients}`}
          sub={`${k.activeRate.toFixed(1)}% active`}
        />
        <Kpi label="Avg CSAT" value={`${k.avgCsat.toFixed(2)} / 5`} sub={`${csat.length} ratings`} />
        <Kpi label="Avg weight lost" value={`${avgWeightLost(clients).toFixed(1)} kg`} />
        <Kpi label="Coaches" value={String(k.totalCoaches)} />
        <Kpi label="Clients" value={String(k.totalClients)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Revenue by month">
          <RevenueLineChart data={revenueByMonth(sales)} />
        </Panel>
        <Panel title="Clients by status">
          <StatusPieChart data={clientsByStatus(clients)} />
        </Panel>
      </div>
    </>
  )
}

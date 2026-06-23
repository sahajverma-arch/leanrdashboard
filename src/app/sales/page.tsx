import { getData } from '@/lib/data'
import { PageHeader, Kpi, Panel, SetupNotice } from '@/components/ui'
import { RevenueLineChart, RevenueBarChart } from '@/components/charts'
import {
  revenueByMonth,
  revenueByPlan,
  revenueByType,
  recentSales,
  formatINR,
} from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function SalesPage() {
  const { data, error } = await getData()
  if (!data) return <SetupNotice error={error} />

  const { coaches, clients, sales } = data
  const totalRevenue = sales.reduce((s, x) => s + (Number(x.amount) || 0), 0)
  const avgSale = sales.length ? totalRevenue / sales.length : 0
  const thisMonth = revenueByMonth(sales).at(-1)
  const rows = recentSales(sales, clients, coaches, 25)

  return (
    <>
      <PageHeader title="Sales" subtitle="Revenue performance & recent deals" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Total revenue" value={formatINR(totalRevenue)} />
        <Kpi label="Total sales" value={String(sales.length)} />
        <Kpi label="Avg sale value" value={formatINR(avgSale)} />
        <Kpi
          label="Latest month"
          value={thisMonth ? formatINR(thisMonth.value) : '—'}
          sub={thisMonth?.name}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Revenue by month">
          <RevenueLineChart data={revenueByMonth(sales)} />
        </Panel>
        <Panel title="Revenue by plan">
          <RevenueBarChart data={revenueByPlan(sales)} />
        </Panel>
        <Panel title="Revenue by sale type" className="lg:col-span-2">
          <RevenueBarChart data={revenueByType(sales)} />
        </Panel>
      </div>

      <Panel title="Recent sales" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Client</th>
                <th className="py-2 pr-4 font-medium">Coach</th>
                <th className="py-2 pr-4 font-medium">Plan</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100">
                  <td className="py-2 pr-4 text-zinc-600">{r.date}</td>
                  <td className="py-2 pr-4 font-medium text-zinc-900">{r.client}</td>
                  <td className="py-2 pr-4 text-zinc-600">{r.coach}</td>
                  <td className="py-2 pr-4 text-zinc-600">{r.plan}</td>
                  <td className="py-2 pr-4 text-zinc-600 capitalize">{r.type}</td>
                  <td className="py-2 text-right tabular-nums">{formatINR(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}

import { getDashboard } from '@/lib/data'
import { parseFilters } from '@/lib/filters'
import FilterBar from '@/components/filter-bar'
import { PageHeader, Kpi, Panel, SetupNotice } from '@/components/ui'
import { CsatBarChart, RevenueBarChart } from '@/components/charts'
import { computeKpis, revenueByCoach, coachBreakdown, formatINR } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | string[] | undefined>>

export default async function CoachesPage({ searchParams }: { searchParams: SP }) {
  const f = parseFilters(await searchParams)
  const { data, error } = await getDashboard(f)
  if (!data) return <SetupNotice error={error} />

  const { coaches, clients, sales, csat, options } = data
  const k = computeKpis(coaches, clients, sales, csat)
  const rows = coachBreakdown(coaches, clients, sales, csat)
  const csatByCoach = csat.byCoach.slice(0, 12).map((c) => ({ name: c.name, value: c.value }))

  return (
    <>
      <PageHeader title="Coaches" subtitle="Per-coach performance" />
      <FilterBar options={options} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Active coaches" value={String(rows.length)} />
        <Kpi label="Clients / coach" value={(k.totalClients / (rows.length || 1)).toFixed(1)} />
        <Kpi label="Total revenue" value={formatINR(k.totalRevenue)} />
        <Kpi label="Avg CSAT" value={`${k.avgCsat.toFixed(2)} / 5`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Top 12 coaches by revenue">
          <RevenueBarChart data={revenueByCoach(coaches, sales).slice(0, 12)} />
        </Panel>
        <Panel title="Top 12 coaches by CSAT">
          <CsatBarChart data={csatByCoach} />
        </Panel>
      </div>

      <Panel title="Coach breakdown" className="mt-4">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="py-2 pr-4 font-medium">Coach</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 text-right font-medium">Clients</th>
                <th className="py-2 pr-4 text-right font-medium">Revenue</th>
                <th className="py-2 text-right font-medium">Avg CSAT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.name} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{c.name}</td>
                  <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{c.role}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{c.clients}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatINR(c.revenue)}</td>
                  <td className="py-2 text-right tabular-nums">{c.avgCsat ? c.avgCsat.toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}

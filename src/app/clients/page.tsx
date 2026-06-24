import { getDashboard } from '@/lib/data'
import { parseFilters } from '@/lib/filters'
import FilterBar from '@/components/filter-bar'
import { PageHeader, Kpi, Panel, SetupNotice } from '@/components/ui'
import { StatusPieChart, CountBarChart } from '@/components/charts'
import { clientsByStatus, clientsByPlan, clientsWithNames, avgWeightLost } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | string[] | undefined>>

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  cnr: 'bg-rose-100 text-rose-700',
}

export default async function ClientsPage({ searchParams }: { searchParams: SP }) {
  const f = parseFilters(await searchParams)
  const { data, error } = await getDashboard(f)
  if (!data) return <SetupNotice error={error} />

  const { coaches, clients, options } = data
  const counts = (status: string) => clients.filter((c) => c.status === status).length
  const rows = clientsWithNames(clients, coaches)

  return (
    <>
      <PageHeader title="Clients" subtitle="Roster, status & plans" />
      <FilterBar options={options} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Total" value={clients.length.toLocaleString('en-IN')} />
        <Kpi label="Active" value={String(counts('active'))} />
        <Kpi label="Paused" value={String(counts('paused'))} />
        <Kpi label="CNR" value={String(counts('cnr'))} />
        <Kpi label="Avg weight lost" value={`${avgWeightLost(clients).toFixed(1)} kg`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Clients by status">
          <StatusPieChart data={clientsByStatus(clients)} />
        </Panel>
        <Panel title="Clients by plan">
          <CountBarChart data={clientsByPlan(clients)} color="#2563eb" />
        </Panel>
      </div>

      <Panel title={`Clients (${rows.length.toLocaleString('en-IN')})`} className="mt-4">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="py-2 pr-4 font-medium">Client</th>
                <th className="py-2 pr-4 font-medium">Coach</th>
                <th className="py-2 pr-4 font-medium">Plan</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Weight lost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-zinc-100">
                  <td className="py-2 pr-4 font-medium text-zinc-900">{c.name}</td>
                  <td className="py-2 pr-4 text-zinc-600">{c.coach}</td>
                  <td className="py-2 pr-4 text-zinc-600">{c.plan}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[c.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums">{c.weightLost.toFixed(1)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}

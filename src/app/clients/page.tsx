import { getDashboard } from '@/lib/data'
import { parseFilters } from '@/lib/filters'
import FilterBar from '@/components/filter-bar'
import { PageHeader, Kpi, Panel, SetupNotice } from '@/components/ui'
import { StatusPieChart, CountBarChart } from '@/components/charts'
import {
  clientsByStatus,
  clientsByPlan,
  clientsByGroup,
  clientsWithNames,
  planGroup,
  avgWeightLost,
  topN,
} from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | string[] | undefined>>

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  cnr: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
}

const GROUP_STYLES: Record<string, string> = {
  'Learn Basic': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'Learn Adv': 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
}

export default async function ClientsPage({ searchParams }: { searchParams: SP }) {
  const f = parseFilters(await searchParams)
  const { data, error } = await getDashboard(f)
  if (!data) return <SetupNotice error={error} />

  const { coaches, clients, options } = data
  const counts = (status: string) => clients.filter((c) => c.status === status).length
  const groupCount = (g: string) => clients.filter((c) => planGroup(c.plan) === g).length
  const pct = (n: number) => (clients.length ? `${Math.round((n / clients.length) * 100)}% of total` : undefined)
  const learnBasic = groupCount('Learn Basic')
  const learnAdv = groupCount('Learn Adv')

  // "Learn Basic X · Learn Adv Y" split for any client subset — drives the
  // per-KPI bifurcation sub-lines.
  const basicClients = clients.filter((c) => planGroup(c.plan) === 'Learn Basic')
  const advClients = clients.filter((c) => planGroup(c.plan) === 'Learn Adv')
  const splitSub = (pred: (c: (typeof clients)[number]) => boolean) => {
    const b = basicClients.filter(pred).length
    const a = advClients.filter(pred).length
    return `Basic ${b.toLocaleString('en-IN')} · Adv ${a.toLocaleString('en-IN')}`
  }
  const weightSub = `Basic ${avgWeightLost(basicClients).toFixed(1)} · Adv ${avgWeightLost(advClients).toFixed(1)} kg`

  // Learn Basic vs Learn Adv split within one status — for the per-status pies.
  const groupSplit = (status: string) =>
    [
      { name: 'Learn Basic', value: basicClients.filter((c) => c.status === status).length },
      { name: 'Learn Adv', value: advClients.filter((c) => c.status === status).length },
    ].filter((d) => d.value > 0)

  const rows = clientsWithNames(clients, coaches)

  return (
    <>
      <PageHeader title="Clients" subtitle="Roster, status & plans" />
      <FilterBar options={options} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <Kpi label="Total" value={clients.length.toLocaleString('en-IN')} sub={`Basic ${learnBasic.toLocaleString('en-IN')} · Adv ${learnAdv.toLocaleString('en-IN')}`} />
        <Kpi label="Learn Basic" value={learnBasic.toLocaleString('en-IN')} sub={pct(learnBasic)} />
        <Kpi label="Learn Adv" value={learnAdv.toLocaleString('en-IN')} sub={pct(learnAdv)} />
        <Kpi label="Active" value={String(counts('active'))} sub={splitSub((c) => c.status === 'active')} />
        <Kpi label="Paused" value={String(counts('paused'))} sub={splitSub((c) => c.status === 'paused')} />
        <Kpi label="CNR" value={String(counts('cnr'))} sub={splitSub((c) => c.status === 'cnr')} />
        <Kpi label="Avg weight lost" value={`${avgWeightLost(clients).toFixed(1)} kg`} sub={weightSub} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Clients by group">
          <StatusPieChart data={clientsByGroup(clients)} />
        </Panel>
        <Panel title="Clients by status">
          <StatusPieChart data={clientsByStatus(clients)} />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Panel title="Active — Basic vs Adv">
          <StatusPieChart data={groupSplit('active')} />
        </Panel>
        <Panel title="Paused — Basic vs Adv">
          <StatusPieChart data={groupSplit('paused')} />
        </Panel>
        <Panel title="CNR — Basic vs Adv">
          <StatusPieChart data={groupSplit('cnr')} />
        </Panel>
      </div>

      <Panel title="Clients by plan (top 12)" className="mt-4">
        <CountBarChart data={topN(clientsByPlan(clients), 12)} color="#2563eb" />
      </Panel>

      <Panel title={`Clients (${rows.length.toLocaleString('en-IN')})`} className="mt-4">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="py-2 pr-4 font-medium">Client</th>
                <th className="py-2 pr-4 font-medium">Coach</th>
                <th className="py-2 pr-4 font-medium">Plan</th>
                <th className="py-2 pr-4 font-medium">Group</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Weight lost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{c.name}</td>
                  <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{c.coach}</td>
                  <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{c.plan}</td>
                  <td className="py-2 pr-4">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${GROUP_STYLES[c.group] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                      {c.group}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[c.status] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
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

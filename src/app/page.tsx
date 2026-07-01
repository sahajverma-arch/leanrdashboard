import { getDashboard, getTopPerformerSales } from '@/lib/data'
import { PageHeader, Kpi, SetupNotice, TopCoaches } from '@/components/ui'
import { computeKpis, avgWeightLost, avgWeightLost15d, formatINR, planGroup } from '@/lib/dashboard'
import { topPerformers, topTeams } from '@/lib/top-performers'
import { resolveDateRange } from '@/lib/date-range'
import DateRangeFilter from '@/components/date-range-filter'

export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | string[] | undefined>>

export default async function OverviewPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  // Default (no date filter) = current month; any From/To overrides it.
  const { start, end, rangeLabel } = resolveDateRange(sp)

  const [{ data, error }, topPerfRows] = await Promise.all([
    getDashboard({ start, end }),
    getTopPerformerSales(),
  ])
  if (!data) return <SetupNotice error={error} />

  const { coaches, clients, sales, csat } = data
  const k = computeKpis(coaches, clients, sales, csat)

  // Clients by status, each split by plan group (roster — not date-scoped).
  const statusGroup = (status: string, g: string) =>
    clients.filter((c) => c.status === status && planGroup(c.plan) === g).length
  const activeBasic = statusGroup('active', 'Learn Basic')
  const activeAdv = statusGroup('active', 'Learn Adv')
  const cnrBasic = statusGroup('cnr', 'Learn Basic')
  const cnrAdv = statusGroup('cnr', 'Learn Adv')
  const pausedBasic = statusGroup('paused', 'Learn Basic')
  const pausedAdv = statusGroup('paused', 'Learn Adv')

  // 15-day weight loss can be slightly negative in aggregate; treat a ~zero
  // average as 0.0 so it never renders as "-0.0 kg".
  const avg15 = avgWeightLost15d(clients)
  const avg15Kg = `${(Math.abs(avg15) < 0.05 ? 0 : avg15).toFixed(1)} kg`

  // Top 3 coaches and top 3 teams by sales within the selected date range.
  const topOverall = topPerformers(topPerfRows, { start, end }, 3)
  const topTeamsList = topTeams(topPerfRows, { start, end }, 3)

  // Coach counts by type, from the coach sheets (roster — not month-scoped).
  const countByType = (t: string) => coaches.filter((c) => c.type === t).length

  return (
    <>
      <PageHeader title="Overview" subtitle={`Top-line LEANR performance · ${rangeLabel}`} />
      <DateRangeFilter />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Total revenue" value={formatINR(k.totalRevenue)} sub={`${k.totalSales} sales`} />
        <Kpi label="Avg CSAT" value={k.avgCsat.toFixed(2)} />
        <Kpi label="Avg weight lost" value={`${avgWeightLost(clients).toFixed(1)} kg`} />
        <Kpi label="Avg weight lost (15d)" value={avg15Kg} />
      </div>

      <h2 className="mt-6 mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Clients by status
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi label="Basic active" value={activeBasic.toLocaleString('en-IN')} />
        <Kpi label="Adv active" value={activeAdv.toLocaleString('en-IN')} />
        <Kpi label="Basic CNR" value={cnrBasic.toLocaleString('en-IN')} />
        <Kpi label="Adv CNR" value={cnrAdv.toLocaleString('en-IN')} />
        <Kpi label="Basic paused" value={pausedBasic.toLocaleString('en-IN')} />
        <Kpi label="Adv paused" value={pausedAdv.toLocaleString('en-IN')} />
      </div>

      <h2 className="mt-6 mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Coaches by type
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi label="PT Coaches" value={String(countByType('pt'))} sub="one-on-one PT sessions" />
        <Kpi label="Dietitians" value={String(countByType('dietitian'))} sub="diet consultation" />
        <Kpi label="Basic Coaches" value={String(countByType('basic'))} sub="diet & exercise consultation" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <TopCoaches
          title="Top performers"
          subtitle={`Highest coach sales · ${rangeLabel}`}
          items={topOverall}
          showType
        />
        <TopCoaches
          title="Top teams"
          subtitle={`Highest team sales · ${rangeLabel}`}
          items={topTeamsList}
        />
      </div>
    </>
  )
}

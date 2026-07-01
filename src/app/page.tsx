import { getDashboard, getTopPerformerSales } from '@/lib/data'
import { PageHeader, Kpi, SetupNotice, TopCoaches } from '@/components/ui'
import { computeKpis, avgWeightLost, formatINR, planGroup } from '@/lib/dashboard'
import { topPerformers } from '@/lib/top-performers'
import DateRangeFilter from '@/components/date-range-filter'

export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | string[] | undefined>>

const pad = (n: number) => String(n).padStart(2, '0')
const fmtDay = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return ymd
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function OverviewPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const startParam = typeof sp.start === 'string' && sp.start ? sp.start : undefined
  const endParam = typeof sp.end === 'string' && sp.end ? sp.end : undefined

  // Default (no date filter) = current month; any From/To overrides it.
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const monthEnd = `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const hasRange = !!(startParam || endParam)
  const start = hasRange ? startParam : monthStart
  const end = hasRange ? endParam : monthEnd

  const rangeLabel = !hasRange
    ? monthLabel
    : start && end
      ? `${fmtDay(start)} – ${fmtDay(end)}`
      : start
        ? `from ${fmtDay(start)}`
        : `until ${fmtDay(end!)}`

  const [{ data, error }, topPerfRows] = await Promise.all([
    getDashboard({ start, end }),
    getTopPerformerSales(),
  ])
  if (!data) return <SetupNotice error={error} />

  const { coaches, clients, sales, csat } = data
  const k = computeKpis(coaches, clients, sales, csat)

  // Active clients split by plan group (roster — not date-scoped).
  const activeGroup = (g: string) =>
    clients.filter((c) => c.status === 'active' && planGroup(c.plan) === g).length
  const activeBasic = activeGroup('Learn Basic')
  const activeAdv = activeGroup('Learn Adv')

  // Top 3 coaches by sales within the selected date range, across all teams.
  const topOverall = topPerformers(topPerfRows, { start, end }, 3)

  // Coach counts by type, from the coach sheets (roster — not month-scoped).
  const countByType = (t: string) => coaches.filter((c) => c.type === t).length

  return (
    <>
      <PageHeader title="Overview" subtitle={`Top-line LEANR performance · ${rangeLabel}`} />
      <DateRangeFilter />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Total revenue" value={formatINR(k.totalRevenue)} sub={`${k.totalSales} sales`} />
        <Kpi label="Basic active clients" value={activeBasic.toLocaleString('en-IN')} />
        <Kpi label="Adv active clients" value={activeAdv.toLocaleString('en-IN')} />
        <Kpi label="Avg CSAT" value={k.avgCsat.toFixed(2)} />
        <Kpi label="Avg weight lost" value={`${avgWeightLost(clients).toFixed(1)} kg`} />
        <Kpi label="Coaches" value={String(k.totalCoaches)} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi label="PT Coaches" value={String(countByType('pt'))} sub="one-on-one PT sessions" />
        <Kpi label="Dietitians" value={String(countByType('dietitian'))} sub="diet consultation" />
        <Kpi label="Basic Coaches" value={String(countByType('basic'))} sub="diet & exercise consultation" />
      </div>

      <div className="mt-3">
        <TopCoaches
          title="Top performers"
          subtitle={`Highest coach sales · ${rangeLabel}`}
          items={topOverall}
          showType
        />
      </div>
    </>
  )
}

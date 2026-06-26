import { getDashboard, getCoachMonthSales } from '@/lib/data'
import { PageHeader, Kpi, SetupNotice, TopCoaches } from '@/components/ui'
import { computeKpis, avgWeightLost, formatINR, topCoaches } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  // Overview is always scoped to the current month — no filters.
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const end = `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const [{ data, error }, coachSales] = await Promise.all([
    getDashboard({ start, end }),
    getCoachMonthSales(),
  ])
  if (!data) return <SetupNotice error={error} />

  const { coaches, clients, sales, csat } = data
  const k = computeKpis(coaches, clients, sales, csat)

  // Top 3 coaches by this month's sales, across all coach types.
  const topOverall = topCoaches(coachSales, 3)

  // Coach counts by type, from the coach sheets (roster — not month-scoped).
  const countByType = (t: string) => coaches.filter((c) => c.type === t).length

  return (
    <>
      <PageHeader title="Overview" subtitle={`Top-line LEANR performance · ${monthLabel}`} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Total revenue" value={formatINR(k.totalRevenue)} sub={`${k.totalSales} sales`} />
        <Kpi label="Active clients" value={k.activeClients.toLocaleString('en-IN')} />
        <Kpi label="Avg CSAT" value={k.avgCsat.toFixed(2)} />
        <Kpi label="Avg weight lost" value={`${avgWeightLost(clients).toFixed(1)} kg`} />
        <Kpi label="Coaches" value={String(k.totalCoaches)} />
        <Kpi label="Clients" value={String(k.totalClients)} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi label="PT Coaches" value={String(countByType('pt'))} sub="one-on-one PT sessions" />
        <Kpi label="Dietitians" value={String(countByType('dietitian'))} sub="diet consultation" />
        <Kpi label="Basic Coaches" value={String(countByType('basic'))} sub="diet & exercise consultation" />
      </div>

      <div className="mt-3">
        <TopCoaches
          title="Top performers"
          subtitle={`Highest coach sales · ${monthLabel}`}
          items={topOverall}
          showType
        />
      </div>
    </>
  )
}

import { getData } from '@/lib/data'
import { PageHeader, Kpi, Panel, SetupNotice } from '@/components/ui'
import { CsatBarChart, CsatLineChart, CountBarChart } from '@/components/charts'
import {
  computeKpis,
  csatByCoach,
  csatByCategory,
  csatByMonth,
  ratingDistribution,
} from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function CsatPage() {
  const { data, error } = await getData()
  if (!data) return <SetupNotice error={error} />

  const { coaches, clients, sales, csat } = data
  const k = computeKpis(coaches, clients, sales, csat)
  const ratings = csat.map((c) => Number(c.rating)).filter((r) => Number.isFinite(r))
  const happy = ratings.filter((r) => r >= 4).length
  const happyPct = ratings.length ? (happy / ratings.length) * 100 : 0
  const detractors = ratings.filter((r) => r <= 2).length

  return (
    <>
      <PageHeader title="CSAT" subtitle="Client satisfaction ratings" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Avg CSAT" value={`${k.avgCsat.toFixed(2)} / 5`} />
        <Kpi label="Ratings" value={String(csat.length)} />
        <Kpi label="Happy (4-5★)" value={`${happyPct.toFixed(0)}%`} sub={`${happy} ratings`} />
        <Kpi label="Detractors (1-2★)" value={String(detractors)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="CSAT trend by month">
          <CsatLineChart data={csatByMonth(csat)} />
        </Panel>
        <Panel title="Rating distribution">
          <CountBarChart data={ratingDistribution(csat)} color="#16a34a" />
        </Panel>
        <Panel title="Avg CSAT by coach">
          <CsatBarChart data={csatByCoach(coaches, csat)} />
        </Panel>
        <Panel title="Avg CSAT by category">
          <CsatBarChart data={csatByCategory(csat)} />
        </Panel>
      </div>
    </>
  )
}

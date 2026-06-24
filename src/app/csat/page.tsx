import { getDashboard } from '@/lib/data'
import { parseFilters } from '@/lib/filters'
import FilterBar from '@/components/filter-bar'
import { PageHeader, Kpi, Panel, SetupNotice } from '@/components/ui'
import { CsatBarChart, CsatLineChart, CountBarChart } from '@/components/charts'

export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | string[] | undefined>>

export default async function CsatPage({ searchParams }: { searchParams: SP }) {
  const f = parseFilters(await searchParams)
  const { data, error } = await getDashboard(f)
  if (!data) return <SetupNotice error={error} />

  const { csat, options } = data
  const happyPct = csat.count ? (csat.happy / csat.count) * 100 : 0
  const byCoach = csat.byCoach.slice(0, 12).map((c) => ({ name: c.name, value: c.value }))

  return (
    <>
      <PageHeader title="CSAT" subtitle="Client satisfaction ratings" />
      <FilterBar options={options} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Avg CSAT" value={`${csat.avg.toFixed(2)} / 5`} />
        <Kpi label="Ratings" value={csat.count.toLocaleString('en-IN')} />
        <Kpi label="Happy (4-5★)" value={`${happyPct.toFixed(0)}%`} sub={`${csat.happy.toLocaleString('en-IN')} ratings`} />
        <Kpi label="Detractors (1-2★)" value={csat.detractors.toLocaleString('en-IN')} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="CSAT trend by month">
          <CsatLineChart data={csat.byMonth} />
        </Panel>
        <Panel title="Rating distribution">
          <CountBarChart data={csat.distribution} color="#16a34a" />
        </Panel>
        <Panel title="Top 12 coaches by CSAT">
          <CsatBarChart data={byCoach} />
        </Panel>
        <Panel title="Avg CSAT by category">
          <CsatBarChart data={csat.byCategory} />
        </Panel>
      </div>
    </>
  )
}

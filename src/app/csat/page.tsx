import { getCsatPageData } from '@/lib/data'
import { PageHeader, Kpi, Panel, SetupNotice } from '@/components/ui'
import { CsatBarChart, CountBarChart } from '@/components/charts'
import CsatMonthFilter from '@/components/csat-month-filter'

export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | string[] | undefined>>

export default async function CsatPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const month = typeof sp.month === 'string' ? sp.month : undefined

  const { data, error } = await getCsatPageData(month)
  if (!data) return <SetupNotice error={error} />

  const { stats: csat, months } = data
  const happyPct = csat.count ? (csat.happy / csat.count) * 100 : 0
  const top3 = csat.byCoach.slice(0, 3)

  return (
    <>
      <PageHeader title="CSAT" subtitle="Client satisfaction ratings" />
      <CsatMonthFilter months={months} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Avg CSAT" value={`${csat.avg.toFixed(2)} / 5`} />
        <Kpi label="Ratings" value={csat.count.toLocaleString('en-IN')} />
        <Kpi
          label="Happy (5★)"
          value={`${happyPct.toFixed(0)}%`}
          sub={`${csat.happy.toLocaleString('en-IN')} ratings`}
        />
        <Kpi label="Detractors (1-3★)" value={csat.detractors.toLocaleString('en-IN')} />
      </div>

      {/* Top 3 coaches table — first, above the charts. */}
      <Panel title="Top 3 coaches by CSAT" className="mt-4">
        {top3.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No ratings in this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="py-2 pr-4 font-medium">#</th>
                <th className="py-2 pr-4 font-medium">Coach</th>
                <th className="py-2 pr-4 text-right font-medium">Avg CSAT</th>
                <th className="py-2 text-right font-medium">Ratings</th>
              </tr>
            </thead>
            <tbody>
              {top3.map((c, i) => (
                <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-4 tabular-nums text-zinc-500 dark:text-zinc-400">{i + 1}</td>
                  <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{c.name}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{c.value.toFixed(2)} / 5</td>
                  <td className="py-2 text-right tabular-nums">{c.n.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {/* Remaining charts, below the table. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Rating distribution">
          <CountBarChart data={csat.distribution} color="#16a34a" />
        </Panel>
        <Panel title="Avg CSAT by category">
          <CsatBarChart data={csat.byCategory} />
        </Panel>
      </div>
    </>
  )
}

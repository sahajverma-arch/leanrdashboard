import { getDashboard, getLeanrTeamSales, getTopPerformerSales } from '@/lib/data'
import SalesView, { type SalesAgg } from '@/components/sales-view'
import { PageHeader, SetupNotice, TopCoaches } from '@/components/ui'
import { topPerformers, topTeams, topPerformersByType, ecodeKey } from '@/lib/top-performers'
import { resolveDateRange } from '@/lib/date-range'
import DateRangeFilter from '@/components/date-range-filter'

export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | string[] | undefined>>

export default async function SalesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  // Default (no date filter) = current month; any From/To overrides it.
  const { start, end, rangeLabel } = resolveDateRange(sp)

  const [{ data, error }, leanrTeam, topPerfRows] = await Promise.all([
    getDashboard({ start, end }),
    getLeanrTeamSales(),
    getTopPerformerSales(),
  ])
  if (!data) return <SetupNotice error={error} />

  // Overall Sales — from the transaction rows, already date-filtered by getDashboard.
  const overall: SalesAgg = {
    revenue: data.sales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0),
    renew: data.sales.filter((s) => s.sale_type === 'renew').length,
    reactive: data.sales.filter((s) => s.sale_type === 'reactivate').length,
    reference: data.sales.filter((s) => s.sale_type === 'reference').length,
  }

  // Sales by LEANR Team — pre-aggregated per month; sum the months in range.
  const startYM = start?.slice(0, 7)
  const endYM = end?.slice(0, 7)
  const ltRows = leanrTeam.filter(
    (l) => (!startYM || l.month >= startYM) && (!endYM || l.month <= endYM),
  )
  const leanr: SalesAgg = {
    revenue: ltRows.reduce((sum, l) => sum + (l.sale || 0), 0),
    renew: ltRows.reduce((sum, l) => sum + (l.renew || 0), 0),
    reactive: ltRows.reduce((sum, l) => sum + (l.reactivation || 0), 0),
    reference: ltRows.reduce((sum, l) => sum + (l.reference || 0), 0),
  }

  // Top performers / teams within the date range (from top_performer_sales).
  const range = { start, end }
  const topOverall = topPerformers(topPerfRows, range, 3)
  const topTeamsList = topTeams(topPerfRows, range, 3)

  // Coach type ('pt'|'basic'|'dietitian') keyed by employee code, from the
  // roster — the dated sheet carries Team, not type, so we resolve it here.
  const typeByEcode = new Map<string, string>()
  for (const c of data.coaches) {
    const key = ecodeKey(c.name)
    if (key && c.type) typeByEcode.set(key, c.type)
  }
  const topDietitians = topPerformersByType(topPerfRows, typeByEcode, 'dietitian', range, 3)
  const topPt = topPerformersByType(topPerfRows, typeByEcode, 'pt', range, 3)
  const topBasic = topPerformersByType(topPerfRows, typeByEcode, 'basic', range, 3)

  return (
    <>
      <PageHeader title="Sales" subtitle={`Overall vs LEANR team · ${rangeLabel}`} />
      <DateRangeFilter />

      <SalesView overall={overall} leanr={leanr} rangeLabel={rangeLabel} />

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

      <h2 className="mt-6 mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Top coaches by sales · {rangeLabel}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TopCoaches title="Dietitians" items={topDietitians} />
        <TopCoaches title="PT Coaches" items={topPt} />
        <TopCoaches title="Basic Coaches" items={topBasic} />
      </div>
    </>
  )
}

import { getCoachOpportunity } from '@/lib/data'
import { coachOpportunities, opportunityTotals, type CoachOppStat } from '@/lib/dashboard'
import { PageHeader, Kpi, Panel } from '@/components/ui'

export const dynamic = 'force-dynamic'

function pct(conv: number, opp: number): string {
  return opp > 0 ? `${((conv / opp) * 100).toFixed(1)}%` : '—'
}

function OppTable({ rows, kind }: { rows: CoachOppStat[]; kind: 'renewal' | 'extension' }) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-400">No opportunities.</p>
  }
  return (
    <div className="max-h-[520px] overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-500">
            <th className="py-2 pr-4 font-medium">Coach</th>
            <th className="py-2 pr-4 text-right font-medium">Opportunities</th>
            <th className="py-2 pr-4 text-right font-medium">Converted</th>
            <th className="py-2 text-right font-medium">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const opp = kind === 'renewal' ? c.renewalOpp : c.extOpp
            const conv = kind === 'renewal' ? c.renewalConv : c.extConv
            return (
              <tr key={c.coach} className="border-b border-zinc-100">
                <td className="py-2 pr-4 font-medium text-zinc-900">{c.name}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{opp}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{conv}</td>
                <td className="py-2 text-right tabular-nums">{pct(conv, opp)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default async function OpportunityPage() {
  const rows = await getCoachOpportunity()
  const stats = coachOpportunities(rows)
  const totals = opportunityTotals(rows)

  const renewal = stats
    .filter((s) => s.renewalOpp > 0)
    .sort((a, b) => b.renewalOpp - a.renewalOpp || b.renewalConv - a.renewalConv)
  const extension = stats
    .filter((s) => s.extOpp > 0)
    .sort((a, b) => b.extOpp - a.extOpp || b.extConv - a.extConv)

  if (rows.length === 0) {
    return (
      <>
        <PageHeader title="Opportunity" subtitle="Renewal & extension conversion by coach" />
        <Panel title="No opportunity data yet">
          <p className="text-sm text-zinc-500">
            Once the sync mirrors the{' '}
            <code className="rounded bg-zinc-100 px-1">raw_data_coaches_opportunity</code> tab,
            renewal and extension numbers will appear here.
          </p>
        </Panel>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Opportunity" subtitle="Renewal & extension conversion by coach" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Renewal opportunities"
          value={String(totals.renewalOpp)}
          sub={`${totals.renewalConv} converted`}
        />
        <Kpi label="Renewal conversion" value={pct(totals.renewalConv, totals.renewalOpp)} />
        <Kpi
          label="Extension opportunities"
          value={String(totals.extOpp)}
          sub={`${totals.extConv} converted`}
        />
        <Kpi label="Extension conversion" value={pct(totals.extConv, totals.extOpp)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Renewal opportunity · by coach">
          <OppTable rows={renewal} kind="renewal" />
        </Panel>
        <Panel title="Extension opportunity · by coach">
          <OppTable rows={extension} kind="extension" />
        </Panel>
      </div>

      <p className="mt-3 text-xs text-zinc-400">
        Each opportunity is credited to both the dietitian and the exercise coach, so the per-coach
        rows can sum above the {totals.renewalOpp + totals.extOpp} unique opportunities in the KPIs.
      </p>
    </>
  )
}

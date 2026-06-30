import { getCoachTeamOpportunity } from '@/lib/data'
import { PageHeader, Kpi, Panel } from '@/components/ui'
import { convPct, oppTotals, type OppStat } from '@/lib/opportunity'

export const dynamic = 'force-dynamic'

const pctText = (conv: number, opp: number) => {
  const p = convPct(conv, opp)
  return p === null ? '—' : `${p.toFixed(0)}%`
}

// One opportunity table (coach-wise or team-wise), sorted by renewal
// opportunities desc. Renewal and Extension each show Opp / Converted / %.
function OppTable({ label, rows }: { label: string; rows: OppStat[] }) {
  const sorted = [...rows].sort((a, b) => b.renewalOpp - a.renewalOpp)
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <th rowSpan={2} className="py-2 pr-4 text-left align-bottom font-medium">{label}</th>
            <th colSpan={3} className="border-l border-zinc-200 py-1 text-center font-medium dark:border-zinc-700">
              Renewal
            </th>
            <th colSpan={3} className="border-l border-zinc-200 py-1 text-center font-medium dark:border-zinc-700">
              Extension
            </th>
          </tr>
          <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <th className="border-l border-zinc-200 py-1 pl-4 text-right font-medium dark:border-zinc-700">Opp</th>
            <th className="py-1 pl-4 text-right font-medium">Conv</th>
            <th className="py-1 pl-4 text-right font-medium">%</th>
            <th className="border-l border-zinc-200 py-1 pl-4 text-right font-medium dark:border-zinc-700">Opp</th>
            <th className="py-1 pl-4 text-right font-medium">Conv</th>
            <th className="py-1 pl-4 text-right font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.name} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{r.name}</td>
              <td className="border-l border-zinc-100 py-2 pl-4 text-right tabular-nums dark:border-zinc-800">{r.renewalOpp}</td>
              <td className="py-2 pl-4 text-right tabular-nums">{r.renewalConv}</td>
              <td className="py-2 pl-4 text-right tabular-nums text-zinc-500 dark:text-zinc-400">{pctText(r.renewalConv, r.renewalOpp)}</td>
              <td className="border-l border-zinc-100 py-2 pl-4 text-right tabular-nums dark:border-zinc-800">{r.extOpp}</td>
              <td className="py-2 pl-4 text-right tabular-nums">{r.extConv}</td>
              <td className="py-2 pl-4 text-right tabular-nums text-zinc-500 dark:text-zinc-400">{pctText(r.extConv, r.extOpp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function OpportunitiesPage() {
  const { coaches, teams } = await getCoachTeamOpportunity()

  if (!coaches.length && !teams.length) {
    return (
      <>
        <PageHeader title="Opportunity" subtitle="Renewal & extension — coach & team wise" />
        <Panel title="No data">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Couldn&apos;t read the &quot;opportunity&quot; sheet. Check that the tab exists and the
            service account has access.
          </p>
        </Panel>
      </>
    )
  }

  const t = oppTotals(coaches)

  return (
    <>
      <PageHeader title="Opportunity" subtitle="Renewal & extension — coach & team wise" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Renewal opportunities"
          value={t.renewalOpp.toLocaleString('en-IN')}
          sub={`${t.renewalConv.toLocaleString('en-IN')} converted (${pctText(t.renewalConv, t.renewalOpp)})`}
        />
        <Kpi
          label="Extension opportunities"
          value={t.extOpp.toLocaleString('en-IN')}
          sub={`${t.extConv.toLocaleString('en-IN')} converted (${pctText(t.extConv, t.extOpp)})`}
        />
        <Kpi label="Coaches" value={coaches.length.toLocaleString('en-IN')} />
        <Kpi label="Teams" value={teams.length.toLocaleString('en-IN')} />
      </div>

      <Panel title={`Coach wise (${coaches.length})`} className="mt-4">
        <OppTable label="Coach / Dietitian" rows={coaches} />
      </Panel>

      <Panel title={`Team wise (${teams.length})`} className="mt-4">
        <OppTable label="Team" rows={teams} />
      </Panel>
    </>
  )
}

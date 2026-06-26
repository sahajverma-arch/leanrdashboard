'use client'

import { useState } from 'react'
import {
  coachOpportunities,
  opportunityTotals,
  type OppRow,
  type CoachOppStat,
} from '@/lib/dashboard'
import { Kpi, Panel } from '@/components/ui'

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function pct(conv: number, opp: number): string {
  return opp > 0 ? `${((conv / opp) * 100).toFixed(1)}%` : '—'
}

function OppTable({ rows, kind }: { rows: CoachOppStat[]; kind: 'renewal' | 'extension' }) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-400">No opportunities in this month.</p>
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

const isOpp = (r: OppRow) =>
  String(r.renewal_opp ?? '').toLowerCase().includes('yes') ||
  String(r.extension_opp ?? '').toLowerCase().includes('yes')

export default function OpportunityView({ rows }: { rows: OppRow[] }) {
  // Month options = plan-start months that actually have opportunities, newest first.
  const monthSet = new Set<string>()
  for (const r of rows) {
    if (!isOpp(r)) continue
    const ym = String(r.start_date ?? '').slice(0, 7)
    if (/^\d{4}-\d{2}$/.test(ym)) monthSet.add(ym)
  }
  const months = [...monthSet].sort().reverse()
  const [month, setMonth] = useState<string>('all')

  const filtered =
    month === 'all' ? rows : rows.filter((r) => String(r.start_date ?? '').slice(0, 7) === month)
  const stats = coachOpportunities(filtered)
  const totals = opportunityTotals(filtered)

  const renewal = stats
    .filter((s) => s.renewalOpp > 0)
    .sort((a, b) => b.renewalOpp - a.renewalOpp || b.renewalConv - a.renewalConv)
  const extension = stats
    .filter((s) => s.extOpp > 0)
    .sort((a, b) => b.extOpp - a.extOpp || b.extConv - a.extConv)

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Opportunity</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Renewal &amp; extension conversion by coach</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          Plan start month
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-800 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </label>
      </div>

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

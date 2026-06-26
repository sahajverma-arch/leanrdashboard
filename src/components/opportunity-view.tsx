'use client'

import { useMemo, useState } from 'react'
import {
  coachOpportunities,
  opportunityTotals,
  teamOpportunities,
  type OppRow,
  type CoachOppStat,
  type TeamOppStat,
} from '@/lib/dashboard'
import type { TeamMember } from '@/lib/data'
import { Kpi, Panel } from '@/components/ui'

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function pct(conv: number, opp: number): string {
  return opp > 0 ? `${((conv / opp) * 100).toFixed(1)}%` : '—'
}

const norm = (s: string | null | undefined) =>
  String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()

function CoachTable({ rows }: { rows: CoachOppStat[] }) {
  if (rows.length === 0) return <p className="text-sm text-zinc-400">No opportunities in this month.</p>
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
          {rows.map((c) => (
            <tr key={c.coach} className="border-b border-zinc-100">
              <td className="py-2 pr-4 font-medium text-zinc-900">{c.name}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{c.renewalOpp}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{c.renewalConv}</td>
              <td className="py-2 text-right tabular-nums">{pct(c.renewalConv, c.renewalOpp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TeamTable({ rows }: { rows: TeamOppStat[] }) {
  if (rows.length === 0) return <p className="text-sm text-zinc-400">No opportunities in this month.</p>
  return (
    <div className="max-h-[520px] overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-500">
            <th className="py-2 pr-4 font-medium">Team</th>
            <th className="py-2 pr-4 text-right font-medium">Opportunities</th>
            <th className="py-2 pr-4 text-right font-medium">Converted</th>
            <th className="py-2 text-right font-medium">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.team} className="border-b border-zinc-100">
              <td className="py-2 pr-4 font-medium text-zinc-900">{t.team}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{t.renewalOpp}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{t.renewalConv}</td>
              <td className="py-2 text-right tabular-nums">{pct(t.renewalConv, t.renewalOpp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const isOpp = (r: OppRow) => String(r.renewal_opp ?? '').toLowerCase().includes('yes')

export default function OpportunityView({ rows, team }: { rows: OppRow[]; team: TeamMember[] }) {
  // coach -> team lookup (normalized), built once.
  const teamOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of team) if (t.coach && t.team) m.set(norm(t.coach), t.team)
    return (coach: string) => m.get(norm(coach)) ?? null
  }, [team])

  // Month options = plan-start months that actually have a renewal opportunity.
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
  const totals = opportunityTotals(filtered)

  const byTeam = teamOpportunities(filtered, teamOf).sort(
    (a, b) => b.renewalOpp - a.renewalOpp || b.renewalConv - a.renewalConv,
  )
  const byCoach = coachOpportunities(filtered)
    .filter((s) => s.renewalOpp > 0)
    .sort((a, b) => b.renewalOpp - a.renewalOpp || b.renewalConv - a.renewalConv)

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Opportunity</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Renewal opportunity by team &amp; coach</p>
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
        <Kpi label="Renewal opportunities" value={String(totals.renewalOpp)} />
        <Kpi label="Converted" value={String(totals.renewalConv)} />
        <Kpi label="Conversion" value={pct(totals.renewalConv, totals.renewalOpp)} />
        <Kpi label="Teams" value={String(byTeam.length)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Renewal opportunity · by team">
          <TeamTable rows={byTeam} />
        </Panel>
        <Panel title="Renewal opportunity · by coach">
          <CoachTable rows={byCoach} />
        </Panel>
      </div>

      <p className="mt-3 text-xs text-zinc-400">
        The team view excludes coaches not listed in the Team Structure; an opportunity spanning two
        teams counts for each. Per-coach rows can sum above the {totals.renewalOpp} unique
        opportunities because each is credited to both the dietitian and the exercise coach.
      </p>
    </>
  )
}

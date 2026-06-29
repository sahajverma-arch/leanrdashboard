'use client'

import { useMemo, useState } from 'react'
import {
  coachOppByTeam,
  filterOppByCategory,
  oppCategories,
  oppGrandTotals,
  type CoachOppDetail,
  type OppRow,
  type TeamOppGroup,
  type TargetRow,
} from '@/lib/dashboard'
import type { TeamMember } from '@/lib/data'
import { Kpi } from '@/components/ui'
import { catLabel, catTagClass } from '@/lib/category'

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

const isOpp = (r: OppRow) => String(r.renewal_opp ?? '').toLowerCase().includes('yes')

// Right-aligned numeric cell (tabular-nums); em dash for zero.
function Num({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <td
      className={`py-2 pr-4 text-right tabular-nums ${
        strong ? 'font-semibold text-zinc-900 dark:text-zinc-100' : ''
      }`}
    >
      {value > 0 ? value : <span className="text-zinc-400 dark:text-zinc-600">—</span>}
    </td>
  )
}

function CategoryTag({ category }: { category: string }) {
  if (!category) return null
  return (
    <span
      className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${catTagClass(category)}`}
    >
      {catLabel(category)}
    </span>
  )
}

export default function OpportunityView({
  rows,
  team,
  targets,
}: {
  rows: OppRow[]
  team: TeamMember[]
  targets: TargetRow[]
}) {
  // coach -> team (Team Structure) and coach -> category (Coach Wise Target).
  const teamOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of team) if (t.coach && t.team) m.set(norm(t.coach), t.team)
    return (coach: string) => m.get(norm(coach)) ?? null
  }, [team])

  const categoryOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of targets) if (t.coach && t.category) m.set(norm(t.coach), t.category)
    return (coach: string) => m.get(norm(coach)) ?? null
  }, [targets])

  // Month options = plan-start months that actually have a renewal opportunity.
  const months = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      if (!isOpp(r)) continue
      const ym = String(r.start_date ?? '').slice(0, 7)
      if (/^\d{4}-\d{2}$/.test(ym)) set.add(ym)
    }
    return [...set].sort().reverse()
  }, [rows])

  const [month, setMonth] = useState<string>('all')
  const [cat, setCat] = useState<string>('all')

  const filtered = useMemo(
    () =>
      month === 'all'
        ? rows
        : rows.filter((r) => String(r.start_date ?? '').slice(0, 7) === month),
    [rows, month],
  )

  // Full team groups (all categories) for the selected month.
  const groups = useMemo(
    () => coachOppByTeam(filtered, teamOf, categoryOf),
    [filtered, teamOf, categoryOf],
  )
  const categories = useMemo(() => oppCategories(groups), [groups])

  // Coach counts per category (+ overall) for the filter pills.
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    let total = 0
    for (const g of groups)
      for (const mem of g.members) {
        total++
        m.set(mem.category, (m.get(mem.category) ?? 0) + 1)
      }
    return { total, byCat: m }
  }, [groups])

  const shown = useMemo(() => filterOppByCategory(groups, cat), [groups, cat])
  const totals = useMemo(() => oppGrandTotals(shown), [shown])

  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (t: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  const pills = [{ value: 'all', label: 'All', n: counts.total }].concat(
    categories.map((c) => ({ value: c, label: catLabel(c), n: counts.byCat.get(c) ?? 0 })),
  )

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Renewal opportunity</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            By team &amp; category — click a team to see its coaches
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          Plan start month
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400"
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

      {/* Category filter — recomputes the table & KPIs for the selected category. */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Category
        </span>
        {pills.map((p) => {
          const active = cat === p.value
          return (
            <button
              key={p.value}
              onClick={() => setCat(p.value)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {p.label}{' '}
              <span className={active ? 'text-blue-100' : 'text-zinc-400 dark:text-zinc-500'}>
                {p.n}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Renewal opportunities" value={String(totals.opp)} />
        <Kpi label="Converted" value={String(totals.conv)} />
        <Kpi label="Conversion" value={pct(totals.conv, totals.opp)} />
        <Kpi label="Teams" value={String(shown.length)} />
      </div>

      <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="py-2 pr-4 font-medium">Team</th>
                <th className="py-2 pr-4 text-right font-medium">Opportunities</th>
                <th className="py-2 pr-4 text-right font-medium">Converted</th>
                <th className="py-2 text-right font-medium">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500"
                  >
                    No renewal opportunities for this selection.
                  </td>
                </tr>
              ) : (
                shown.map((g) => (
                  <FragmentRow
                    key={g.team}
                    group={g}
                    isOpen={open.has(g.team)}
                    onToggle={() => toggle(g.team)}
                  />
                ))
              )}
            </tbody>
            {shown.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
                  <td className="py-2 pr-4 font-semibold text-zinc-900 dark:text-zinc-100">
                    All teams
                  </td>
                  <Num value={totals.opp} strong />
                  <Num value={totals.conv} strong />
                  <td className="py-2 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {pct(totals.conv, totals.opp)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
        Team &amp; category come from the Team Structure and Coach Wise Target tabs; coaches not
        listed there fall under <span className="font-medium">Unassigned / Uncategorized</span>. Each
        opportunity is credited to both its dietitian and exercise coach, so team and coach rows can
        sum above the count of unique opportunities.
      </p>
    </>
  )
}

// A team summary row plus its (conditionally rendered) per-coach rows.
function FragmentRow({
  group,
  isOpen,
  onToggle,
}: {
  group: TeamOppGroup
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        aria-expanded={isOpen}
        className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
      >
        <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
          <span className="inline-flex items-center gap-2">
            <span
              className={`text-xs text-zinc-400 transition-transform dark:text-zinc-500 ${
                isOpen ? 'rotate-90' : ''
              }`}
              aria-hidden="true"
            >
              ▶
            </span>
            {group.team}
            <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
              ({group.members.length})
            </span>
          </span>
        </td>
        <Num value={group.opp} strong />
        <Num value={group.conv} strong />
        <td className="py-2 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {pct(group.conv, group.opp)}
        </td>
      </tr>

      {isOpen &&
        group.members.map((m: CoachOppDetail) => (
          <tr
            key={m.coach}
            className="border-b border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/20"
          >
            <td className="py-1.5 pr-4 pl-7 text-zinc-700 dark:text-zinc-300">
              {m.name}
              <CategoryTag category={m.category} />
            </td>
            <Num value={m.opp} />
            <Num value={m.conv} />
            <td className="py-1.5 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
              {pct(m.conv, m.opp)}
            </td>
          </tr>
        ))}
    </>
  )
}

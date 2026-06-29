'use client'

import { useMemo, useState } from 'react'
import {
  filterTeamsByCategory,
  formatINR,
  targetCategories,
  targetGrandTotals,
  type CoachTarget,
  type TeamTarget,
} from '@/lib/dashboard'
import { Kpi } from '@/components/ui'
import { catLabel, catTagClass } from '@/lib/category'

// Numeric target cell — right-aligned, ₹-formatted (em dash for zero).
function Amount({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <td
      className={`py-2 pr-4 text-right tabular-nums ${
        strong ? 'font-semibold text-zinc-900 dark:text-zinc-100' : ''
      }`}
    >
      {value > 0 ? formatINR(value) : <span className="text-zinc-400 dark:text-zinc-600">—</span>}
    </td>
  )
}

export default function TargetsView({ teams }: { teams: TeamTarget[] }) {
  const [cat, setCat] = useState<string>('all')
  const [open, setOpen] = useState<Set<string>>(new Set())

  const categories = useMemo(() => targetCategories(teams), [teams])

  // Coach counts per category (+ overall), shown on the filter pills.
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    let total = 0
    for (const t of teams)
      for (const mem of t.members) {
        total++
        m.set(mem.category, (m.get(mem.category) ?? 0) + 1)
      }
    return { total, byCat: m }
  }, [teams])

  const shown = useMemo(() => filterTeamsByCategory(teams, cat), [teams, cat])
  const totals = useMemo(() => targetGrandTotals(shown), [shown])

  const toggle = (team: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(team)) next.delete(team)
      else next.add(team)
      return next
    })

  const pills = [{ value: 'all', label: 'All', n: counts.total }].concat(
    categories.map((c) => ({ value: c, label: catLabel(c), n: counts.byCat.get(c) ?? 0 })),
  )

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Sales Target</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Targets by team — click a team to see its coaches
        </p>
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Renewal" value={formatINR(totals.renewal)} />
        <Kpi label="Extension" value={formatINR(totals.extension)} />
        <Kpi label="Referral" value={formatINR(totals.referral)} />
        <Kpi label="Reactivation" value={formatINR(totals.reactivation)} />
        <Kpi label="Total target" value={formatINR(totals.total)} />
      </div>

      <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="py-2 pr-4 font-medium">Team</th>
                <th className="py-2 pr-4 text-right font-medium">Renewal</th>
                <th className="py-2 pr-4 text-right font-medium">Extension</th>
                <th className="py-2 pr-4 text-right font-medium">Referral</th>
                <th className="py-2 pr-4 text-right font-medium">Reactivation</th>
                <th className="py-2 text-right font-medium">Total target</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500"
                  >
                    No targets for this category.
                  </td>
                </tr>
              ) : (
                shown.map((t) => (
                  <FragmentRow
                    key={t.team}
                    team={t}
                    isOpen={open.has(t.team)}
                    onToggle={() => toggle(t.team)}
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
                  <Amount value={totals.renewal} strong />
                  <Amount value={totals.extension} strong />
                  <Amount value={totals.referral} strong />
                  <Amount value={totals.reactivation} strong />
                  <Amount value={totals.total} strong />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </>
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

// A team summary row plus its (conditionally rendered) per-coach rows.
function FragmentRow({
  team,
  isOpen,
  onToggle,
}: {
  team: TeamTarget
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
            {team.team}
            <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
              ({team.members.length})
            </span>
          </span>
        </td>
        <Amount value={team.renewal} strong />
        <Amount value={team.extension} strong />
        <Amount value={team.referral} strong />
        <Amount value={team.reactivation} strong />
        <Amount value={team.total} strong />
      </tr>

      {isOpen &&
        team.members.map((m: CoachTarget) => (
          <tr
            key={m.coach}
            className="border-b border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/20"
          >
            <td className="py-1.5 pr-4 pl-7 text-zinc-700 dark:text-zinc-300">
              {m.name}
              <CategoryTag category={m.category} />
            </td>
            <Amount value={m.renewal} />
            <Amount value={m.extension} />
            <Amount value={m.referral} />
            <Amount value={m.reactivation} />
            <Amount value={m.total} />
          </tr>
        ))}
    </>
  )
}

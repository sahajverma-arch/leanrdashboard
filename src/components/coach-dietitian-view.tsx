'use client'

import { useMemo, useState } from 'react'
import type { CoachViewData } from '@/lib/data'
import type { CoachStatusRow } from '@/lib/coach-bandwidth'
import { Kpi } from '@/components/ui'

type TabKey = 'dietitians' | 'core' | 'pt'

const TABS: { key: TabKey; label: string; noun: string }[] = [
  { key: 'dietitians', label: 'Dietitians', noun: 'Dietitians' },
  { key: 'core', label: 'Core Coaches', noun: 'Core coaches' },
  { key: 'pt', label: 'PT Coaches', noun: 'PT coaches' },
]

function totals(rows: CoachStatusRow[]) {
  return rows.reduce(
    (a, r) => ({ active: a.active + r.active, pause: a.pause + r.pause, cnr: a.cnr + r.cnr }),
    { active: 0, pause: 0, cnr: 0 },
  )
}

// Busiest coaches first (by active client count).
const byActive = (rows: CoachStatusRow[]) => [...rows].sort((a, b) => b.active - a.active)

// Right-aligned numeric cell; em dash for zero (matches the other tables).
function Num({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <td
      className={`py-2 pr-4 text-right tabular-nums ${
        strong ? 'font-semibold text-zinc-900 dark:text-zinc-100' : ''
      }`}
    >
      {value > 0 ? value.toLocaleString('en-IN') : <span className="text-zinc-400 dark:text-zinc-600">—</span>}
    </td>
  )
}

function CoachTable({ rows, isPt }: { rows: CoachStatusRow[]; isPt: boolean }) {
  const t = totals(rows)
  return (
    <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <th className="py-2 pr-4 font-medium">Coach</th>
              {isPt && <th className="py-2 pr-4 font-medium">Shift</th>}
              {isPt && <th className="py-2 pr-4 font-medium">Type</th>}
              <th className="py-2 pr-4 text-right font-medium">Active</th>
              <th className="py-2 pr-4 text-right font-medium">Pause</th>
              <th className="py-2 pr-4 text-right font-medium">CNR</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={isPt ? 7 : 5}
                  className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500"
                >
                  No coaches found for this tab.
                </td>
              </tr>
            ) : (
              byActive(rows).map((c) => (
                <tr key={c.name} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{c.name}</td>
                  {isPt && (
                    <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{c.shift || '—'}</td>
                  )}
                  {isPt && (
                    <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{c.status || '—'}</td>
                  )}
                  <Num value={c.active} />
                  <Num value={c.pause} />
                  <Num value={c.cnr} />
                  <td className="py-2 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {(c.active + c.pause + c.cnr).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
                <td className="py-2 pr-4 font-semibold text-zinc-900 dark:text-zinc-100">
                  All ({rows.length})
                </td>
                {isPt && <td />}
                {isPt && <td />}
                <Num value={t.active} strong />
                <Num value={t.pause} strong />
                <Num value={t.cnr} strong />
                <td className="py-2 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {(t.active + t.pause + t.cnr).toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  )
}

export default function CoachDietitianView({ data }: { data: CoachViewData }) {
  const [tab, setTab] = useState<TabKey>('dietitians')
  const [ptType, setPtType] = useState<string>('all') // Part Time / Full Time filter (PT tab only)

  const rowsFor: Record<TabKey, CoachStatusRow[]> = {
    dietitians: data.dietitians,
    core: data.core,
    pt: data.pt,
  }
  const active = TABS.find((t) => t.key === tab)!

  // Distinct PT employment types (+ counts) for the filter pills.
  const ptTypes = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of data.pt) m.set(r.status || 'Unknown', (m.get(r.status || 'Unknown') ?? 0) + 1)
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [data.pt])

  // On the PT tab, narrow to the selected employment type; the KPIs and table
  // both derive from `rows`, so they follow the filter automatically.
  const rows = useMemo(() => {
    const base = tab === 'dietitians' ? data.dietitians : tab === 'core' ? data.core : data.pt
    return tab === 'pt' && ptType !== 'all'
      ? base.filter((r) => (r.status || 'Unknown') === ptType)
      : base
  }, [tab, ptType, data])
  const t = useMemo(() => totals(rows), [rows])

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Coach &amp; Dietitian view</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Client load by coach — Active / Pause / CNR
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        {TABS.map((tb) => {
          const on = tab === tb.key
          return (
            <button
              key={tb.key}
              onClick={() => {
                setTab(tb.key)
                setPtType('all')
              }}
              aria-pressed={on}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                on
                  ? 'bg-blue-600 text-white'
                  : 'border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {tb.label}{' '}
              <span className={on ? 'text-blue-100' : 'text-zinc-400 dark:text-zinc-500'}>
                {rowsFor[tb.key].length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Employment-type filter — PT Coaches tab only */}
      {tab === 'pt' && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Type
          </span>
          {[{ value: 'all', label: 'All', n: data.pt.length }]
            .concat(ptTypes.map(([s, n]) => ({ value: s, label: s, n })))
            .map((p) => {
              const on = ptType === p.value
              return (
                <button
                  key={p.value}
                  onClick={() => setPtType(p.value)}
                  aria-pressed={on}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    on
                      ? 'bg-blue-600 text-white'
                      : 'border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {p.label}{' '}
                  <span className={on ? 'text-blue-100' : 'text-zinc-400 dark:text-zinc-500'}>
                    {p.n}
                  </span>
                </button>
              )
            })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={active.noun} value={String(rows.length)} />
        <Kpi label="Active clients" value={t.active.toLocaleString('en-IN')} />
        <Kpi label="Paused" value={t.pause.toLocaleString('en-IN')} />
        <Kpi label="CNR" value={t.cnr.toLocaleString('en-IN')} />
      </div>

      <CoachTable rows={rows} isPt={tab === 'pt'} />

      <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
        Source tabs: <span className="font-medium">LeanR Dietitian</span>,{' '}
        <span className="font-medium">Core_Coaches_Followups</span>, and{' '}
        <span className="font-medium">LeanR PT Coaches</span>. Total = Active + Pause + CNR.
      </p>
    </>
  )
}

'use client'

import { useState } from 'react'
import { formatINR, type Sale } from '@/lib/dashboard'
import type { LeanrMonth } from '@/lib/data'

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-zinc-900">{value.toLocaleString('en-IN')}</div>
    </div>
  )
}

function SectionCard({
  title,
  month,
  revenue,
  renew,
  reactive,
  reference,
}: {
  title: string
  month: string
  revenue: number
  renew: number
  reactive: number
  reference: number
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title} · {monthLabel(month)}
      </div>
      <div className="mt-1 text-4xl font-bold text-zinc-900">{formatINR(revenue)}</div>
      <div className="mt-0.5 text-xs text-zinc-500">total sales value</div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-4">
        <Stat label="Renew" value={renew} />
        <Stat label="Reactive" value={reactive} />
        <Stat label="Ref" value={reference} />
      </div>
    </section>
  )
}

export default function SalesView({
  sales,
  leanrTeam,
  initialMonth,
}: {
  sales: Sale[]
  leanrTeam: LeanrMonth[]
  initialMonth: string
}) {
  // Month options = union of sale months + LEANR months, most recent first.
  const monthSet = new Set<string>()
  for (const s of sales) {
    const ym = (s.sale_date ?? '').slice(0, 7)
    if (ym) monthSet.add(ym)
  }
  for (const l of leanrTeam) if (l.month) monthSet.add(l.month)
  const months = [...monthSet].sort().reverse()

  const [month, setMonth] = useState(
    months.includes(initialMonth) ? initialMonth : (months[0] ?? initialMonth),
  )

  // Overall Sales — counted from the transaction rows for the selected month.
  const inMonth = sales.filter((s) => (s.sale_date ?? '').slice(0, 7) === month)
  const overall = {
    revenue: inMonth.reduce((sum, s) => sum + (Number(s.amount) || 0), 0),
    renew: inMonth.filter((s) => s.sale_type === 'renew').length,
    reactive: inMonth.filter((s) => s.sale_type === 'reactivate').length,
    ref: inMonth.filter((s) => s.sale_type === 'reference').length,
  }

  // Sales by LEANR Team — pre-aggregated row for the selected month.
  const lt = leanrTeam.find((l) => l.month === month)

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Sales</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Overall vs LEANR team</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          Month
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-800 focus:border-blue-500 focus:outline-none"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Overall Sales"
          month={month}
          revenue={overall.revenue}
          renew={overall.renew}
          reactive={overall.reactive}
          reference={overall.ref}
        />
        <SectionCard
          title="Sales by LEANR Team"
          month={month}
          revenue={lt?.sale ?? 0}
          renew={lt?.renew ?? 0}
          reactive={lt?.reactivation ?? 0}
          reference={lt?.reference ?? 0}
        />
      </div>
    </>
  )
}

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

// CSAT filter bar — just a month dropdown. Selecting a month sets `?month=YYYY-MM`,
// which the page turns into a date range for the csat_stats query.
export default function CsatMonthFilter({ months }: { months: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const current = sp.get('month') ?? ''

  function update(value: string) {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set('month', value)
    else params.delete('month')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Filters
      </span>
      <label className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        Month
        <select
          value={current}
          onChange={(e) => update(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400"
        >
          <option value="">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

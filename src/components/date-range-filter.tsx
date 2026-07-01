'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const inputCls =
  'rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400'

// From/To date-range filter. Sets ?start / ?end; empty = the page's default
// range (current month on Overview).
export default function DateRangeFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const active = !!(sp.get('start') || sp.get('end'))

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Date range
      </span>
      <label className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        From
        <input
          type="date"
          className={inputCls}
          value={sp.get('start') ?? ''}
          onChange={(e) => update('start', e.target.value)}
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        To
        <input
          type="date"
          className={inputCls}
          value={sp.get('end') ?? ''}
          onChange={(e) => update('end', e.target.value)}
        />
      </label>
      {active && (
        <button
          onClick={() => router.push(pathname)}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
        >
          Clear
        </button>
      )}
    </div>
  )
}

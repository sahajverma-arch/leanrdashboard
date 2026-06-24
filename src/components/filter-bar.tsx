'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { FilterOptions } from '@/lib/filters'

const inputCls =
  'rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-800 focus:border-blue-500 focus:outline-none'

export default function FilterBar({ options }: { options: FilterOptions }) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  const active = ['start', 'end', 'coach', 'plan', 'status'].some((k) => sp.get(k))

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Filters</span>

      <label className="flex items-center gap-1 text-xs text-zinc-500">
        From
        <input
          type="date"
          className={inputCls}
          value={sp.get('start') ?? ''}
          onChange={(e) => update('start', e.target.value)}
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-zinc-500">
        To
        <input
          type="date"
          className={inputCls}
          value={sp.get('end') ?? ''}
          onChange={(e) => update('end', e.target.value)}
        />
      </label>

      <select className={inputCls} value={sp.get('coach') ?? ''} onChange={(e) => update('coach', e.target.value)}>
        <option value="">All coaches</option>
        {options.coaches.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select className={inputCls} value={sp.get('plan') ?? ''} onChange={(e) => update('plan', e.target.value)}>
        <option value="">All plans</option>
        {options.plans.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select className={inputCls} value={sp.get('status') ?? ''} onChange={(e) => update('status', e.target.value)}>
        <option value="">All statuses</option>
        {options.statuses.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>

      {active && (
        <button
          onClick={() => router.push(pathname)}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          Clear
        </button>
      )}
    </div>
  )
}

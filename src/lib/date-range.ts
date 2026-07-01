// Shared resolver for the Overview/Sales date-range filter. `?start`/`?end`
// (YYYY-MM-DD) override the default, which is the current calendar month.
// Returns the effective range plus display labels used in page headers.

const pad = (n: number) => String(n).padStart(2, '0')

function fmtDay(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return ymd
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export type ResolvedRange = {
  start?: string
  end?: string
  hasRange: boolean
  rangeLabel: string
  monthLabel: string
}

export function resolveDateRange(
  sp: Record<string, string | string[] | undefined>,
  now: Date = new Date(),
): ResolvedRange {
  const startParam = typeof sp.start === 'string' && sp.start ? sp.start : undefined
  const endParam = typeof sp.end === 'string' && sp.end ? sp.end : undefined

  const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const monthEnd = `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const hasRange = !!(startParam || endParam)
  const start = hasRange ? startParam : monthStart
  const end = hasRange ? endParam : monthEnd

  const rangeLabel = !hasRange
    ? monthLabel
    : start && end
      ? `${fmtDay(start)} – ${fmtDay(end)}`
      : start
        ? `from ${fmtDay(start)}`
        : `until ${fmtDay(end!)}`

  return { start, end, hasRange, rangeLabel, monthLabel }
}

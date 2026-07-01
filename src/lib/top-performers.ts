// Parser + aggregator for the "top_performer_sales" sheet tab — a flat,
// date-stamped per-coach sales list that powers the Overview "Top performers"
// widget. Unlike Leaner_Team_Sales (a single current-month snapshot), this tab
// carries a Date column, so the Overview date-range filter can scope it.
//
// Layout (row 0 = header):
//   A Date ('M/D/YYYY') | B Team | C Name of the coach/dietitian | D Sales Amount
// Rows are monthly snapshots (each date is the 1st of a month).

import type { CellValue } from '@/lib/google/sheets'
import { coachDisplayName, type TopCoach } from './dashboard'

export type TopPerformerRow = {
  date: string // 'YYYY-MM-DD' (normalized for string comparison against filters)
  team: string
  coach: string // full 'Name ECODE'
  amount: number
}

const num = (v: CellValue): number => {
  const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// Normalize a sheet date cell to 'YYYY-MM-DD'. Sheets returns dates as formatted
// strings; this tab uses US 'M/D/YYYY'. Also tolerates an already-ISO value.
function toISO(raw: CellValue): string | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (m) {
    return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  }
  return null
}

export function parseTopPerformerSheet(values: CellValue[][]): TopPerformerRow[] {
  const out: TopPerformerRow[] = []
  for (let i = 1; i < values.length; i++) {
    const row = values[i] ?? []
    const date = toISO(row[0])
    const coach = String(row[2] ?? '').trim()
    if (!date || !coach) continue // skip blank / undated rows
    out.push({ date, team: String(row[1] ?? '').trim(), coach, amount: num(row[3]) })
  }
  return out
}

// Top N coaches by total sales within the [start, end] date range. Each coach's
// per-month amounts are summed; the team is taken from that coach's latest row.
// The team is returned in TopCoach.type so the Overview list shows it as the
// per-row sub-line (falling through TYPE_LABEL, which passes unknown keys as-is).
export function topPerformers(
  rows: TopPerformerRow[],
  f: { start?: string; end?: string } = {},
  n = 3,
): TopCoach[] {
  const byCoach = new Map<string, { team: string; amount: number; date: string }>()
  for (const r of rows) {
    if (f.start && r.date < f.start) continue
    if (f.end && r.date > f.end) continue
    const prev = byCoach.get(r.coach)
    if (prev) {
      prev.amount += r.amount
      if (r.date >= prev.date) { prev.team = r.team; prev.date = r.date }
    } else {
      byCoach.set(r.coach, { team: r.team, amount: r.amount, date: r.date })
    }
  }
  return [...byCoach.entries()]
    .filter(([, v]) => v.amount > 0)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, n)
    .map(([coach, v]) => ({ name: coachDisplayName(coach), type: v.team, amount: v.amount }))
}

// Top N teams by total sales within the [start, end] date range — every coach's
// amount rolled up to their Team. Returned as TopCoach so the Overview can reuse
// the ranked-list component (team name in `name`, no per-row type sub-line).
export function topTeams(
  rows: TopPerformerRow[],
  f: { start?: string; end?: string } = {},
  n = 3,
): TopCoach[] {
  const byTeam = new Map<string, number>()
  for (const r of rows) {
    if (f.start && r.date < f.start) continue
    if (f.end && r.date > f.end) continue
    if (!r.team) continue
    byTeam.set(r.team, (byTeam.get(r.team) ?? 0) + r.amount)
  }
  return [...byTeam.entries()]
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([team, amount]) => ({ name: team, type: '', amount }))
}

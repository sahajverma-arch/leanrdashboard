import { createAdminClient } from '@/lib/supabase/admin'
import { readRange, type CellValue } from '@/lib/google/sheets'
import { SOURCES, SPREADSHEET_ID, type SheetSource } from './sources'

export type SourceResult = { table: string; rows: number; error?: string }
export type SyncResult = { ok: boolean; results: SourceResult[]; syncedAt: string }

// Turn a header label into a safe snake_case column name.
function sanitizeKey(header: string): string {
  return (
    String(header)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'col'
  )
}

// Convert a 2-D cell array (row 0 = headers) into row objects.
function rowsToObjects(values: CellValue[][]): Record<string, CellValue>[] {
  if (values.length < 2) return []
  const headers = values[0].map((h) => sanitizeKey(String(h ?? '')))
  return values
    .slice(1)
    .filter((row) => row.some((cell) => cell !== '' && cell != null))
    .map((row) => {
      const obj: Record<string, CellValue> = {}
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? null
      })
      return obj
    })
}

// A1 reference for a tab + column range, quoting the tab name for spaces.
function a1(tab: string, range: string): string {
  return `'${tab.replace(/'/g, "''")}'!${range}`
}

const CHUNK = 1000 // fewer round-trips so the serverless sync finishes in time
type Admin = ReturnType<typeof createAdminClient>

async function syncOne(supabase: Admin, src: SheetSource): Promise<SourceResult> {
  const values = await readRange(SPREADSHEET_ID, a1(src.tab, src.range))
  const rows = rowsToObjects(values)

  if (src.mode === 'replace') {
    // Full mirror: clear the table, then insert everything fresh.
    const { error: delErr } = await supabase.from(src.table).delete().gte('id', 0)
    if (delErr) throw new Error(delErr.message)

    let written = 0
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK)
      const { error } = await supabase.from(src.table).insert(chunk)
      if (error) throw new Error(error.message)
      written += chunk.length
    }
    return { table: src.table, rows: written }
  }

  // Upsert mode (needs a unique conflictKey).
  if (!src.conflictKey) {
    throw new Error(`Source '${src.table}' uses upsert but has no conflictKey`)
  }
  let written = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error } = await supabase
      .from(src.table)
      .upsert(chunk, { onConflict: src.conflictKey })
    if (error) throw new Error(error.message)
    written += chunk.length
  }
  return { table: src.table, rows: written }
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
}
const MONTH_RE = /^([A-Za-z]+)\s*-\s*(\d{4})$/

type LeanrRow = {
  month: string
  extention: number
  renew: number
  reactivation: number
  reference: number
  total: number
  sale: number
}

// Unpivot the Sales_LeanrTeam sheet: month labels in a row, sub-headers one row
// below, values two rows below — in month-blocks across columns, stacked down.
function parseLeanrPivot(values: CellValue[][]): LeanrRow[] {
  const out: LeanrRow[] = []
  const num = (x: CellValue) => {
    const n = Number(x)
    return Number.isFinite(n) ? Math.round(n) : 0
  }
  for (let i = 0; i < values.length; i++) {
    const row = values[i] ?? []
    const labels: { c: number; month: string }[] = []
    row.forEach((cell, c) => {
      const m = MONTH_RE.exec(String(cell ?? '').trim())
      if (m) {
        const mm = MONTHS[m[1].toLowerCase()]
        if (mm) labels.push({ c, month: `${m[2]}-${String(mm).padStart(2, '0')}` })
      }
    })
    if (!labels.length) continue
    const vals = values[i + 2] ?? []
    const saleRow = values[i + 6] ?? [] // the "Total | Count | Sale" row; Sale at c+3
    for (const { c, month } of labels) {
      out.push({
        month,
        extention: num(vals[c]),
        renew: num(vals[c + 1]),
        reactivation: num(vals[c + 2]),
        reference: num(vals[c + 3]),
        total: num(vals[c + 4]),
        sale: num(saleRow[c + 3]),
      })
    }
  }
  return out
}

async function syncLeanrTeam(supabase: Admin): Promise<SourceResult> {
  const values = await readRange(SPREADSHEET_ID, a1('Sales_LeanrTeam', 'A1:BZ80'))
  const months = parseLeanrPivot(values)
  const { error: delErr } = await supabase.from('raw_sales_leanr_team').delete().gte('id', 0)
  if (delErr) throw new Error(delErr.message)
  if (months.length) {
    const { error } = await supabase.from('raw_sales_leanr_team').insert(months)
    if (error) throw new Error(error.message)
  }
  return { table: 'raw_sales_leanr_team', rows: months.length }
}

type CoachSaleRow = { coach_type: string; coach: string; amount: number }

// Leaner_Team_Sales is a flat list grouped by type: col A = type label,
// col B = 'Name ECODE', col C = this month's sale value. Blank rows separate
// the type blocks — skip any row missing a type or coach name.
function parseLeanerTeam(values: CellValue[][]): CoachSaleRow[] {
  const out: CoachSaleRow[] = []
  for (const row of values) {
    const coachType = String(row?.[0] ?? '').trim()
    const coach = String(row?.[1] ?? '').trim()
    if (!coachType || !coach) continue
    const amount = Number(row?.[2])
    out.push({ coach_type: coachType, coach, amount: Number.isFinite(amount) ? amount : 0 })
  }
  return out
}

async function syncLeanerTeamSales(supabase: Admin): Promise<SourceResult> {
  const values = await readRange(SPREADSHEET_ID, a1('Leaner_Team_Sales', 'A:C'))
  const rows = parseLeanerTeam(values)
  const { error: delErr } = await supabase.from('raw_leaner_team_sales').delete().gte('id', 0)
  if (delErr) throw new Error(delErr.message)
  if (rows.length) {
    const { error } = await supabase.from('raw_leaner_team_sales').insert(rows)
    if (error) throw new Error(error.message)
  }
  return { table: 'raw_leaner_team_sales', rows: rows.length }
}

// Read every configured sheet and write it into Postgres.
export async function runSync(): Promise<SyncResult> {
  const supabase = createAdminClient()
  const results: SourceResult[] = []

  for (const src of SOURCES) {
    try {
      results.push(await syncOne(supabase, src))
    } catch (e) {
      results.push({
        table: src.table,
        rows: 0,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  // Sales_LeanrTeam is a monthly pivot — parse it into raw_sales_leanr_team.
  try {
    results.push(await syncLeanrTeam(supabase))
  } catch (e) {
    results.push({
      table: 'raw_sales_leanr_team',
      rows: 0,
      error: e instanceof Error ? e.message : String(e),
    })
  }

  // Leaner_Team_Sales is a flat per-coach list — parse it into raw_leaner_team_sales.
  try {
    results.push(await syncLeanerTeamSales(supabase))
  } catch (e) {
    results.push({
      table: 'raw_leaner_team_sales',
      rows: 0,
      error: e instanceof Error ? e.message : String(e),
    })
  }

  // Refresh the materialized coach map so views reflect the new data.
  const { error: refreshErr } = await supabase.rpc('refresh_dashboard')
  if (refreshErr) {
    results.push({ table: 'refresh_dashboard', rows: 0, error: refreshErr.message })
  }

  return {
    ok: results.length > 0 && results.every((r) => !r.error),
    results,
    syncedAt: new Date().toISOString(),
  }
}

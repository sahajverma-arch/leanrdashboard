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

const CHUNK = 500
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

  return {
    ok: results.length > 0 && results.every((r) => !r.error),
    results,
    syncedAt: new Date().toISOString(),
  }
}

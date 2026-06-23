// Declarative map of Google Sheet tabs -> Postgres tables, used by the sync
// pipeline. Right now we're on MOCK data seeded via SQL, so SOURCES is empty.
// When we wire the real sheet, add one entry per tab below.

export type SyncMode = 'replace' | 'upsert'

export type SheetSource = {
  /** Postgres table to write into. */
  table: string
  /** Sheet tab name, e.g. 'Team'. */
  tab: string
  /** Column range with the header in row 1, e.g. 'A:G'. */
  range: string
  /** 'replace' = full mirror of the tab (recommended). 'upsert' needs conflictKey. */
  mode: SyncMode
  /** Required for mode 'upsert': the unique column to resolve conflicts on. */
  conflictKey?: string
}

export const SPREADSHEET_ID = process.env.SHEET_LEANR_ID ?? ''

// Example for later:
//   { table: 'coaches', tab: 'Team',   range: 'A:C', mode: 'replace' },
//   { table: 'sales',   tab: 'Sales',  range: 'A:M', mode: 'replace' },
export const SOURCES: SheetSource[] = []

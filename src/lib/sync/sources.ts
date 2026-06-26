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

// Raw tabs mirrored into raw_* tables; transform views shape them for the dashboard.
export const SOURCES: SheetSource[] = [
  { table: 'raw_clients', tab: 'Clients', range: 'A:AH', mode: 'replace' },
  { table: 'raw_csat', tab: 'CSAT', range: 'A:I', mode: 'replace' },
  { table: 'raw_overall_sales', tab: 'Overall Sales', range: 'A:AL', mode: 'replace' },
  // Coach roster, one tab per type. We only mirror column A (the coach name);
  // mv_coaches tags each with its type. 'PT coaches' has a clean header on row 1,
  // but 'Basic Coaches' and 'Dietitian' have a junk/date row, so read from A2.
  { table: 'raw_pt_coaches', tab: 'PT coaches', range: 'A1:A', mode: 'replace' },
  { table: 'raw_basic_coaches', tab: 'Basic Coaches', range: 'A2:A', mode: 'replace' },
  { table: 'raw_dietitians', tab: 'Dietitian', range: 'A2:A', mode: 'replace' },
]

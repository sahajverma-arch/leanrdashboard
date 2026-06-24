// Standalone sync: Google Sheet raw tabs -> Supabase raw_* tables (replace mode).
// Run: node --env-file=.env scripts/sync.mjs
// Uses the service-role key (bypasses RLS). Mirrors src/lib/sync/run.ts.

import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const SOURCES = [
  { table: 'raw_clients', tab: 'Clients', range: 'A:AH' },
  { table: 'raw_csat', tab: 'CSAT', range: 'A:I' },
  { table: 'raw_overall_sales', tab: 'Overall Sales', range: 'A:AL' },
]

const san = (h) =>
  String(h ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'col'

function headerKeys(row) {
  const seen = {}
  return row.map((h) => {
    let k = san(h)
    if (seen[k]) { seen[k]++; k = `${k}_${seen[k]}` } else seen[k] = 1
    return k
  })
}

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const key = process.env.GOOGLE_PRIVATE_KEY_B64
  ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf8')
  : (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
const auth = new google.auth.JWT({ email, key, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] })
const sheets = google.sheets({ version: 'v4', auth })
const ID = process.env.SHEET_LEANR_ID

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const CHUNK = 1000

for (const s of SOURCES) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: ID,
      range: `'${s.tab}'!${s.range}`,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    })
    const values = res.data.values || []
    if (values.length < 2) { console.log(`${s.table}: no rows`); continue }

    const keys = headerKeys(values[0])
    const rows = values
      .slice(1)
      .filter((r) => r.some((c) => c !== '' && c != null))
      .map((r) => {
        const o = {}
        keys.forEach((k, i) => {
          const v = r[i]
          o[k] = v === '' || v == null ? null : String(v) // raw tables are all text
        })
        return o
      })

    const del = await supabase.from(s.table).delete().gte('id', 0)
    if (del.error) throw new Error(`delete: ${del.error.message}`)

    let written = 0
    for (let i = 0; i < rows.length; i += CHUNK) {
      const ins = await supabase.from(s.table).insert(rows.slice(i, i + CHUNK))
      if (ins.error) throw new Error(`insert: ${ins.error.message}`)
      written += Math.min(CHUNK, rows.length - i)
    }
    console.log(`${s.table}: ${written} rows`)
  } catch (e) {
    console.error(`${s.table}: ERROR ${e.message}`)
  }
}
console.log('sync complete')

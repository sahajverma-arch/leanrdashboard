// Standalone sync: Google Sheet raw tabs -> Supabase raw_* tables (replace mode).
// Run: node --env-file=.env scripts/sync.mjs
// Uses the service-role key (bypasses RLS). Mirrors src/lib/sync/run.ts.

import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const SOURCES = [
  { table: 'raw_clients', tab: 'Clients', range: 'A:AH' },
  { table: 'raw_csat', tab: 'CSAT', range: 'A:I' },
  { table: 'raw_overall_sales', tab: 'Overall Sales', range: 'A:AL' },
  // Coach roster (column A = name only). 'PT coaches' header is row 1; the other
  // two have a junk/date row on top, so read from A2.
  { table: 'raw_pt_coaches', tab: 'PT coaches', range: 'A1:A' },
  { table: 'raw_basic_coaches', tab: 'Basic Coaches', range: 'A2:A' },
  { table: 'raw_dietitians', tab: 'Dietitian', range: 'A2:A' },
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

const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 }
const monthRe = /^([A-Za-z]+)\s*-\s*(\d{4})$/

// Unpivot the Sales_LeanrTeam sheet: month labels sit in a row, sub-headers
// (Extention/Renew/Reactivation/Reference/Total) one row below, values two rows
// below — repeated in month-blocks across columns and stacked vertically.
function parseLeanrPivot(values) {
  const out = []
  const num = (x) => { const n = Number(x); return Number.isFinite(n) ? Math.round(n) : 0 }
  for (let i = 0; i < values.length; i++) {
    const row = values[i] || []
    const labels = []
    row.forEach((cell, c) => {
      const m = monthRe.exec(String(cell ?? '').trim())
      if (m) {
        const mm = MONTHS[m[1].toLowerCase()]
        if (mm) labels.push({ c, month: `${m[2]}-${String(mm).padStart(2, '0')}` })
      }
    })
    if (!labels.length) continue
    const vals = values[i + 2] || [] // label row, +1 = sub-headers, +2 = values
    const saleRow = values[i + 6] || [] // the "Total | Count | Sale" row; Sale at c+3
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

// Leaner_Team_Sales: flat per-coach list grouped by type. col A = type label,
// col B = 'Name ECODE', col C = this month's sale value. Blank rows separate the
// type blocks — skip any row missing a type or coach name.
function parseLeanerTeam(values) {
  const out = []
  for (const row of values) {
    const coachType = String((row && row[0]) ?? '').trim()
    const coach = String((row && row[1]) ?? '').trim()
    if (!coachType || !coach) continue
    const amount = Number(row && row[2])
    out.push({ coach_type: coachType, coach, amount: Number.isFinite(amount) ? amount : 0 })
  }
  return out
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

// Sales_LeanrTeam is a monthly pivot — parse it specially into raw_sales_leanr_team.
try {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: ID,
    range: `'Sales_LeanrTeam'!A1:BZ80`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  const months = parseLeanrPivot(res.data.values || [])
  const del = await supabase.from('raw_sales_leanr_team').delete().gte('id', 0)
  if (del.error) throw new Error(`delete: ${del.error.message}`)
  if (months.length) {
    const ins = await supabase.from('raw_sales_leanr_team').insert(months)
    if (ins.error) throw new Error(`insert: ${ins.error.message}`)
  }
  console.log(`raw_sales_leanr_team: ${months.length} months`)
} catch (e) {
  console.error(`raw_sales_leanr_team: ERROR ${e.message}`)
}

// Leaner_Team_Sales is a flat per-coach list — parse it into raw_leaner_team_sales.
try {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: ID,
    range: `'Leaner_Team_Sales'!A:C`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  const rows = parseLeanerTeam(res.data.values || [])
  const del = await supabase.from('raw_leaner_team_sales').delete().gte('id', 0)
  if (del.error) throw new Error(`delete: ${del.error.message}`)
  if (rows.length) {
    const ins = await supabase.from('raw_leaner_team_sales').insert(rows)
    if (ins.error) throw new Error(`insert: ${ins.error.message}`)
  }
  console.log(`raw_leaner_team_sales: ${rows.length} coaches`)
} catch (e) {
  console.error(`raw_leaner_team_sales: ERROR ${e.message}`)
}

const { error: refreshErr } = await supabase.rpc('refresh_dashboard')
console.log(refreshErr ? `refresh_dashboard ERROR: ${refreshErr.message}` : 'refreshed coach map')
console.log('sync complete')

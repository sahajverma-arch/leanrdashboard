import { createClient } from '@/lib/supabase/server'
import { readRange } from '@/lib/google/sheets'
import { SPREADSHEET_ID } from './sync/sources'
import type { Coach, Client, Sale, CsatStats, CoachSale, TargetRow } from './dashboard'
import type { OverallSaleRow } from './teamwise'
import { parseOpportunitySheet, type OpportunityData } from './opportunity'
import { parseTopPerformerSheet, type TopPerformerRow } from './top-performers'
import {
  type Filters,
  type FilterOptions,
  filterClients,
  filterSales,
} from './filters'

export type DashData = {
  coaches: Coach[]
  clients: Client[]
  sales: Sale[]
  csat: CsatStats
  options: FilterOptions
}

const PAGE = 1000

// Page through Supabase's 1000-row response cap.
async function fetchAll<T>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
): Promise<{ data?: T[]; error?: string }> {
  const all: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + PAGE - 1)
    if (error) return { error: error.message }
    all.push(...((data ?? []) as T[]))
    if (!data || data.length < PAGE) break
  }
  return { data: all }
}

// Fetch the small tables (coaches/clients/sales) fully and filter them in JS,
// but aggregate the large CSAT table in SQL (csat_stats RPC) to stay fast.
export async function getDashboard(
  f: Filters,
): Promise<{ data?: DashData; error?: string }> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { error: 'Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).' }
  }

  const supabase = await createClient()

  // Run all five queries in parallel — page time ≈ the slowest one.
  const [coachesR, clientsR, salesR, csatR, optsR] = await Promise.all([
    fetchAll<Coach>(supabase, 'coaches'),
    fetchAll<Client>(supabase, 'clients'),
    fetchAll<Sale>(supabase, 'sales'),
    supabase.rpc('csat_stats', {
      p_start: f.start ?? null,
      p_end: f.end ?? null,
      p_coach_id: f.coachId ?? null,
    }),
    supabase.rpc('filter_options'),
  ])
  const err =
    coachesR.error || clientsR.error || salesR.error || csatR.error?.message
  if (err) return { error: err }

  return {
    data: {
      coaches: coachesR.data ?? [],
      clients: filterClients(clientsR.data ?? [], f),
      sales: filterSales(salesR.data ?? [], f),
      csat: csatR.data as CsatStats,
      options: (optsR.data as FilterOptions) ?? { coaches: [], plans: [], statuses: [] },
    },
  }
}

export type CsatPageData = { stats: CsatStats; months: string[] }

// CSAT page data: the stats for the selected month (or all-time when none), plus
// the full month list for the dropdown. The stats are aggregated in SQL
// (csat_stats RPC); we call it unfiltered for the month options and again
// scoped to the chosen month for display.
export async function getCsatPageData(
  month?: string,
): Promise<{ data?: CsatPageData; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { error: 'Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).' }
  }
  const supabase = await createClient()

  // Unfiltered run — drives the month dropdown, and is the display data for "all".
  const fullR = await supabase.rpc('csat_stats', { p_start: null, p_end: null, p_coach_id: null })
  if (fullR.error) return { error: fullR.error.message }
  const full = fullR.data as CsatStats

  let stats = full
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number)
    const start = `${month}-01`
    const end = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
    const monthR = await supabase.rpc('csat_stats', { p_start: start, p_end: end, p_coach_id: null })
    if (monthR.error) return { error: monthR.error.message }
    stats = monthR.data as CsatStats
  }

  const months = full.byMonth.map((d) => d.name).sort().reverse()
  return { data: { stats, months } }
}

export type LeanrMonth = {
  month: string // 'YYYY-MM'
  extention: number
  renew: number
  reactivation: number
  reference: number
  total: number
  sale: number // total revenue (₹) for the month
}

// Pre-aggregated monthly "Sales by LEANR Team" numbers (from the pivot sheet).
export async function getLeanrTeamSales(): Promise<LeanrMonth[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('raw_sales_leanr_team')
    .select('month, extention, renew, reactivation, reference, total, sale')
    .order('month')
  if (error) return []
  return (data ?? []) as LeanrMonth[]
}

export type CoachOpportunityRow = {
  dietitian: string | null
  exercise_coach: string | null
  renewal_opp: string | null
  extension_opp: string | null
  purchase_w: string | null
  purchase_x: string | null
  start_date: string | null
}

// Per-client renewal/extension opportunity rows (from raw_data_coaches_opportunity).
// ~1.4k rows, so page past the 1000-row cap.
export async function getCoachOpportunity(): Promise<CoachOpportunityRow[]> {
  const supabase = await createClient()
  const { data } = await fetchAll<CoachOpportunityRow>(supabase, 'raw_coach_opportunity')
  return data ?? []
}

export type TeamMember = { coach: string | null; team: string | null }

// Coach -> team mapping (from the Team Structure tab).
export async function getTeamStructure(): Promise<TeamMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('raw_team_structure').select('coach, team')
  if (error) return []
  return (data ?? []) as TeamMember[]
}

// Per-coach sales targets (from the "Coach Wise Target" tab), rolled up per team
// on the Sales Target page.
export async function getCoachTargets(): Promise<TargetRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('raw_coach_targets')
    .select(
      'team, category, coach, total_target, renewal_target, extension_target, referral_target, reactivation_target',
    )
  if (error) return []
  return (data ?? []) as TargetRow[]
}

type RawOverallSale = {
  actualownerdept: string | null
  ordertype: string | null
  saletypewithextension: string | null
  amount: string | null
  saledate: string | null
}

// Raw Overall Sales rows (dept / order type / sale type / amount / date) for the
// "Sales teamwise" tab. ~3.6k rows, so page past the 1000-row cap. Amount is
// parsed to a number here so the matrix helpers stay pure.
export async function getOverallSalesRows(): Promise<OverallSaleRow[]> {
  const supabase = await createClient()
  const cols = 'actualownerdept, ordertype, saletypewithextension, amount, saledate'
  const all: OverallSaleRow[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('raw_overall_sales')
      .select(cols)
      .range(from, from + PAGE - 1)
    if (error) break
    const rows = (data ?? []) as RawOverallSale[]
    for (const r of rows) {
      all.push({
        dept: r.actualownerdept,
        order_type: r.ordertype,
        sale_type: r.saletypewithextension,
        amount: Number(String(r.amount ?? '').replace(/[^0-9.\-]/g, '')) || 0,
        sale_date: r.saledate,
      })
    }
    if (rows.length < PAGE) break
  }
  return all
}

// Coach-wise + team-wise renewal/extension opportunity stats, read live from the
// pre-aggregated "opportunity" sheet tab (small, ~50 rows) via the service
// account — independent of the existing /opportunity (raw_coach_opportunity) tab.
export async function getCoachTeamOpportunity(): Promise<OpportunityData> {
  if (!SPREADSHEET_ID) return { coaches: [], teams: [] }
  try {
    const values = await readRange(SPREADSHEET_ID, "'opportunity'!A1:Q200")
    return parseOpportunitySheet(values)
  } catch {
    return { coaches: [], teams: [] }
  }
}

// Date-stamped per-coach sales (from the "top_performer_sales" tab), read live
// via the service account (small, ~300 rows). Powers the Overview "Top
// performers" widget; the page aggregates + filters these by date range.
export async function getTopPerformerSales(): Promise<TopPerformerRow[]> {
  if (!SPREADSHEET_ID) return []
  try {
    const values = await readRange(SPREADSHEET_ID, "'top_performer_sales'!A1:D")
    return parseTopPerformerSheet(values)
  } catch {
    return []
  }
}

// Per-coach current-month sales (from the Leaner_Team_Sales tab), sorted high→low.
export async function getCoachMonthSales(): Promise<CoachSale[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coach_month_sales')
    .select('coach, type, amount')
    .order('amount', { ascending: false })
  if (error) return []
  return (data ?? []) as CoachSale[]
}

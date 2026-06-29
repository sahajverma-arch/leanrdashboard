import { createClient } from '@/lib/supabase/server'
import type { Coach, Client, Sale, CsatStats, CoachSale, TargetRow } from './dashboard'
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

// Pure helpers that turn raw table rows into dashboard KPIs and chart series.

export type Coach = {
  id: number
  name: string
  role: string | null
  team: string | null
  status: string | null
  type?: string | null // 'pt' | 'dietitian' | 'basic' (from the coach sheets)
}
export type Client = {
  id: number
  name: string
  coach_id: number | null
  plan: string | null
  status: string | null
  weight_lost_kg: number | null
}
export type Sale = {
  id: number
  sale_date: string
  client_id: number | null
  coach_id: number | null
  plan_name: string | null
  amount: number
  sale_type: string | null
}
export type Csat = {
  id: number
  rating_date: string
  client_id: number | null
  coach_id: number | null
  rating: number | null
  category: string | null
}

export type NameValue = { name: string; value: number }

// CSAT aggregates computed in SQL (csat_stats RPC).
export type CsatStats = {
  count: number
  avg: number
  happy: number
  detractors: number
  byCoach: { id: number; name: string; value: number; n: number }[]
  byCategory: NameValue[]
  byMonth: NameValue[]
  distribution: NameValue[]
}

export function formatINR(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-IN', { maximumFractionDigits: 1 })
}

// Keep the top N categories by value; roll everything else into "Other".
export function topN(data: NameValue[], n = 12): NameValue[] {
  if (data.length <= n) return data
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const rest = sorted.slice(n)
  const other = rest.reduce((s, d) => s + d.value, 0)
  return [...sorted.slice(0, n), { name: `Other (${rest.length})`, value: other }]
}

// Per-coach current-month sales (from the Leaner_Team_Sales tab).
export type CoachSale = { coach: string; type: string; amount: number }
export type TopCoach = { name: string; type: string; amount: number }

// Strip the trailing employee code from a coach name for display:
// "Payal E4595" -> "Payal", "Himneesh E-056" -> "Himneesh", "Vineet C0136" -> "Vineet".
export function coachDisplayName(name: string): string {
  return String(name).replace(/\s+[A-Za-z]{0,2}-?\d+\s*$/, '').trim() || String(name).trim()
}

// Top N coaches by sale amount, optionally restricted to one type
// ('pt' | 'basic' | 'dietitian'). Drops coaches with no sales.
export function topCoaches(rows: CoachSale[], n = 3, type?: string): TopCoach[] {
  return rows
    .filter((r) => Number(r.amount) > 0 && (!type || r.type === type))
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, n)
    .map((r) => ({ name: coachDisplayName(r.coach), type: r.type, amount: Number(r.amount) }))
}

// ---------- Renewal / extension opportunities (per coach) ----------

export type OppRow = {
  dietitian: string | null
  exercise_coach: string | null
  renewal_opp: string | null
  extension_opp: string | null
  purchase_w: string | null
  purchase_x: string | null
  start_date: string | null
}

export type CoachOppStat = {
  coach: string // full 'Name ECODE' key
  name: string // display name (code stripped)
  renewalOpp: number
  renewalConv: number
  extOpp: number
  extConv: number
}

const yes = (v: string | null | undefined) => String(v ?? '').toLowerCase().includes('yes')

// An opportunity counts as "converted" when the latest purchase is a real plan —
// i.e. NOT product-only, NOT a MIS entry, and NOT blank ('--'). Mirrors the
// sheet's converted formula over columns W (purchase_w) and X (purchase_x).
function oppConverted(w: string | null, x: string | null): boolean {
  const lw = String(w ?? '').toLowerCase()
  const lx = String(x ?? '').toLowerCase()
  if (lw.includes('product') && lx.includes('product')) return false
  if (lw.includes('mis') || lx.includes('mis')) return false
  if (lw.includes('--')) return false
  return true
}

// Per-coach renewal & extension opportunity / conversion counts. A row is
// credited to BOTH its dietitian and its exercise coach (the sheet matches on
// either column), de-duplicated so a coach filling both roles is counted once.
export function coachOpportunities(rows: OppRow[]): CoachOppStat[] {
  const map = new Map<string, CoachOppStat>()
  for (const r of rows) {
    const isRenewal = yes(r.renewal_opp)
    const isExt = yes(r.extension_opp)
    if (!isRenewal && !isExt) continue
    const converted = oppConverted(r.purchase_w, r.purchase_x)
    const coaches = [
      ...new Set(
        [r.dietitian, r.exercise_coach].map((c) => String(c ?? '').trim()).filter(Boolean),
      ),
    ]
    for (const coach of coaches) {
      const e =
        map.get(coach) ??
        { coach, name: coachDisplayName(coach), renewalOpp: 0, renewalConv: 0, extOpp: 0, extConv: 0 }
      if (isRenewal) {
        e.renewalOpp++
        if (converted) e.renewalConv++
      }
      if (isExt) {
        e.extOpp++
        if (converted) e.extConv++
      }
      map.set(coach, e)
    }
  }
  return [...map.values()]
}

export type TeamOppStat = { team: string; renewalOpp: number; renewalConv: number }

// Renewal opportunities rolled up per team. A row's coaches are mapped to teams
// via `teamOf` (returns null for coaches not in the Team Structure, which are
// excluded). Teams are de-duplicated within a row, so a row whose two coaches
// share a team counts once for it, and a row spanning two teams counts for each.
export function teamOpportunities(
  rows: OppRow[],
  teamOf: (coach: string) => string | null,
): TeamOppStat[] {
  const map = new Map<string, TeamOppStat>()
  for (const r of rows) {
    if (!yes(r.renewal_opp)) continue
    const converted = oppConverted(r.purchase_w, r.purchase_x)
    const coaches = [r.dietitian, r.exercise_coach].map((c) => String(c ?? '').trim()).filter(Boolean)
    const teams = [...new Set(coaches.map(teamOf).filter((t): t is string => !!t))]
    for (const team of teams) {
      const e = map.get(team) ?? { team, renewalOpp: 0, renewalConv: 0 }
      e.renewalOpp++
      if (converted) e.renewalConv++
      map.set(team, e)
    }
  }
  return [...map.values()]
}

// Unique (un-double-counted) totals straight from the rows, for the summary KPIs.
export function opportunityTotals(rows: OppRow[]) {
  let renewalOpp = 0,
    renewalConv = 0,
    extOpp = 0,
    extConv = 0
  for (const r of rows) {
    const converted = oppConverted(r.purchase_w, r.purchase_x)
    if (yes(r.renewal_opp)) {
      renewalOpp++
      if (converted) renewalConv++
    }
    if (yes(r.extension_opp)) {
      extOpp++
      if (converted) extConv++
    }
  }
  return { renewalOpp, renewalConv, extOpp, extConv }
}

// ---------- Sales targets (per coach, rolled up per team) ----------

// One row from the "Coach Wise Target" tab (mirrored into raw_coach_targets).
export type TargetRow = {
  team: string | null
  category: string | null
  coach: string | null // 'Name ECODE'
  total_target: number | null
  renewal_target: number | null
  extension_target: number | null
  referral_target: number | null
  reactivation_target: number | null
}

export type CoachTarget = {
  coach: string // full 'Name ECODE' key
  name: string // display name (code stripped)
  category: string
  renewal: number
  extension: number
  referral: number
  reactivation: number
  total: number
}

export type TeamTarget = {
  team: string
  renewal: number
  extension: number
  referral: number
  reactivation: number
  total: number
  members: CoachTarget[]
}

const targetNum = (x: number | null | undefined) => {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}

// Group per-coach target rows by team, summing each target column and keeping the
// member list (for the expandable rows). Teams and members are sorted by total ₹.
export function teamTargets(rows: TargetRow[]): TeamTarget[] {
  const map = new Map<string, TeamTarget>()
  for (const r of rows) {
    const team = String(r.team ?? '').trim()
    const coach = String(r.coach ?? '').trim()
    if (!team || !coach) continue
    const member: CoachTarget = {
      coach,
      name: coachDisplayName(coach),
      category: String(r.category ?? '').trim(),
      renewal: targetNum(r.renewal_target),
      extension: targetNum(r.extension_target),
      referral: targetNum(r.referral_target),
      reactivation: targetNum(r.reactivation_target),
      total: targetNum(r.total_target),
    }
    const e =
      map.get(team) ??
      { team, renewal: 0, extension: 0, referral: 0, reactivation: 0, total: 0, members: [] }
    e.renewal += member.renewal
    e.extension += member.extension
    e.referral += member.referral
    e.reactivation += member.reactivation
    e.total += member.total
    e.members.push(member)
    map.set(team, e)
  }
  const teams = [...map.values()]
  for (const t of teams) t.members.sort((a, b) => b.total - a.total)
  return teams.sort((a, b) => b.total - a.total)
}

// Grand totals across all teams, for the summary KPI cards.
export function targetGrandTotals(teams: TeamTarget[]) {
  return teams.reduce(
    (acc, t) => ({
      renewal: acc.renewal + t.renewal,
      extension: acc.extension + t.extension,
      referral: acc.referral + t.referral,
      reactivation: acc.reactivation + t.reactivation,
      total: acc.total + t.total,
    }),
    { renewal: 0, extension: 0, referral: 0, reactivation: 0, total: 0 },
  )
}

// Distinct coach categories present in the target data (e.g. 'Dietitian'), sorted.
export function targetCategories(teams: TeamTarget[]): string[] {
  const set = new Set<string>()
  for (const t of teams) for (const m of t.members) if (m.category) set.add(m.category)
  return [...set].sort()
}

// Re-aggregate teams keeping only members of `category` (recomputing each team's
// sums from the surviving members and dropping teams left empty). 'all'/'' = no-op.
// Teams stay sorted by (filtered) total ₹.
export function filterTeamsByCategory(teams: TeamTarget[], category: string): TeamTarget[] {
  if (!category || category === 'all') return teams
  const out: TeamTarget[] = []
  for (const t of teams) {
    const members = t.members.filter((m) => m.category === category)
    if (members.length === 0) continue
    const sum = members.reduce(
      (a, m) => ({
        renewal: a.renewal + m.renewal,
        extension: a.extension + m.extension,
        referral: a.referral + m.referral,
        reactivation: a.reactivation + m.reactivation,
        total: a.total + m.total,
      }),
      { renewal: 0, extension: 0, referral: 0, reactivation: 0, total: 0 },
    )
    out.push({ team: t.team, ...sum, members })
  }
  return out.sort((a, b) => b.total - a.total)
}

// ---------- Renewal opportunity, grouped by team & category ----------
// Reuses the per-coach renewal stats (each opportunity is credited to BOTH its
// dietitian and exercise coach) and attaches each coach's team (from Team
// Structure) and category (from Coach Wise Target). Coaches missing from those
// tabs fall into 'Unassigned' / 'Uncategorized' so nothing is silently dropped.

export const UNASSIGNED_TEAM = 'Unassigned'
export const UNCATEGORIZED = 'Uncategorized'

export type CoachOppDetail = {
  coach: string // full 'Name ECODE' key
  name: string // display name (code stripped)
  team: string
  category: string
  opp: number // renewal opportunities
  conv: number // converted
}

export type TeamOppGroup = {
  team: string
  opp: number
  conv: number
  members: CoachOppDetail[]
}

// 'Unassigned' always sorts last; everything else by opportunities desc.
function sortTeamGroups(groups: TeamOppGroup[]): TeamOppGroup[] {
  return groups.sort((a, b) => {
    if (a.team === UNASSIGNED_TEAM) return 1
    if (b.team === UNASSIGNED_TEAM) return -1
    return b.opp - a.opp
  })
}

export function coachOppByTeam(
  rows: OppRow[],
  teamOf: (coach: string) => string | null,
  categoryOf: (coach: string) => string | null,
): TeamOppGroup[] {
  const map = new Map<string, TeamOppGroup>()
  for (const c of coachOpportunities(rows)) {
    if (c.renewalOpp <= 0) continue
    const team = teamOf(c.coach) || UNASSIGNED_TEAM
    const category = categoryOf(c.coach) || UNCATEGORIZED
    const member: CoachOppDetail = {
      coach: c.coach,
      name: c.name,
      team,
      category,
      opp: c.renewalOpp,
      conv: c.renewalConv,
    }
    const g = map.get(team) ?? { team, opp: 0, conv: 0, members: [] }
    g.opp += member.opp
    g.conv += member.conv
    g.members.push(member)
    map.set(team, g)
  }
  const groups = [...map.values()]
  for (const g of groups) g.members.sort((a, b) => b.opp - a.opp)
  return sortTeamGroups(groups)
}

// Distinct categories present, with 'Uncategorized' forced last.
export function oppCategories(groups: TeamOppGroup[]): string[] {
  const set = new Set<string>()
  for (const g of groups) for (const m of g.members) if (m.category) set.add(m.category)
  return [...set].sort((a, b) => {
    if (a === UNCATEGORIZED) return 1
    if (b === UNCATEGORIZED) return -1
    return a.localeCompare(b)
  })
}

// Re-aggregate groups keeping only members of `category` (dropping empty teams).
export function filterOppByCategory(groups: TeamOppGroup[], category: string): TeamOppGroup[] {
  if (!category || category === 'all') return groups
  const out: TeamOppGroup[] = []
  for (const g of groups) {
    const members = g.members.filter((m) => m.category === category)
    if (members.length === 0) continue
    out.push({
      team: g.team,
      opp: members.reduce((a, m) => a + m.opp, 0),
      conv: members.reduce((a, m) => a + m.conv, 0),
      members,
    })
  }
  return sortTeamGroups(out)
}

export function oppGrandTotals(groups: TeamOppGroup[]) {
  return groups.reduce((a, g) => ({ opp: a.opp + g.opp, conv: a.conv + g.conv }), {
    opp: 0,
    conv: 0,
  })
}

export function computeKpis(
  coaches: Coach[],
  clients: Client[],
  sales: Sale[],
  csat: CsatStats,
) {
  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.status === 'active').length
  const totalRevenue = sales.reduce((s, x) => s + (Number(x.amount) || 0), 0)
  return {
    totalCoaches: coaches.length,
    totalClients,
    activeClients,
    activeRate: totalClients ? (activeClients / totalClients) * 100 : 0,
    totalRevenue,
    totalSales: sales.length,
    avgCsat: csat.avg,
    csatCount: csat.count,
  }
}

function groupSum(rows: { key: string; value: number }[]): NameValue[] {
  const map = new Map<string, number>()
  for (const r of rows) map.set(r.key, (map.get(r.key) ?? 0) + r.value)
  return [...map.entries()].map(([name, value]) => ({ name, value }))
}

export function revenueByMonth(sales: Sale[]): NameValue[] {
  const rows = sales.map((s) => ({
    key: (s.sale_date ?? '').slice(0, 7), // YYYY-MM
    value: Number(s.amount) || 0,
  }))
  return groupSum(rows)
    .filter((d) => d.name)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function revenueByPlan(sales: Sale[]): NameValue[] {
  return groupSum(
    sales.map((s) => ({ key: s.plan_name ?? '(none)', value: Number(s.amount) || 0 })),
  ).sort((a, b) => b.value - a.value)
}

export function revenueByType(sales: Sale[]): NameValue[] {
  return groupSum(
    sales.map((s) => ({ key: s.sale_type ?? '(none)', value: Number(s.amount) || 0 })),
  ).sort((a, b) => b.value - a.value)
}

export function clientsByStatus(clients: Client[]): NameValue[] {
  return groupSum(
    clients.map((c) => ({ key: c.status ?? '(none)', value: 1 })),
  ).sort((a, b) => b.value - a.value)
}

export function csatByCoach(coaches: Coach[], csat: Csat[]): NameValue[] {
  const byName = new Map<number, string>(coaches.map((c) => [c.id, c.name]))
  const sum = new Map<number, { total: number; n: number }>()
  for (const r of csat) {
    if (r.coach_id == null || !Number.isFinite(Number(r.rating))) continue
    const agg = sum.get(r.coach_id) ?? { total: 0, n: 0 }
    agg.total += Number(r.rating)
    agg.n += 1
    sum.set(r.coach_id, agg)
  }
  return [...sum.entries()]
    .map(([id, { total, n }]) => ({
      name: byName.get(id) ?? `#${id}`,
      value: n ? total / n : 0,
    }))
    .sort((a, b) => b.value - a.value)
}

export function revenueByCoach(coaches: Coach[], sales: Sale[]): NameValue[] {
  const byName = new Map<number, string>(coaches.map((c) => [c.id, c.name]))
  const sum = new Map<number, number>()
  for (const s of sales) {
    if (s.coach_id == null) continue
    sum.set(s.coach_id, (sum.get(s.coach_id) ?? 0) + (Number(s.amount) || 0))
  }
  return [...sum.entries()]
    .map(([id, value]) => ({ name: byName.get(id) ?? `#${id}`, value }))
    .sort((a, b) => b.value - a.value)
}

export function clientsByPlan(clients: Client[]): NameValue[] {
  return groupSum(clients.map((c) => ({ key: c.plan ?? '(none)', value: 1 }))).sort(
    (a, b) => b.value - a.value,
  )
}

// High-level plan family for a client's Current_Plan. The sheet's plans split
// into two tiers: "Leanr Basic" and "Performance CORE" (incl. "Core (New)") are
// Learn Basic; "Leanr Advance" and "Performance PRO" (incl. "Pro (New)") are
// Learn Adv. Anything matching neither falls into "Other".
export const PLAN_GROUPS = ['Learn Basic', 'Learn Adv'] as const
export type PlanGroup = (typeof PLAN_GROUPS)[number] | 'Other'

export function planGroup(plan: string | null | undefined): PlanGroup {
  const p = String(plan ?? '').toLowerCase()
  if (p.includes('basic') || p.includes('core')) return 'Learn Basic'
  if (p.includes('advance') || p.includes('pro')) return 'Learn Adv'
  return 'Other'
}

// Client counts per plan group, ordered Learn Basic, Learn Adv, then Other —
// only including groups that actually have clients.
export function clientsByGroup(clients: Client[]): NameValue[] {
  const counts = groupSum(clients.map((c) => ({ key: planGroup(c.plan), value: 1 })))
  const order = [...PLAN_GROUPS, 'Other']
  return counts.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
}

export function csatByCategory(csat: Csat[]): NameValue[] {
  const sum = new Map<string, { total: number; n: number }>()
  for (const r of csat) {
    if (!Number.isFinite(Number(r.rating))) continue
    const key = r.category ?? '(none)'
    const agg = sum.get(key) ?? { total: 0, n: 0 }
    agg.total += Number(r.rating)
    agg.n += 1
    sum.set(key, agg)
  }
  return [...sum.entries()].map(([name, { total, n }]) => ({
    name,
    value: n ? total / n : 0,
  }))
}

export function ratingDistribution(csat: Csat[]): NameValue[] {
  const counts = new Map<number, number>()
  for (const r of csat) {
    const v = Math.round(Number(r.rating))
    if (v >= 1 && v <= 5) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [1, 2, 3, 4, 5].map((star) => ({
    name: `${star}★`,
    value: counts.get(star) ?? 0,
  }))
}

export function csatByMonth(csat: Csat[]): NameValue[] {
  const sum = new Map<string, { total: number; n: number }>()
  for (const r of csat) {
    if (!Number.isFinite(Number(r.rating))) continue
    const key = (r.rating_date ?? '').slice(0, 7)
    if (!key) continue
    const agg = sum.get(key) ?? { total: 0, n: 0 }
    agg.total += Number(r.rating)
    agg.n += 1
    sum.set(key, agg)
  }
  return [...sum.entries()]
    .map(([name, { total, n }]) => ({ name, value: n ? total / n : 0 }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function avgWeightLost(clients: Client[]): number {
  const vals = clients
    .map((c) => Number(c.weight_lost_kg))
    .filter((v) => Number.isFinite(v))
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
}

export type SaleRow = {
  id: number
  date: string
  client: string
  coach: string
  plan: string
  amount: number
  type: string
}

export function recentSales(
  sales: Sale[],
  clients: Client[],
  coaches: Coach[],
  limit = 25,
): SaleRow[] {
  const clientName = new Map<number, string>(clients.map((c) => [c.id, c.name]))
  const coachName = new Map<number, string>(coaches.map((c) => [c.id, c.name]))
  return [...sales]
    .sort((a, b) => (b.sale_date ?? '').localeCompare(a.sale_date ?? ''))
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      date: s.sale_date ?? '',
      client: s.client_id != null ? clientName.get(s.client_id) ?? '—' : '—',
      coach: s.coach_id != null ? coachName.get(s.coach_id) ?? '—' : '—',
      plan: s.plan_name ?? '—',
      amount: Number(s.amount) || 0,
      type: s.sale_type ?? '—',
    }))
}

export type ClientRow = {
  id: number
  name: string
  coach: string
  plan: string
  group: PlanGroup
  status: string
  weightLost: number
}

export function clientsWithNames(clients: Client[], coaches: Coach[]): ClientRow[] {
  const coachName = new Map<number, string>(coaches.map((c) => [c.id, c.name]))
  return [...clients]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({
      id: c.id,
      name: c.name,
      coach: c.coach_id != null ? coachName.get(c.coach_id) ?? '—' : '—',
      plan: c.plan ?? '—',
      group: planGroup(c.plan),
      status: c.status ?? '—',
      weightLost: Number(c.weight_lost_kg) || 0,
    }))
}

export type CoachRow = {
  name: string
  role: string
  team: string
  clients: number
  revenue: number
  avgCsat: number
}

export function coachBreakdown(
  coaches: Coach[],
  clients: Client[],
  sales: Sale[],
  csat: CsatStats,
): CoachRow[] {
  const csatById = new Map(csat.byCoach.map((c) => [c.id, c.value]))
  return coaches
    .map((coach) => {
      const cClients = clients.filter((c) => c.coach_id === coach.id).length
      const cRevenue = sales
        .filter((s) => s.coach_id === coach.id)
        .reduce((s, x) => s + (Number(x.amount) || 0), 0)
      return {
        name: coach.name,
        role: coach.role ?? '—',
        team: coach.team ?? '—',
        clients: cClients,
        revenue: cRevenue,
        avgCsat: csatById.get(coach.id) ?? 0,
      }
    })
    .filter((r) => r.clients > 0 || r.revenue > 0) // hide coaches with no activity
    .sort((a, b) => b.revenue - a.revenue)
}

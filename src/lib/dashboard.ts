// Pure helpers that turn raw table rows into dashboard KPIs and chart series.

export type Coach = {
  id: number
  name: string
  role: string | null
  team: string | null
  status: string | null
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

export function formatINR(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-IN', { maximumFractionDigits: 1 })
}

export function computeKpis(
  coaches: Coach[],
  clients: Client[],
  sales: Sale[],
  csat: Csat[],
) {
  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.status === 'active').length
  const totalRevenue = sales.reduce((s, x) => s + (Number(x.amount) || 0), 0)
  const ratings = csat.map((c) => Number(c.rating)).filter((r) => Number.isFinite(r))
  const avgCsat = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0
  return {
    totalCoaches: coaches.length,
    totalClients,
    activeClients,
    activeRate: totalClients ? (activeClients / totalClients) * 100 : 0,
    totalRevenue,
    totalSales: sales.length,
    avgCsat,
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
  csat: Csat[],
): CoachRow[] {
  return coaches
    .map((coach) => {
      const cClients = clients.filter((c) => c.coach_id === coach.id).length
      const cRevenue = sales
        .filter((s) => s.coach_id === coach.id)
        .reduce((s, x) => s + (Number(x.amount) || 0), 0)
      const ratings = csat
        .filter((c) => c.coach_id === coach.id)
        .map((c) => Number(c.rating))
        .filter((r) => Number.isFinite(r))
      const avg = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0
      return {
        name: coach.name,
        role: coach.role ?? '—',
        team: coach.team ?? '—',
        clients: cClients,
        revenue: cRevenue,
        avgCsat: avg,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

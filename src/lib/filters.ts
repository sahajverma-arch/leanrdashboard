import type { Client, Sale } from './dashboard'

export type Filters = {
  start?: string // YYYY-MM-DD
  end?: string
  coachId?: number
  plan?: string
  status?: string
}

export type FilterOptions = {
  coaches: { id: number; name: string }[]
  plans: string[]
  statuses: string[]
}

// Parse Next.js searchParams into a Filters object.
export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const s = (k: string) => {
    const v = sp[k]
    return typeof v === 'string' && v !== '' ? v : undefined
  }
  const coach = s('coach')
  return {
    start: s('start'),
    end: s('end'),
    coachId: coach ? Number(coach) : undefined,
    plan: s('plan'),
    status: s('status'),
  }
}

export function hasActiveFilters(f: Filters): boolean {
  return !!(f.start || f.end || f.coachId != null || f.plan || f.status)
}

// Clients are current roster — filtered by coach / plan / status (not date).
export function filterClients(clients: Client[], f: Filters): Client[] {
  return clients.filter(
    (c) =>
      (f.coachId == null || c.coach_id === f.coachId) &&
      (!f.plan || c.plan === f.plan) &&
      (!f.status || c.status === f.status),
  )
}

// Sales filtered by date range / coach / plan.
export function filterSales(sales: Sale[], f: Filters): Sale[] {
  return sales.filter(
    (s) =>
      (!f.start || (s.sale_date && s.sale_date >= f.start)) &&
      (!f.end || (s.sale_date && s.sale_date <= f.end)) &&
      (f.coachId == null || s.coach_id === f.coachId) &&
      (!f.plan || s.plan_name === f.plan),
  )
}

import { createClient } from '@/lib/supabase/server'
import type { Coach, Client, Sale, Csat } from './dashboard'

export type DashData = {
  coaches: Coach[]
  clients: Client[]
  sales: Sale[]
  csat: Csat[]
}

const PAGE = 1000

// Supabase caps each API response at 1000 rows, so page through with .range()
// to get the full table (CSAT is ~24k rows).
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

// Fetch all four tables (paged). Aggregation happens server-side in the pages.
export async function getData(): Promise<{ data?: DashData; error?: string }> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { error: 'Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).' }
  }

  const supabase = await createClient()
  const [coaches, clients, sales, csat] = await Promise.all([
    fetchAll<Coach>(supabase, 'coaches'),
    fetchAll<Client>(supabase, 'clients'),
    fetchAll<Sale>(supabase, 'sales'),
    fetchAll<Csat>(supabase, 'csat'),
  ])

  const error = coaches.error || clients.error || sales.error || csat.error
  if (error) return { error }

  return {
    data: {
      coaches: coaches.data ?? [],
      clients: clients.data ?? [],
      sales: sales.data ?? [],
      csat: csat.data ?? [],
    },
  }
}

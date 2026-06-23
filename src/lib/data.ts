import { createClient } from '@/lib/supabase/server'
import type { Coach, Client, Sale, Csat } from './dashboard'

export type DashData = {
  coaches: Coach[]
  clients: Client[]
  sales: Sale[]
  csat: Csat[]
}

// Fetch all four tables once. Shared by every page (the dataset is small).
export async function getData(): Promise<{ data?: DashData; error?: string }> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { error: 'Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).' }
  }

  const supabase = await createClient()
  const [coaches, clients, sales, csat] = await Promise.all([
    supabase.from('coaches').select('*'),
    supabase.from('clients').select('*'),
    supabase.from('sales').select('*'),
    supabase.from('csat').select('*'),
  ])

  const error =
    coaches.error || clients.error || sales.error || csat.error
  if (error) return { error: error.message }

  return {
    data: {
      coaches: (coaches.data ?? []) as Coach[],
      clients: (clients.data ?? []) as Client[],
      sales: (sales.data ?? []) as Sale[],
      csat: (csat.data ?? []) as Csat[],
    },
  }
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client for SERVER-SIDE pipeline use only. It bypasses Row Level
// Security, so never import this from client components or expose the key.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runSync } from '@/lib/sync/run'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Manual "Sync now" trigger — only for logged-in users.
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runSync()
  // 207 = partial success (some sources errored).
  return NextResponse.json(result, { status: result.ok ? 200 : 207 })
}

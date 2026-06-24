import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { runSync } from '@/lib/sync/run'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// TEMP diagnostic — reports env presence + actual sync errors. Remove after debugging.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('diag') !== 'leanr-diag-7x9') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null,
    GOOGLE_PRIVATE_KEY_unescaped_len: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n').length,
    SHEET_LEANR_ID: process.env.SHEET_LEANR_ID || null,
    QSTASH_CURRENT_SIGNING_KEY: !!process.env.QSTASH_CURRENT_SIGNING_KEY,
  }
  const { runSync } = await import('@/lib/sync/run')
  const result = await runSync()
  return NextResponse.json({ env, result })
} // sync moves ~24k CSAT rows; give it headroom

// Scheduled sync, triggered by an Upstash QStash schedule.
// We verify QStash's request signature here rather than wrapping the handler at
// module load (which would throw during `next build` when keys aren't set yet).
export async function POST(req: Request) {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY
  if (!currentSigningKey || !nextSigningKey) {
    return NextResponse.json(
      { error: 'QStash signing keys are not configured' },
      { status: 500 },
    )
  }

  const signature = req.headers.get('upstash-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const body = await req.text()
  const receiver = new Receiver({ currentSigningKey, nextSigningKey })
  const isValid = await receiver
    .verify({ signature, body })
    .catch(() => false)

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const result = await runSync()
  return NextResponse.json(result, { status: result.ok ? 200 : 207 })
}

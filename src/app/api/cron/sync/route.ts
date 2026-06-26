import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { runSync } from '@/lib/sync/run'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // sync moves ~24k CSAT rows; give it headroom

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

  // Verified QStash request. Log the trigger (message id + retry count) so the
  // run is identifiable in Vercel's logs and we can tell first-tries from retries.
  const messageId = req.headers.get('upstash-message-id') ?? 'unknown'
  const retried = req.headers.get('upstash-retried') ?? '0'
  console.log(`[cron/sync] triggered by QStash — message ${messageId}, retry ${retried}`)

  const startedAt = Date.now()
  const result = await runSync()
  const elapsedSec = Math.round((Date.now() - startedAt) / 1000)
  const summary = Object.fromEntries(
    result.results.map((r) => [r.table, r.error ? `ERROR: ${r.error}` : r.rows]),
  )
  console.log(`[cron/sync] done in ${elapsedSec}s — ok=${result.ok}`, summary)

  return NextResponse.json(result, { status: result.ok ? 200 : 207 })
}

import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { runSync } from '@/lib/sync/run'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

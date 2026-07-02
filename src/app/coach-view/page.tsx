import { getCoachViewData } from '@/lib/data'
import { PageHeader, Panel } from '@/components/ui'
import CoachDietitianView from '@/components/coach-dietitian-view'

export const dynamic = 'force-dynamic'

export default async function CoachViewPage() {
  const data = await getCoachViewData()
  const empty = !data.dietitians.length && !data.core.length && !data.pt.length

  if (empty) {
    return (
      <>
        <PageHeader title="Coach & Dietitian view" subtitle="Client load by coach" />
        <Panel title="No coach data yet">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Once the{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">LeanR Dietitian</code>,{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">Core_Coaches_Followups</code>{' '}
            and{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">LeanR PT Coaches</code> tabs
            are reachable, each coach&apos;s Active / Pause / CNR client counts will appear here.
          </p>
        </Panel>
      </>
    )
  }

  return <CoachDietitianView data={data} />
}

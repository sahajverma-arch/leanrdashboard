import { getCoachTargets } from '@/lib/data'
import { teamTargets } from '@/lib/dashboard'
import { PageHeader, Panel } from '@/components/ui'
import TargetsView from '@/components/targets-view'

export const dynamic = 'force-dynamic'

export default async function TargetsPage() {
  const rows = await getCoachTargets()

  if (rows.length === 0) {
    return (
      <>
        <PageHeader title="Sales Target" subtitle="Targets by team & coach" />
        <Panel title="No target data yet">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Once the sync mirrors the{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">Coach Wise Target</code> tab,
            team and coach targets will appear here.
          </p>
        </Panel>
      </>
    )
  }

  return <TargetsView teams={teamTargets(rows)} />
}

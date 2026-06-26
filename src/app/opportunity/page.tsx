import { getCoachOpportunity, getTeamStructure } from '@/lib/data'
import { PageHeader, Panel } from '@/components/ui'
import OpportunityView from '@/components/opportunity-view'

export const dynamic = 'force-dynamic'

export default async function OpportunityPage() {
  const [rows, team] = await Promise.all([getCoachOpportunity(), getTeamStructure()])

  if (rows.length === 0) {
    return (
      <>
        <PageHeader title="Renewal opportunity" subtitle="By team & coach" />
        <Panel title="No opportunity data yet">
          <p className="text-sm text-zinc-500">
            Once the sync mirrors the{' '}
            <code className="rounded bg-zinc-100 px-1">raw_data_coaches_opportunity</code> tab,
            renewal and extension numbers will appear here.
          </p>
        </Panel>
      </>
    )
  }

  return <OpportunityView rows={rows} team={team} />
}

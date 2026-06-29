import { getDashboard, getLeanrTeamSales, getCoachMonthSales } from '@/lib/data'
import SalesView from '@/components/sales-view'
import { SetupNotice, TopCoaches } from '@/components/ui'
import { topCoaches } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function SalesPage() {
  const [{ data, error }, leanrTeam, coachSales] = await Promise.all([
    getDashboard({}),
    getLeanrTeamSales(),
    getCoachMonthSales(),
  ])
  if (!data) return <SetupNotice error={error} />

  const now = new Date()
  const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  // Top 3 coaches by this month's sales, per type.
  const topDietitians = topCoaches(coachSales, 3, 'dietitian')
  const topPt = topCoaches(coachSales, 3, 'pt')
  const topBasic = topCoaches(coachSales, 3, 'basic')

  return (
    <>
      <SalesView sales={data.sales} leanrTeam={leanrTeam} initialMonth={initialMonth} />

      <h2 className="mt-6 mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Top coaches by sales · {monthLabel}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TopCoaches title="Dietitians" items={topDietitians} />
        <TopCoaches title="PT Coaches" items={topPt} />
        <TopCoaches title="Basic Coaches" items={topBasic} />
      </div>
    </>
  )
}

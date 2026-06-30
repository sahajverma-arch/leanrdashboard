import { getOverallSalesRows } from '@/lib/data'
import { PageHeader, Kpi, Panel, SetupNotice } from '@/components/ui'
import CsatMonthFilter from '@/components/csat-month-filter'
import { formatINRShort } from '@/lib/dashboard'
import {
  DEPTS,
  ORDER_COLS,
  buildTeamwiseMatrix,
  salesMonths,
  filterByMonth,
  type Cell,
} from '@/lib/teamwise'

export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | string[] | undefined>>

function monthLabel(ym?: string): string | undefined {
  if (!ym) return undefined
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

// Stacked count (bold) over ₹ amount (muted) — the value shown in every cell.
function CellView({ cell }: { cell: Cell }) {
  return (
    <div className="text-right">
      <div className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
        {cell.count.toLocaleString('en-IN')}
      </div>
      <div className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
        {cell.amount ? formatINRShort(cell.amount) : '—'}
      </div>
    </div>
  )
}

export default async function SalesTeamwisePage({ searchParams }: { searchParams: SP }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <SetupNotice error="Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)." />
  }

  const sp = await searchParams
  const month = typeof sp.month === 'string' ? sp.month : undefined

  const allRows = await getOverallSalesRows()
  const months = salesMonths(allRows)
  const m = buildTeamwiseMatrix(filterByMonth(allRows, month))
  const label = monthLabel(month)

  return (
    <>
      <PageHeader
        title="Sales teamwise"
        subtitle="Sales by department & order type (Overall Sales)"
      />
      <CsatMonthFilter months={months} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Total sales" value={m.grand.count.toLocaleString('en-IN')} />
        <Kpi label="Revenue" value={formatINRShort(m.grand.amount)} />
        <Kpi label="New" value={m.colTotals.New.count.toLocaleString('en-IN')} sub={formatINRShort(m.colTotals.New.amount)} />
        <Kpi label="Renew" value={m.colTotals.Renew.count.toLocaleString('en-IN')} sub={formatINRShort(m.colTotals.Renew.amount)} />
      </div>

      <Panel title={`Sales teamwise${label ? ` · ${label}` : ' · all time'}`} className="mt-4">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="py-2 pr-4 text-left font-medium">Department</th>
                {ORDER_COLS.map((c) => (
                  <th key={c} className="py-2 pl-4 text-right font-medium">
                    {c}
                  </th>
                ))}
                <th className="py-2 pl-4 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {DEPTS.map((d) => (
                <tr key={d} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{d}</td>
                  {ORDER_COLS.map((c) => (
                    <td key={c} className="py-2 pl-4">
                      <CellView cell={m.cells[d][c]} />
                    </td>
                  ))}
                  <td className="py-2 pl-4">
                    <CellView cell={m.rowTotals[d]} />
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-zinc-300 font-semibold dark:border-zinc-600">
                <td className="py-2 pr-4 text-zinc-900 dark:text-zinc-100">Total</td>
                {ORDER_COLS.map((c) => (
                  <td key={c} className="py-2 pl-4">
                    <CellView cell={m.colTotals[c]} />
                  </td>
                ))}
                <td className="py-2 pl-4">
                  <CellView cell={m.grand} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Each cell shows the order count over the ₹ amount. <strong>Ref</strong> = new orders whose
          sale type is a reference (carved out of New, so columns don&apos;t overlap). Departments
          outside the four named teams (e.g. Sales &amp; Growth) roll up into <strong>Others</strong>.
        </p>
      </Panel>
    </>
  )
}

// Teamwise sales matrix for the "Sales teamwise" tab. Rows are department
// categories (from the Overall Sales sheet's ActualOwnerDept column); columns
// are order types (from OrderType, with Ref carved out of New). Built from
// raw_overall_sales — the same sheet the Overview and Sales tabs use.

export type OverallSaleRow = {
  dept: string | null // actualownerdept
  order_type: string | null // ordertype
  sale_type: string | null // saletypewithextension
  amount: number
  sale_date: string | null // YYYY-MM-DD
}

// Department rows in display order. Anything not matching the four named
// departments falls into 'Others' (which includes the large generic
// "Sales and Growth" team and odds like Quality / Tech / blank).
export const DEPTS = [
  'Personal Training',
  'Weight Management',
  'International',
  'Disease Management',
  'Others',
] as const
export type Dept = (typeof DEPTS)[number]

export function deptCategory(dept: string | null | undefined): Dept {
  const d = String(dept ?? '')
    .toLowerCase()
    .trim()
  if (d.includes('personal training')) return 'Personal Training'
  if (d.includes('disease management')) return 'Disease Management'
  if (d.includes('international')) return 'International'
  // "Weight Management", "Weight Management.", "Wellness - WM", "Wellness".
  if (d.includes('weight management') || d.includes('wm') || d.includes('wellness'))
    return 'Weight Management'
  return 'Others'
}

// Order-type columns in display order. 'Ref' is carved out of New: a NEW order
// whose SaleTypeWithExtension is 'Reference'. The remaining NEW orders (incl.
// product-only) stay under 'New', so the columns are mutually exclusive and
// sum to the row total.
export const ORDER_COLS = ['New', 'Renew', 'Extension', 'Reactive', 'Ref'] as const
export type OrderCol = (typeof ORDER_COLS)[number]

export function orderColumn(
  orderType: string | null | undefined,
  saleType: string | null | undefined,
): OrderCol | null {
  const o = String(orderType ?? '')
    .toUpperCase()
    .trim()
  const s = String(saleType ?? '')
    .toUpperCase()
    .trim()
  if (o === 'NEW') return s === 'REFERENCE' ? 'Ref' : 'New'
  if (o === 'RENEW') return 'Renew'
  if (o === 'EXTENSION') return 'Extension'
  if (o === 'REACTIVATE') return 'Reactive'
  return null // unknown / blank order type — excluded
}

export type Cell = { count: number; amount: number }

export type TeamwiseMatrix = {
  cells: Record<Dept, Record<OrderCol, Cell>>
  rowTotals: Record<Dept, Cell>
  colTotals: Record<OrderCol, Cell>
  grand: Cell
}

const empty = (): Cell => ({ count: 0, amount: 0 })

export function buildTeamwiseMatrix(rows: OverallSaleRow[]): TeamwiseMatrix {
  const cells = {} as Record<Dept, Record<OrderCol, Cell>>
  const rowTotals = {} as Record<Dept, Cell>
  const colTotals = {} as Record<OrderCol, Cell>
  for (const d of DEPTS) {
    cells[d] = {} as Record<OrderCol, Cell>
    rowTotals[d] = empty()
    for (const c of ORDER_COLS) cells[d][c] = empty()
  }
  for (const c of ORDER_COLS) colTotals[c] = empty()
  const grand = empty()

  for (const r of rows) {
    const col = orderColumn(r.order_type, r.sale_type)
    if (!col) continue
    const dept = deptCategory(r.dept)
    const amt = Number(r.amount) || 0
    const add = (cell: Cell) => {
      cell.count++
      cell.amount += amt
    }
    add(cells[dept][col])
    add(rowTotals[dept])
    add(colTotals[col])
    add(grand)
  }
  return { cells, rowTotals, colTotals, grand }
}

// Distinct YYYY-MM months present, newest first (for the filter dropdown).
export function salesMonths(rows: OverallSaleRow[]): string[] {
  const set = new Set<string>()
  for (const r of rows) {
    const m = String(r.sale_date ?? '').slice(0, 7)
    if (/^\d{4}-\d{2}$/.test(m)) set.add(m)
  }
  return [...set].sort().reverse()
}

export function filterByMonth(rows: OverallSaleRow[], month?: string): OverallSaleRow[] {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return rows
  return rows.filter((r) => String(r.sale_date ?? '').slice(0, 7) === month)
}

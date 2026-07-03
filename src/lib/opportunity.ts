// Parser for the "opportunity" sheet tab — a pre-aggregated renewal/extension
// opportunity report with two side-by-side sections: coach-wise (cols B-H) and
// team-wise (cols K-Q). Each section has Renewal (Opportunity / Converted /
// Conversion) then Extension (Opportunity / Converted / Conversion). We read the
// counts by column position and recompute the conversion % ourselves, so the
// sheet's text labels ("NO Renewal Opportunity") don't matter.
//
// Layout (0-based column index), data starting at row index 3:
//   1 coach name | 2 renewalOpp | 3 renewalConv | 5 extOpp | 6 extConv
//  10 team name  | 11 renewalOpp | 12 renewalConv | 14 extOpp | 15 extConv

import type { CellValue } from '@/lib/google/sheets'

export type OppStat = {
  name: string // full 'Name ECODE' (kept as-is — two coaches share a first name)
  renewalOpp: number
  renewalConv: number
  extOpp: number
  extConv: number
}

export type OpportunityData = { coaches: OppStat[]; teams: OppStat[] }

const num = (v: CellValue): number => {
  const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function parseOpportunitySheet(values: CellValue[][]): OpportunityData {
  const coaches: OppStat[] = []
  const teams: OppStat[] = []
  // Rows 0-2 are a blank row + two header rows; real data starts at index 3.
  for (let i = 3; i < values.length; i++) {
    const row = values[i] ?? []
    const coach = String(row[1] ?? '').trim()
    if (coach) {
      coaches.push({
        name: coach,
        renewalOpp: num(row[2]),
        renewalConv: num(row[3]),
        extOpp: num(row[5]),
        extConv: num(row[6]),
      })
    }
    const team = String(row[10] ?? '').trim()
    if (team) {
      teams.push({
        name: team,
        renewalOpp: num(row[11]),
        renewalConv: num(row[12]),
        extOpp: num(row[14]),
        extConv: num(row[15]),
      })
    }
  }
  return { coaches, teams }
}

// Conversion rate as a percentage, or null when there's no opportunity.
export function convPct(converted: number, opportunity: number): number | null {
  return opportunity > 0 ? (converted / opportunity) * 100 : null
}

// Column totals for the summary KPIs.
export function oppTotals(rows: OppStat[]) {
  return rows.reduce(
    (a, r) => ({
      renewalOpp: a.renewalOpp + r.renewalOpp,
      renewalConv: a.renewalConv + r.renewalConv,
      extOpp: a.extOpp + r.extOpp,
      extConv: a.extConv + r.extConv,
    }),
    { renewalOpp: 0, renewalConv: 0, extOpp: 0, extConv: 0 },
  )
}

// ── Opportunity summary (cols V–Y of the same 'opportunity' tab) ────────────────
// A separate pre-aggregated block on the right of the sheet, one row per
// opportunity type. Read by absolute cell reference (the sheet's own layout), so
// these must track the sheet if it's ever restructured:
//   Renewal      V4=opps  W4=conversions  X4=advance pmts  Y4=continuation
//   Part Payment V7=opps  W7=conversions                    (rate computed)
//   Extension    V11=opps W11=conversions X11=rate
//   Referral     V16=opps W16=conversions X16=rate
//   Reactivation V21=opps W21=conversions X21=rate

// Total / conversions / conversion-rate (%), the shape shared by the last four
// sections. Renewal has extra columns, so it gets its own type below.
export type OppTypeStat = {
  total: number
  conversions: number
  rate: number | null // percentage 0–100, or null when not derivable
}

export type OpportunitySummary = {
  renewal: {
    total: number
    conversions: number
    advancePayments: number
    continuation: number
    rate: number | null
  }
  partPayment: OppTypeStat
  extension: OppTypeStat
  referral: OppTypeStat
  reactivation: OppTypeStat
}

// 0-based column indices for the summary block.
const COL = { V: 21, W: 22, X: 23, Y: 24 }

// Cell at a 1-based row / column index, matching the sheet's own A1 references.
const at = (values: CellValue[][], row: number, col: number): CellValue =>
  values[row - 1]?.[col] ?? null

// The X-column conversion rates are stored as fractions (0.1404 = 14.04%). Return
// a percentage 0–100, or null when the cell is blank. A value already > 1 is kept
// as-is, so a future "14.04" entered directly as a percent also renders correctly.
const ratePct = (v: CellValue): number | null => {
  const s = String(v ?? '').trim()
  if (s === '') return null
  const n = Number(s.replace(/[^0-9.\-]/g, ''))
  if (!Number.isFinite(n)) return null
  return n <= 1 ? n * 100 : n
}

export function parseOpportunitySummary(values: CellValue[][]): OpportunitySummary {
  const renewalTotal = num(at(values, 4, COL.V)) // V4
  const renewalConv = num(at(values, 4, COL.W)) // W4
  const ppTotal = num(at(values, 7, COL.V)) // V7
  const ppConv = num(at(values, 7, COL.W)) // W7
  const extTotal = num(at(values, 11, COL.V)) // V11
  const extConv = num(at(values, 11, COL.W)) // W11
  const refTotal = num(at(values, 16, COL.V)) // V16
  const refConv = num(at(values, 16, COL.W)) // W16
  const reacTotal = num(at(values, 21, COL.V)) // V21
  const reacConv = num(at(values, 21, COL.W)) // W21

  return {
    renewal: {
      total: renewalTotal,
      conversions: renewalConv,
      advancePayments: num(at(values, 4, COL.X)), // X4
      continuation: num(at(values, 4, COL.Y)), // Y4
      rate: convPct(renewalConv, renewalTotal),
    },
    partPayment: {
      total: ppTotal,
      conversions: ppConv,
      rate: convPct(ppConv, ppTotal), // no rate column — always computed
    },
    extension: {
      total: extTotal,
      conversions: extConv,
      rate: ratePct(at(values, 11, COL.X)) ?? convPct(extConv, extTotal), // X11
    },
    referral: {
      total: refTotal,
      conversions: refConv,
      // X16 (0.1404 → 14.04%) if present; the spec's fixed 14.04% otherwise.
      rate: ratePct(at(values, 16, COL.X)) ?? 14.04,
    },
    reactivation: {
      total: reacTotal,
      conversions: reacConv,
      rate: ratePct(at(values, 21, COL.X)) ?? convPct(reacConv, reacTotal), // X21
    },
  }
}

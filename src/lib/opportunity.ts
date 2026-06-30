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

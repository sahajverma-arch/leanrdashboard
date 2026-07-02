// Parsers for the three "coach bandwidth / status" sheet tabs that power the
// Coach & Dietitian view. Each tab lists one coach per row with their current
// client load split into Active / Pause / CNR.
//
// Layouts (only the columns we use; each sheet carries many more we ignore).
// Like the coach roster tabs, LeanR Dietitian / Core_Coaches_Followups carry a
// junk date row above the header, so their data starts on the 3rd row; the PT
// tab has a clean header on row 1.
//
//   LeanR Dietitian         header row 2 — A Dietitian    | B Shift | C Gender | D Active Client | E Pause | F CNR
//   Core_Coaches_Followups  header row 2 — A Core Coaches | B Shift | C Gender | D Active Client | E Pause | F CNR
//   LeanR PT Coaches        header row 1 — A Coach | B Shift | C Status | D Max Clients | E Active | F Pause | G CNR

import type { CellValue } from '@/lib/google/sheets'

export type CoachStatusRow = {
  name: string
  shift: string
  status: string // employment type (Part Time / Full Time) — PT sheet only
  gender: string // Dietitian / Core sheets only
  active: number
  pause: number
  cnr: number
}

const str = (x: CellValue) => String(x ?? '').trim()
const num = (x: CellValue) => {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}

// A real coach row has a name that isn't blank, a "//…" comment, or a stray
// "total" summary line.
function isCoachName(name: string): boolean {
  if (!name || name.startsWith('//')) return false
  return !/^(grand\s+)?total$/i.test(name)
}

// LeanR Dietitian & Core_Coaches_Followups share a layout (name, shift, gender,
// active, pause, cnr), with a junk date row + header before the data (row 3+).
export function parseCoachStatusSheet(values: CellValue[][]): CoachStatusRow[] {
  const out: CoachStatusRow[] = []
  for (let i = 2; i < values.length; i++) {
    const row = values[i] ?? []
    const name = str(row[0])
    if (!isCoachName(name)) continue
    out.push({
      name,
      shift: str(row[1]),
      gender: str(row[2]),
      status: '',
      active: num(row[3]),
      pause: num(row[4]),
      cnr: num(row[5]),
    })
  }
  return out
}

// LeanR PT Coaches: clean header on row 1, so data starts at index 1.
// Employment type (Part Time / Full Time) is col C; Max Clients (col D) is
// skipped; Active / Pause / CNR are cols E / F / G.
export function parsePtCoachSheet(values: CellValue[][]): CoachStatusRow[] {
  const out: CoachStatusRow[] = []
  for (let i = 1; i < values.length; i++) {
    const row = values[i] ?? []
    const name = str(row[0])
    if (!isCoachName(name)) continue
    out.push({
      name,
      shift: str(row[1]),
      status: str(row[2]),
      gender: '',
      active: num(row[4]),
      pause: num(row[5]),
      cnr: num(row[6]),
    })
  }
  return out
}

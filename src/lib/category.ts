// Friendly labels + tag colours for coach categories, shared by the Sales Target
// and Renewal Opportunity views. The category taxonomy comes from the
// "Coach Wise Target" tab: 'LeanR Advance Coaches', 'Dietitian', 'LeanR Basic Coaches'.

// "LeanR Advance Coaches" -> "Advance", "LeanR Basic Coaches" -> "Basic", etc.
export const catLabel = (c: string) =>
  c.replace(/^LeanR\s+/i, '').replace(/\s+Coaches$/i, '').trim() || c

const CAT_TAG: Record<string, string> = {
  'LeanR Advance Coaches': 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  Dietitian: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  'LeanR Basic Coaches': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
}

// Tailwind classes for a category's pill/tag; unknown (e.g. 'Uncategorized') -> neutral zinc.
export const catTagClass = (c: string) =>
  CAT_TAG[c] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'

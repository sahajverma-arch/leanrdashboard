// Plain presentational components shared across pages (no client interactivity).

import { formatINR, type TopCoach } from '@/lib/dashboard'

const TYPE_LABEL: Record<string, string> = {
  pt: 'PT Coach',
  dietitian: 'Dietitian',
  basic: 'Basic Coach',
}

// Ranked list of top coaches by sale amount. `showType` adds a per-row type tag
// (used on the Overview, where the list mixes all coach types).
export function TopCoaches({
  title,
  subtitle,
  items,
  showType = false,
}: {
  title: string
  subtitle?: string
  items: TopCoach[]
  showType?: boolean
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">No sales yet.</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {items.map((it, i) => (
            <li key={`${it.name}-${i}`} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{it.name}</div>
                {showType && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{TYPE_LABEL[it.type] ?? it.type}</div>
                )}
              </div>
              <div className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {formatINR(it.amount)}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
    </div>
  )
}

export function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{sub}</div>}
    </div>
  )
}

export function Panel({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h2>
      {children}
    </section>
  )
}

export function SetupNotice({ error }: { error?: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100">
      <h2 className="mb-2 text-base font-semibold">Connect Supabase to see the dashboard</h2>
      <ol className="list-decimal space-y-1 pl-5">
        <li>Create a Supabase project.</li>
        <li>
          Run <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">supabase/migrations/0001_init.sql</code>{' '}
          in the SQL Editor.
        </li>
        <li>
          Set <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">.env</code>, then restart.
        </li>
      </ol>
      {error && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Details: {error}</p>}
    </div>
  )
}

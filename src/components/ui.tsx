// Plain presentational components shared across pages (no client interactivity).

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
    </div>
  )
}

export function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-zinc-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
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
    <section className={`rounded-xl border border-zinc-200 bg-white p-4 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold text-zinc-700">{title}</h2>
      {children}
    </section>
  )
}

export function SetupNotice({ error }: { error?: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
      <h2 className="mb-2 text-base font-semibold">Connect Supabase to see the dashboard</h2>
      <ol className="list-decimal space-y-1 pl-5">
        <li>Create a Supabase project.</li>
        <li>
          Run <code className="rounded bg-amber-100 px-1">supabase/migrations/0001_init.sql</code>{' '}
          in the SQL Editor.
        </li>
        <li>
          Set <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
          <code className="rounded bg-amber-100 px-1">.env</code>, then restart.
        </li>
      </ol>
      {error && <p className="mt-3 text-xs text-amber-700">Details: {error}</p>}
    </div>
  )
}

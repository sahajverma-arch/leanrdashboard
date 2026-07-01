import { formatINR } from '@/lib/dashboard'

export type SalesAgg = {
  revenue: number
  renew: number
  reactive: number
  reference: number
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value.toLocaleString('en-IN')}</div>
    </div>
  )
}

function SectionCard({ title, subtitle, agg }: { title: string; subtitle: string; agg: SalesAgg }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {title} · {subtitle}
      </div>
      <div className="mt-1 text-4xl font-bold text-zinc-900 dark:text-zinc-100">{formatINR(agg.revenue)}</div>
      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">total sales value</div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Stat label="Renew" value={agg.renew} />
        <Stat label="Reactive" value={agg.reactive} />
        <Stat label="Ref" value={agg.reference} />
      </div>
    </section>
  )
}

// Overall Sales vs Sales by LEANR Team, both scoped to the page's date range.
export default function SalesView({
  overall,
  leanr,
  rangeLabel,
}: {
  overall: SalesAgg
  leanr: SalesAgg
  rangeLabel: string
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <SectionCard title="Overall Sales" subtitle={rangeLabel} agg={overall} />
      <SectionCard title="Sales by LEANR Team" subtitle={rangeLabel} agg={leanr} />
    </div>
  )
}

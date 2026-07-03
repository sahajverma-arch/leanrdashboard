import { getOpportunitySummary } from '@/lib/data'
import { PageHeader, Kpi, Panel } from '@/components/ui'

export const dynamic = 'force-dynamic'

const n = (v: number) => v.toLocaleString('en-IN')
const rateText = (r: number | null) => (r === null ? '—' : `${r.toFixed(2)}%`)

// A titled group of KPI cards. `cols` picks the card grid width per section.
function Section({
  title,
  cols,
  children,
}: {
  title: string
  cols: 3 | 4
  children: React.ReactNode
}) {
  const grid = cols === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h2>
      <div className={`grid gap-3 ${grid}`}>{children}</div>
    </section>
  )
}

// Conversion-rate KPI: the % as a large value, a percentage badge, and a progress
// bar — the highlighted card the spec calls for.
function ConversionCard({ rate }: { rate: number | null }) {
  const text = rateText(rate)
  const width = rate === null ? 0 : Math.max(0, Math.min(100, rate))
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Conversion rate
        </div>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          {text}
        </span>
      </div>
      <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{text}</div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-500 dark:bg-blue-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export default async function OpportunitiesPage() {
  const s = await getOpportunitySummary()

  if (!s) {
    return (
      <>
        <PageHeader
          title="Opportunity"
          subtitle="Renewal, part payment, extension, referral & reactivation"
        />
        <Panel title="No data">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Couldn&apos;t read the &quot;opportunity&quot; sheet. Check that the tab exists and the
            service account has access.
          </p>
        </Panel>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Opportunity"
        subtitle="Renewal, part payment, extension, referral & reactivation"
      />

      <div className="space-y-6">
        <Section title="Renewal" cols={4}>
          <Kpi label="Total renewal opportunities" value={n(s.renewal.total)} />
          <Kpi
            label="Renewal conversions"
            value={n(s.renewal.conversions)}
            sub={`${rateText(s.renewal.rate)} conversion`}
          />
          <Kpi label="Advance payments" value={n(s.renewal.advancePayments)} />
          <Kpi label="Continuation conversions" value={n(s.renewal.continuation)} />
        </Section>

        <Section title="Part Payment" cols={3}>
          <Kpi label="Total part payment opportunities" value={n(s.partPayment.total)} />
          <Kpi label="Part payment conversions" value={n(s.partPayment.conversions)} />
          <ConversionCard rate={s.partPayment.rate} />
        </Section>

        <Section title="Extension" cols={3}>
          <Kpi label="Total extension opportunities" value={n(s.extension.total)} />
          <Kpi label="Extension conversions" value={n(s.extension.conversions)} />
          <ConversionCard rate={s.extension.rate} />
        </Section>

        <Section title="Referral" cols={3}>
          <Kpi label="Total referral opportunities" value={n(s.referral.total)} />
          <Kpi label="Referral conversions" value={n(s.referral.conversions)} />
          <ConversionCard rate={s.referral.rate} />
        </Section>

        <Section title="Reactivation" cols={3}>
          <Kpi label="Total reactivation opportunities" value={n(s.reactivation.total)} />
          <Kpi label="Reactivation conversions" value={n(s.reactivation.conversions)} />
          <ConversionCard rate={s.reactivation.rate} />
        </Section>
      </div>
    </>
  )
}

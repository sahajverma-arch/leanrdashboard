'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { NameValue } from '@/lib/dashboard'
import { useTheme } from '@/components/theme-provider'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#db2777', '#7c3aed', '#0891b2']

const fmtINR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const truncate = (v: unknown) => {
  const s = String(v ?? '')
  return s.length > 18 ? s.slice(0, 17) + '…' : s
}

// Grid/axis/tooltip colors that adapt to the active theme. Series colors (the
// brand blue/green/purple) read fine on both backgrounds, so only the chrome
// needs to change.
function useChartColors() {
  const dark = useTheme().theme === 'dark'
  return {
    grid: dark ? '#27272a' : '#eee', // zinc-800 / near-white
    axis: dark ? '#a1a1aa' : '#71717a', // zinc-400 / zinc-500
    tooltip: dark
      ? {
          backgroundColor: '#18181b',
          border: '1px solid #3f3f46',
          borderRadius: 8,
          color: '#ededed',
        }
      : undefined,
    tooltipItem: dark ? { color: '#ededed' } : undefined,
    tooltipLabel: dark ? { color: '#a1a1aa' } : undefined,
  }
}

export function RevenueLineChart({ data }: { data: NameValue[] }) {
  const c = useChartColors()
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: c.axis }} />
        <YAxis tickFormatter={(v) => fmtINR(v)} tick={{ fontSize: 12, fill: c.axis }} width={70} />
        <Tooltip
          formatter={(v) => fmtINR(Number(v))}
          contentStyle={c.tooltip}
          itemStyle={c.tooltipItem}
          labelStyle={c.tooltipLabel}
        />
        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function RevenueBarChart({ data }: { data: NameValue[] }) {
  const c = useChartColors()
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis
          dataKey="name"
          tickFormatter={truncate}
          tick={{ fontSize: 11, fill: c.axis }}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis tickFormatter={(v) => fmtINR(v)} tick={{ fontSize: 12, fill: c.axis }} width={70} />
        <Tooltip
          formatter={(v) => fmtINR(Number(v))}
          contentStyle={c.tooltip}
          itemStyle={c.tooltipItem}
          labelStyle={c.tooltipLabel}
        />
        <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CsatBarChart({ data }: { data: NameValue[] }) {
  const c = useChartColors()
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis
          dataKey="name"
          tickFormatter={truncate}
          tick={{ fontSize: 11, fill: c.axis }}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: c.axis }} width={32} />
        <Tooltip
          formatter={(v) => Number(v).toFixed(2)}
          contentStyle={c.tooltip}
          itemStyle={c.tooltipItem}
          labelStyle={c.tooltipLabel}
        />
        <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CountBarChart({
  data,
  color = '#7c3aed',
}: {
  data: NameValue[]
  color?: string
}) {
  const c = useChartColors()
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis
          dataKey="name"
          tickFormatter={truncate}
          tick={{ fontSize: 11, fill: c.axis }}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: c.axis }} width={32} />
        <Tooltip
          formatter={(v) => Number(v).toLocaleString('en-IN')}
          contentStyle={c.tooltip}
          itemStyle={c.tooltipItem}
          labelStyle={c.tooltipLabel}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CsatLineChart({ data }: { data: NameValue[] }) {
  const c = useChartColors()
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: c.axis }} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: c.axis }} width={32} />
        <Tooltip
          formatter={(v) => Number(v).toFixed(2)}
          contentStyle={c.tooltip}
          itemStyle={c.tooltipItem}
          labelStyle={c.tooltipLabel}
        />
        <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function StatusPieChart({ data }: { data: NameValue[] }) {
  const c = useChartColors()
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={95}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={c.tooltip} itemStyle={c.tooltipItem} labelStyle={c.tooltipLabel} />
        <Legend wrapperStyle={{ fontSize: 12, color: c.axis }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

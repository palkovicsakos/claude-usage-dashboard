'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { type DayStats } from '@/lib/types'
import { formatTokens, formatShortDate } from '@/lib/utils-stats'

interface TokenChartProps {
  days: DayStats[]
}

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const total = payload.reduce((sum, p) => sum + p.value, 0)
  return (
    <div className="bg-[#0F172A] text-white px-3 py-2.5 rounded-lg shadow-lg text-xs min-w-[160px]">
      <p className="text-[#94A3B8] mb-2">{label}</p>
      {[...payload].reverse().map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-[#CBD5E1]">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-mono font-medium">{formatTokens(p.value)}</span>
        </div>
      ))}
      <div className="border-t border-[#334155] mt-2 pt-2 flex justify-between">
        <span className="text-[#94A3B8]">Total</span>
        <span className="font-mono font-semibold">{formatTokens(total)}</span>
      </div>
    </div>
  )
}

const LEGEND_LABELS: Record<string, string> = {
  cache_read: 'Cache Read',
  cache_create: 'Cache Write',
  input_output: 'Input / Output',
}

interface LegendPayloadItem {
  value: string
  color: string
}

function CustomLegend({ payload }: { payload?: LegendPayloadItem[] }) {
  if (!payload) return null
  return (
    <div className="flex items-center justify-center gap-5 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <span
            className="w-2.5 h-2.5 rounded-sm inline-block"
            style={{ background: entry.color }}
          />
          {LEGEND_LABELS[entry.value] ?? entry.value}
        </div>
      ))}
    </div>
  )
}

export function TokenChart({ days }: TokenChartProps) {
  const data = days.map((d) => ({
    date: formatShortDate(d.date),
    cache_read: d.tokens.cache_read,
    cache_create: d.tokens.cache_create,
    input_output: d.tokens.input + d.tokens.output,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#F1F5F9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'var(--font-geist-mono)' }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          tickFormatter={(v: number) => formatTokens(v)}
          tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'var(--font-geist-mono)' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
        <Legend content={<CustomLegend />} />
        <Bar dataKey="cache_read" stackId="a" fill="#BFDBFE" maxBarSize={40} />
        <Bar dataKey="cache_create" stackId="a" fill="#60A5FA" maxBarSize={40} />
        <Bar
          dataKey="input_output"
          stackId="a"
          fill="#2563EB"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

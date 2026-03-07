'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DayStats } from '@/lib/types'
import { formatShortDate } from '@/lib/utils-stats'

interface CostChartProps {
  days: DayStats[]
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.07)',
        fontFamily: 'var(--font-lora), Georgia, serif',
      }}
    >
      <div
        className="text-xs mb-1"
        style={{
          color: '#7C7369',
          fontFamily: 'var(--font-plus-jakarta), sans-serif',
        }}
      >
        {label}
      </div>
      <div
        className="font-bold"
        style={{ color: '#D97757' }}
      >
        ${payload[0].value.toFixed(2)}
      </div>
    </div>
  )
}

export function CostChart({ days }: CostChartProps) {
  const data = days
    .filter((d) => d.cost > 0)
    .map((d) => ({
      date: formatShortDate(d.date),
      cost: d.cost,
    }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#EDE9E4"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: '#7C7369', fontSize: 10, fontFamily: 'sans-serif' }}
          axisLine={{ stroke: '#EDE9E4' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#7C7369', fontSize: 10, fontFamily: 'sans-serif' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(217,119,87,0.06)' }} />
        <Bar
          dataKey="cost"
          fill="#D97757"
          radius={[6, 6, 0, 0]}
          onMouseEnter={(_data, _index, e) => {
            if (e?.target) (e.target as SVGElement).setAttribute('fill', '#C86843')
          }}
          onMouseLeave={(_data, _index, e) => {
            if (e?.target) (e.target as SVGElement).setAttribute('fill', '#D97757')
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

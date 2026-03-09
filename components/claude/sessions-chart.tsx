'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DayStats } from '@/lib/types'
import { formatShortDate } from '@/lib/utils-stats'

interface SessionsChartProps {
  days: DayStats[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#FFFFFF', border: '1px solid #EDE9E4', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'inherit' }}>
      <div style={{ color: '#7C7369', marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#A84F31', fontWeight: 600 }}>{payload[0].value} sessions</div>
    </div>
  )
}

export function SessionsChart({ days }: SessionsChartProps) {
  const data = days.map((d) => ({
    date: formatShortDate(d.date),
    sessions: d.sessions,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="sessGradClaude" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A84F31" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#A84F31" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#B0A9A1', fontSize: 10, fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#B0A9A1', fontSize: 10, fontFamily: 'inherit' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168,79,49,0.05)' }} />
        <Bar dataKey="sessions" fill="url(#sessGradClaude)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

'use client'

import { type HoursBreakdown } from '@/lib/types'
import { formatMinutes } from '@/lib/utils-stats'

interface HoursChartProps {
  hours: HoursBreakdown
}

interface BarRowProps {
  label: string
  minutes: number
  maxMinutes: number
  color: string
  textColor: string
}

function BarRow({ label, minutes, maxMinutes, color, textColor }: BarRowProps) {
  const pct = maxMinutes > 0 ? Math.round((minutes / maxMinutes) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#64748B] w-14 shrink-0 text-right leading-none">{label}</span>
      <div className="flex-1 bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="font-mono text-xs w-20 shrink-0 leading-none"
        style={{ color: textColor }}
      >
        {formatMinutes(minutes)}
      </span>
    </div>
  )
}

export function HoursChart({ hours }: HoursChartProps) {
  const { active_minutes, span_minutes, idle_minutes } = hours
  const max = Math.max(active_minutes, span_minutes, idle_minutes, 1)

  const efficiency =
    span_minutes > 0 ? Math.round((active_minutes / span_minutes) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <BarRow
        label="Active"
        minutes={active_minutes}
        maxMinutes={max}
        color="#2563EB"
        textColor="#2563EB"
      />
      <BarRow
        label="Span"
        minutes={span_minutes}
        maxMinutes={max}
        color="#93C5FD"
        textColor="#0F172A"
      />
      <BarRow
        label="Idle"
        minutes={idle_minutes}
        maxMinutes={max}
        color="#E2E8F0"
        textColor="#94A3B8"
      />

      <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
        <span className="text-xs text-[#64748B]">Efficiency</span>
        <span className="font-mono text-sm font-semibold text-[#0F172A]">
          {efficiency}%
          <span className="text-xs text-[#64748B] font-normal ml-1">active / span</span>
        </span>
      </div>
    </div>
  )
}

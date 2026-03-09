'use client'

import type { HoursBreakdown } from '@/lib/types'
import { formatMinutes } from '@/lib/utils-stats'

interface HoursDisplayProps {
  hours: HoursBreakdown
}

function ArcRow({
  label,
  minutes,
  maxMinutes,
  color,
  trackColor,
}: {
  label: string
  minutes: number
  maxMinutes: number
  color: string
  trackColor: string
}) {
  const pct = maxMinutes > 0 ? Math.min((minutes / maxMinutes) * 100, 100) : 0

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: '#4A5568', letterSpacing: '0.12em' }}
        >
          {label}
        </span>
        <span
          className="text-sm font-mono font-semibold"
          style={{ color: '#E8EDF5' }}
        >
          {formatMinutes(minutes)}
        </span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 6, background: trackColor }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  )
}

export function HoursDisplay({ hours }: HoursDisplayProps) {
  const { active_minutes, span_minutes, idle_minutes } = hours
  const max = span_minutes

  const activeRatio = span_minutes > 0 ? (active_minutes / span_minutes) * 100 : 0

  return (
    <div>
      <ArcRow
        label="Active"
        minutes={active_minutes}
        maxMinutes={max}
        color="#00D4FF"
        trackColor="rgba(0,212,255,0.08)"
      />
      <ArcRow
        label="Span"
        minutes={span_minutes}
        maxMinutes={max}
        color="#7928CA"
        trackColor="rgba(121,40,202,0.12)"
      />
      <ArcRow
        label="Idle"
        minutes={idle_minutes}
        maxMinutes={max}
        color="#4A5568"
        trackColor="rgba(74,85,104,0.15)"
      />

      {/* Efficiency indicator */}
      <div
        className="mt-4 pt-4 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="text-xs uppercase tracking-widest" style={{ color: '#4A5568' }}>
          Efficiency
        </span>
        <div className="flex items-center gap-2">
          <div
            className="w-16 rounded-full overflow-hidden"
            style={{ height: 4, background: 'rgba(0,212,255,0.08)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${activeRatio.toFixed(0)}%`,
                background: 'linear-gradient(90deg, #7928CA, #00D4FF)',
              }}
            />
          </div>
          <span
            className="text-xs font-mono font-semibold"
            style={{ color: '#00D4FF' }}
          >
            {activeRatio.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  )
}

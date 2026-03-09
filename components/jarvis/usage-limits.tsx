'use client'

import type { UsageLimits } from '@/lib/types'
import { formatTokens } from '@/lib/utils-stats'

interface UsageLimitsProps {
  usage: UsageLimits
}

function UsageBar({
  label,
  pct,
  tokens,
  peak,
  subtitle,
  color,
}: {
  label: string
  pct: number
  tokens: number
  peak: number
  subtitle: string
  color: string
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono font-semibold" style={{ color: '#E8EDF5' }}>
          {label}
        </span>
        <span className="text-xs font-mono font-semibold" style={{ color }}>
          {pct}% of peak
        </span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden mb-1"
        style={{ height: 8, background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.max(pct, 1)}%`,
            background: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono" style={{ color: '#4A5568' }}>
          {subtitle}
        </span>
        <span className="text-xs font-mono" style={{ color: '#4A5568' }}>
          {formatTokens(tokens)} / {formatTokens(peak)} peak
        </span>
      </div>
    </div>
  )
}

export function UsageLimitsDisplay({ usage }: UsageLimitsProps) {
  function barColor(pct: number): string {
    if (pct >= 90) return '#F59E0B'
    if (pct >= 60) return '#D97706'
    return '#8B6B15'
  }

  return (
    <div>
      <UsageBar
        label="Current session (last 5h)"
        pct={usage.session_pct}
        tokens={usage.session_tokens}
        peak={usage.peak_day_tokens}
        subtitle="vs your peak day"
        color={barColor(usage.session_pct)}
      />
      <UsageBar
        label="This week — all models"
        pct={usage.week_pct}
        tokens={usage.week_tokens}
        peak={usage.peak_week_tokens}
        subtitle={`Resets ${usage.week_reset}`}
        color={barColor(usage.week_pct)}
      />
      <UsageBar
        label="This week — Sonnet only"
        pct={usage.week_sonnet_pct}
        tokens={usage.week_sonnet_tokens}
        peak={usage.peak_week_tokens}
        subtitle={`Resets ${usage.week_reset}`}
        color={barColor(usage.week_sonnet_pct)}
      />

      <div
        className="mt-3 pt-3 text-xs font-mono"
        style={{ color: '#4A5568', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        % = this period vs your all-time peak week
      </div>
    </div>
  )
}

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
  limit,
  subtitle,
  color,
}: {
  label: string
  pct: number
  tokens: number
  limit: number
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
          {pct}% used
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
          {formatTokens(tokens)} / {formatTokens(limit)}
        </span>
      </div>
    </div>
  )
}

export function UsageLimitsDisplay({ usage }: UsageLimitsProps) {
  const sessionPct = usage.session_pct
  const weekPct = usage.week_pct
  const sonnetPct = usage.week_sonnet_pct

  function barColor(pct: number): string {
    if (pct >= 80) return '#FF4444'
    if (pct >= 60) return '#F0A500'
    return '#00D4FF'
  }

  return (
    <div>
      <UsageBar
        label="Current session (last 5h)"
        pct={sessionPct}
        tokens={usage.session_tokens}
        limit={usage.limits.session_tokens}
        subtitle="5-hour rolling window"
        color={barColor(sessionPct)}
      />
      <UsageBar
        label="Current week — all models"
        pct={weekPct}
        tokens={usage.week_tokens}
        limit={usage.limits.week_all_tokens}
        subtitle={`Resets ${usage.week_reset}`}
        color={barColor(weekPct)}
      />
      <UsageBar
        label="Current week — Sonnet only"
        pct={sonnetPct}
        tokens={usage.week_sonnet_tokens}
        limit={usage.limits.week_sonnet_tokens}
        subtitle={`Resets ${usage.week_reset}`}
        color={barColor(sonnetPct)}
      />

      <div
        className="mt-3 pt-3 text-xs font-mono"
        style={{ color: '#4A5568', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        Limits are approximate (Claude Max plan). Regenerate stats to refresh.
      </div>
    </div>
  )
}

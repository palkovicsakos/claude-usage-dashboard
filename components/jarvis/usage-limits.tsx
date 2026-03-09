'use client'

import type { UsageLimits } from '@/lib/types'
import { formatTokens } from '@/lib/utils-stats'
import { T, type Lang } from '@/lib/i18n'

interface UsageLimitsProps {
  usage: UsageLimits
  lang?: Lang
}

function UsageBar({ label, pct, tokens, peak, subtitle, color, ofPeak }: {
  label: string; pct: number; tokens: number; peak: number; subtitle: string; color: string; ofPeak: string
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono font-semibold" style={{ color: '#E8EDF5' }}>{label}</span>
        <span className="text-xs font-mono font-semibold" style={{ color }}>{pct}% {ofPeak}</span>
      </div>
      <div className="w-full rounded-full overflow-hidden mb-1" style={{ height: 8, background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 1)}%`, background: color, boxShadow: `0 0 8px ${color}66` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono" style={{ color: '#4A5568' }}>{subtitle}</span>
        <span className="text-xs font-mono" style={{ color: '#4A5568' }}>{formatTokens(tokens)} / {formatTokens(peak)} peak</span>
      </div>
    </div>
  )
}

export function UsageLimitsDisplay({ usage, lang = 'en' }: UsageLimitsProps) {
  const t = T[lang]

  function formatNum(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return Math.round(n / 1_000) + 'K'
    return String(n)
  }

  function barColor(pct: number): string {
    if (pct >= 90) return '#00D4FF'
    if (pct >= 60) return '#7928CA'
    return '#4A0E8F'
  }

  return (
    <div>
      <UsageBar label={t.sessionLabel} pct={usage.session_pct} tokens={usage.session_tokens} peak={usage.peak_day_tokens} subtitle={t.sessionSub} color={barColor(usage.session_pct)} ofPeak={t.ofPeak.replace('% ', '')} />
      <UsageBar label={t.weekAllLabel} pct={usage.week_pct} tokens={usage.week_tokens} peak={usage.peak_week_tokens} subtitle={`${t.resets} ${usage.week_reset}`} color={barColor(usage.week_pct)} ofPeak={t.ofPeak.replace('% ', '')} />
      <UsageBar label={t.weekSonnetLabel} pct={usage.week_sonnet_pct} tokens={usage.week_sonnet_tokens} peak={usage.peak_week_tokens} subtitle={`${t.resets} ${usage.week_reset}`} color={barColor(usage.week_sonnet_pct)} ofPeak={t.ofPeak.replace('% ', '')} />

      {/* Stats from /usage cache */}
      {(usage.total_messages != null || usage.total_sessions_cache != null) && (
        <div className="mt-4 pt-3 grid grid-cols-2 gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {usage.total_messages != null && (
            <div>
              <div className="text-xs font-mono mb-0.5" style={{ color: '#4A5568' }}>Total messages</div>
              <div className="text-sm font-mono font-semibold" style={{ color: '#E8EDF5' }}>{formatNum(usage.total_messages)}</div>
            </div>
          )}
          {usage.total_sessions_cache != null && (
            <div>
              <div className="text-xs font-mono mb-0.5" style={{ color: '#4A5568' }}>Total sessions</div>
              <div className="text-sm font-mono font-semibold" style={{ color: '#E8EDF5' }}>{formatNum(usage.total_sessions_cache)}</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 text-xs font-mono" style={{ color: '#4A5568', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {t.usageFooter}
      </div>
    </div>
  )
}

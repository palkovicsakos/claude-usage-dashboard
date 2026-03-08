'use client'

import { useState, useMemo } from 'react'
import { Space_Mono, IBM_Plex_Sans } from 'next/font/google'
import Link from 'next/link'
import statsData from '@/data/stats.json'
import type { StatsData, PeriodStats, DayStats } from '@/lib/types'
import { formatCost, formatTokens, formatMinutes } from '@/lib/utils-stats'
import { MetricCard } from '@/components/jarvis/metric-card'
import { CostChart } from '@/components/jarvis/cost-chart'
import { TokenChart } from '@/components/jarvis/token-chart'
import { HoursDisplay } from '@/components/jarvis/hours-display'
import { ProjectTable } from '@/components/jarvis/project-table'

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
})

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex',
})

type Period = 'today' | 'daily' | 'weekly' | 'monthly' | 'all_time' | 'custom'

const PRESET_PERIODS: Exclude<Period, 'custom'>[] = ['today', 'daily', 'weekly', 'monthly', 'all_time']

const PERIOD_LABELS: Record<Exclude<Period, 'custom'>, string> = {
  today: 'TODAY',
  daily: '7D',
  weekly: '4W',
  monthly: '6M',
  all_time: 'ALL',
}

function buildPeriodFromDays(days: DayStats[]): PeriodStats {
  const totals = days.reduce(
    (acc, d) => {
      acc.cost += d.cost
      acc.tokens.input += d.tokens.input
      acc.tokens.output += d.tokens.output
      acc.tokens.cache_create += d.tokens.cache_create
      acc.tokens.cache_read += d.tokens.cache_read
      acc.tokens.total += d.tokens.total
      acc.hours.active_minutes += d.hours.active_minutes
      acc.hours.span_minutes += d.hours.span_minutes
      acc.hours.idle_minutes += d.hours.idle_minutes
      acc.sessions += d.sessions
      return acc
    },
    {
      cost: 0,
      tokens: { input: 0, output: 0, cache_create: 0, cache_read: 0, total: 0 },
      hours: { active_minutes: 0, span_minutes: 0, idle_minutes: 0 },
      sessions: 0,
    }
  )
  return { ...totals, cost_delta: null, days }
}

const stats = statsData as StatsData

export default function JarvisPage() {
  const [period, setPeriod] = useState<Period>('daily')
  const todayStr = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(todayStr)
  const [dateTo, setDateTo] = useState(todayStr)

  const data: PeriodStats = useMemo(() => {
    if (period === 'custom') {
      const filtered = (stats.all_time.days as DayStats[]).filter(
        (d) => d.date >= dateFrom && d.date <= dateTo
      )
      return buildPeriodFromDays(filtered)
    }
    return stats[period]
  }, [period, dateFrom, dateTo])

  return (
    <div
      className={`${spaceMono.variable} ${ibmPlexSans.variable} min-h-screen`}
      style={{
        background: '#060608',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        fontFamily: 'var(--font-ibm-plex), sans-serif',
        color: '#E8EDF5',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-0">
          <h1
            className="text-lg font-bold tracking-widest select-none"
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              color: '#E8EDF5',
              letterSpacing: '0.2em',
            }}
          >
            ⬡ JARVIS STATS
          </h1>

          <div className="flex items-center gap-3">
            {/* Status badge */}
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-mono tracking-widest"
              style={{
                background: 'rgba(0,212,255,0.07)',
                border: '1px solid rgba(0,212,255,0.2)',
                color: '#00D4FF',
              }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: '#00D4FF',
                  boxShadow: '0 0 6px #00D4FF',
                  animation: 'pulse 2s infinite',
                }}
              />
              SYS: ONLINE
            </div>

            {/* Theme toggle */}
            <Link
              href="/meridian"
              className="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-mono tracking-widest transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#4A5568',
                fontFamily: 'var(--font-space-mono), monospace',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(0,212,255,0.3)'
                el.style.color = '#00D4FF'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.color = '#4A5568'
              }}
            >
              ⇄ MERIDIAN
            </Link>
          </div>
        </div>

        {/* ── Cyan divider ── */}
        <div
          className="my-4 w-full"
          style={{
            height: 1,
            background: 'linear-gradient(90deg, #00D4FF 0%, rgba(0,212,255,0.15) 60%, transparent 100%)',
          }}
        />

        {/* ── Period selector ── */}
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {PRESET_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="relative px-4 py-1.5 text-xs font-mono tracking-widest transition-all duration-200 rounded-sm"
              style={{
                fontFamily: 'var(--font-space-mono), monospace',
                background: period === p ? 'rgba(0,212,255,0.08)' : 'transparent',
                color: period === p ? '#00D4FF' : '#4A5568',
                border: period === p ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
                letterSpacing: '0.15em',
              }}
            >
              {PERIOD_LABELS[p]}
              {period === p && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4"
                  style={{
                    height: 2,
                    background: '#00D4FF',
                    boxShadow: '0 0 6px #00D4FF',
                    borderRadius: 1,
                  }}
                />
              )}
            </button>
          ))}

          {/* Custom range button */}
          <button
            onClick={() => setPeriod('custom')}
            className="relative px-4 py-1.5 text-xs font-mono tracking-widest transition-all duration-200 rounded-sm"
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              background: period === 'custom' ? 'rgba(0,212,255,0.08)' : 'transparent',
              color: period === 'custom' ? '#00D4FF' : '#4A5568',
              border: period === 'custom' ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
              letterSpacing: '0.15em',
            }}
          >
            RANGE
            {period === 'custom' && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4"
                style={{
                  height: 2,
                  background: '#00D4FF',
                  boxShadow: '0 0 6px #00D4FF',
                  borderRadius: 1,
                }}
              />
            )}
          </button>

          <span
            className="ml-auto text-xs font-mono"
            style={{ color: '#4A5568', fontFamily: 'var(--font-space-mono), monospace' }}
          >
            LAST SYNC: {new Date(stats.generated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* ── Custom date range inputs ── */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 mb-6">
            <span
              className="text-xs font-mono tracking-widest"
              style={{ color: '#4A5568', fontFamily: 'var(--font-space-mono), monospace' }}
            >
              FROM
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              min={stats.meta.first_session}
              max={dateTo}
              className="text-xs font-mono rounded-sm px-3 py-1.5 outline-none"
              style={{
                fontFamily: 'var(--font-space-mono), monospace',
                background: '#0D0D14',
                border: '1px solid rgba(0,212,255,0.2)',
                color: '#00D4FF',
                letterSpacing: '0.05em',
                colorScheme: 'dark',
              }}
            />
            <span
              className="text-xs font-mono tracking-widest"
              style={{ color: '#4A5568', fontFamily: 'var(--font-space-mono), monospace' }}
            >
              TO
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom}
              max={todayStr}
              className="text-xs font-mono rounded-sm px-3 py-1.5 outline-none"
              style={{
                fontFamily: 'var(--font-space-mono), monospace',
                background: '#0D0D14',
                border: '1px solid rgba(0,212,255,0.2)',
                color: '#00D4FF',
                letterSpacing: '0.05em',
                colorScheme: 'dark',
              }}
            />
            <span
              className="text-xs font-mono"
              style={{ color: '#4A5568', fontFamily: 'var(--font-space-mono), monospace' }}
            >
              {data.days.length} day{data.days.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        )}

        {period !== 'custom' && <div className="mb-6" />}

        {/* ── Metric cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard
            title="Total Cost"
            value={formatCost(data.cost)}
            subtitle="period"
            delta={data.cost_delta}
          />
          <MetricCard
            title="Active Hours"
            value={formatMinutes(data.hours.active_minutes)}
            subtitle={`span: ${formatMinutes(data.hours.span_minutes)}`}
          />
          <MetricCard
            title="Sessions"
            value={String(data.sessions)}
            subtitle={`across ${stats.meta.total_projects} projects`}
          />
          <MetricCard
            title="Total Tokens"
            value={formatTokens(data.tokens.total)}
            subtitle={`cache: ${Math.round((data.tokens.cache_read / (data.tokens.total || 1)) * 100)}% read`}
          />
        </div>

        {/* ── Charts row 1 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* Cost Timeline */}
          <div
            className="rounded-sm p-5"
            style={{
              background: '#0D0D14',
              border: '1px solid rgba(0,212,255,0.13)',
              boxShadow: '0 0 20px rgba(0,212,255,0.07)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p
                className="text-xs uppercase tracking-widest"
                style={{
                  color: '#4A5568',
                  fontFamily: 'var(--font-space-mono), monospace',
                  letterSpacing: '0.15em',
                }}
              >
                Cost Timeline
              </p>
              <span
                className="text-xs font-mono"
                style={{ color: '#00D4FF' }}
              >
                USD / period
              </span>
            </div>
            <CostChart days={data.days} />
          </div>

          {/* Token Breakdown */}
          <div
            className="rounded-sm p-5"
            style={{
              background: '#0D0D14',
              border: '1px solid rgba(0,212,255,0.13)',
              boxShadow: '0 0 20px rgba(0,212,255,0.07)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p
                className="text-xs uppercase tracking-widest"
                style={{
                  color: '#4A5568',
                  fontFamily: 'var(--font-space-mono), monospace',
                  letterSpacing: '0.15em',
                }}
              >
                Token Breakdown
              </p>
              <span className="text-xs font-mono" style={{ color: '#7928CA' }}>
                stacked
              </span>
            </div>
            <TokenChart days={data.days} />
          </div>
        </div>

        {/* ── Charts row 2 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {/* Working Hours */}
          <div
            className="rounded-sm p-5"
            style={{
              background: '#0D0D14',
              border: '1px solid rgba(0,212,255,0.13)',
              boxShadow: '0 0 20px rgba(0,212,255,0.07)',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <p
                className="text-xs uppercase tracking-widest"
                style={{
                  color: '#4A5568',
                  fontFamily: 'var(--font-space-mono), monospace',
                  letterSpacing: '0.15em',
                }}
              >
                Working Hours
              </p>
              <span
                className="text-xs font-mono"
                style={{ color: '#4A5568' }}
              >
                {period === 'custom' ? 'RANGE' : PERIOD_LABELS[period]}
              </span>
            </div>
            <HoursDisplay hours={data.hours} />
          </div>

          {/* Project Matrix */}
          <div
            className="rounded-sm p-5"
            style={{
              background: '#0D0D14',
              border: '1px solid rgba(0,212,255,0.13)',
              boxShadow: '0 0 20px rgba(0,212,255,0.07)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p
                className="text-xs uppercase tracking-widest"
                style={{
                  color: '#4A5568',
                  fontFamily: 'var(--font-space-mono), monospace',
                  letterSpacing: '0.15em',
                }}
              >
                Project Matrix
              </p>
              <span
                className="text-xs font-mono"
                style={{ color: '#4A5568' }}
              >
                {stats.meta.total_projects} total
              </span>
            </div>
            <ProjectTable projects={stats.projects} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <span
            className="text-xs font-mono"
            style={{
              color: '#4A5568',
              fontFamily: 'var(--font-space-mono), monospace',
            }}
          >
            CLAUDE CODE // SWEY INNOVATIONS
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: '#4A5568' }}
          >
            {stats.meta.first_session} → {stats.meta.last_session}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

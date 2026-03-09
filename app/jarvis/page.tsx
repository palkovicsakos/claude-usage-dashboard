'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Space_Mono, IBM_Plex_Sans } from 'next/font/google'
import Link from 'next/link'
import type { StatsData, PeriodStats, DayStats } from '@/lib/types'
import { formatCost, formatTokens, formatMinutes } from '@/lib/utils-stats'
import { MetricCard } from '@/components/jarvis/metric-card'
import { CostChart } from '@/components/jarvis/cost-chart'
import { TokenChart } from '@/components/jarvis/token-chart'
import { HoursChart } from '@/components/jarvis/hours-chart'
import { SessionsChart } from '@/components/jarvis/sessions-chart'
import { HoursDisplay } from '@/components/jarvis/hours-display'
import { ProjectTable } from '@/components/jarvis/project-table'
import { ActivityHeatmap } from '@/components/jarvis/activity-heatmap'
import { ModelsBreakdown } from '@/components/jarvis/models-breakdown'
import { UsageLimitsDisplay } from '@/components/jarvis/usage-limits'

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

function computeStreaks(days: DayStats[]): { longest: number; current: number } {
  const activeDates = new Set(days.filter(d => d.cost > 0).map(d => d.date))
  const sorted = [...activeDates].sort()
  if (sorted.length === 0) return { longest: 0, current: 0 }

  let longest = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00')
    const next = new Date(sorted[i] + 'T00:00:00')
    const diff = (next.getTime() - prev.getTime()) / 86400000
    if (diff === 1) { cur++; longest = Math.max(longest, cur) }
    else cur = 1
  }

  // Current streak from today backwards
  const today = new Date().toISOString().split('T')[0]
  let currentStreak = 0
  const check = new Date(today + 'T00:00:00')
  while (activeDates.has(check.toISOString().split('T')[0])) {
    currentStreak++
    check.setDate(check.getDate() - 1)
  }

  return { longest, current: currentStreak }
}

const CARD_STYLE = {
  background: '#0D0D14',
  border: '1px solid rgba(245,158,11,0.13)',
  boxShadow: '0 0 20px rgba(245,158,11,0.07)',
}

const SECTION_TITLE_STYLE = {
  color: '#4A5568',
  fontFamily: 'var(--font-space-mono), monospace',
  letterSpacing: '0.15em',
}

export default function JarvisPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [period, setPeriod] = useState<Period>('daily')
  const todayStr = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(todayStr)
  const [dateTo, setDateTo] = useState(todayStr)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      setStats(data)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      const res = await fetch('/api/refresh', { method: 'POST' })
      const json = await res.json()
      if (json.ok) {
        await fetchStats()
        setRefreshMsg('Refreshed')
      } else {
        setRefreshMsg('Error: ' + json.error)
      }
    } catch (e) {
      setRefreshMsg('Failed')
    } finally {
      setRefreshing(false)
      setTimeout(() => setRefreshMsg(null), 3000)
    }
  }

  const data: PeriodStats | null = useMemo(() => {
    if (!stats) return null
    if (period === 'custom') {
      const filtered = (stats.all_time.days as DayStats[]).filter(
        (d) => d.date >= dateFrom && d.date <= dateTo
      )
      return buildPeriodFromDays(filtered)
    }
    return stats[period]
  }, [stats, period, dateFrom, dateTo])

  const streaks = useMemo(() => {
    if (!stats) return { longest: 0, current: 0 }
    return computeStreaks(stats.all_time.days)
  }, [stats])

  const favoriteModel = useMemo(() => {
    if (!stats?.model_breakdown) return undefined
    const entries = Object.entries(stats.model_breakdown)
    if (!entries.length) return undefined
    return entries.sort((a, b) => b[1].total - a[1].total)[0][0]
  }, [stats])

  if (!stats || !data) {
    return (
      <div className={`${spaceMono.variable} ${ibmPlexSans.variable} min-h-screen flex items-center justify-center`}
        style={{ background: '#060608', color: '#4A5568', fontFamily: 'var(--font-space-mono), monospace', fontSize: 12 }}>
        LOADING...
      </div>
    )
  }

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
          <div className="flex items-center gap-3">
            {/* Claude logo mark */}
            <div
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(217,119,6,0.4)',
                fontSize: 14, fontWeight: 700, color: '#000', flexShrink: 0,
              }}
            >
              C
            </div>
            <h1
              className="text-lg font-bold tracking-widest select-none"
              style={{ fontFamily: 'var(--font-space-mono), monospace', color: '#E8EDF5', letterSpacing: '0.2em' }}
            >
              CLAUDE STATS
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-mono tracking-widest transition-all duration-200"
              style={{
                fontFamily: 'var(--font-space-mono), monospace',
                background: refreshing ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                border: refreshing ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: refreshing ? '#F59E0B' : '#4A5568',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                letterSpacing: '0.1em',
              }}
              onMouseEnter={(e) => {
                if (!refreshing) {
                  const el = e.currentTarget
                  el.style.borderColor = 'rgba(245,158,11,0.3)'
                  el.style.color = '#F59E0B'
                }
              }}
              onMouseLeave={(e) => {
                if (!refreshing) {
                  const el = e.currentTarget
                  el.style.borderColor = 'rgba(255,255,255,0.08)'
                  el.style.color = '#4A5568'
                }
              }}
            >
              {refreshing ? '⟳ SYNCING...' : refreshMsg ? `✓ ${refreshMsg}` : '⟳ REFRESH'}
            </button>

            {/* Status badge */}
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-mono tracking-widest"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: '#F59E0B', boxShadow: '0 0 6px #F59E0B', animation: 'pulse 2s infinite' }}
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
                el.style.borderColor = 'rgba(245,158,11,0.3)'
                el.style.color = '#F59E0B'
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
          style={{ height: 1, background: 'linear-gradient(90deg, #F59E0B 0%, rgba(245,158,11,0.15) 60%, transparent 100%)' }}
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
                background: period === p ? 'rgba(245,158,11,0.08)' : 'transparent',
                color: period === p ? '#F59E0B' : '#4A5568',
                border: period === p ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                letterSpacing: '0.15em',
              }}
            >
              {PERIOD_LABELS[p]}
              {period === p && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4"
                  style={{ height: 2, background: '#F59E0B', boxShadow: '0 0 6px #F59E0B', borderRadius: 1 }} />
              )}
            </button>
          ))}
          <button
            onClick={() => setPeriod('custom')}
            className="relative px-4 py-1.5 text-xs font-mono tracking-widest transition-all duration-200 rounded-sm"
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              background: period === 'custom' ? 'rgba(245,158,11,0.08)' : 'transparent',
              color: period === 'custom' ? '#F59E0B' : '#4A5568',
              border: period === 'custom' ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
              letterSpacing: '0.15em',
            }}
          >
            RANGE
            {period === 'custom' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4"
                style={{ height: 2, background: '#F59E0B', boxShadow: '0 0 6px #F59E0B', borderRadius: 1 }} />
            )}
          </button>

          <span className="ml-auto text-xs font-mono" style={{ color: '#4A5568', fontFamily: 'var(--font-space-mono), monospace' }}>
            LAST SYNC: {new Date(stats.generated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* ── Custom date range inputs ── */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-mono tracking-widest" style={{ color: '#4A5568', fontFamily: 'var(--font-space-mono), monospace' }}>FROM</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              min={stats.meta.first_session}
              max={dateTo}
              className="text-xs font-mono rounded-sm px-3 py-1.5 outline-none"
              style={{ fontFamily: 'var(--font-space-mono), monospace', background: '#0D0D14', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', letterSpacing: '0.05em', colorScheme: 'dark' }}
            />
            <span className="text-xs font-mono tracking-widest" style={{ color: '#4A5568', fontFamily: 'var(--font-space-mono), monospace' }}>TO</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom}
              max={todayStr}
              className="text-xs font-mono rounded-sm px-3 py-1.5 outline-none"
              style={{ fontFamily: 'var(--font-space-mono), monospace', background: '#0D0D14', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', letterSpacing: '0.05em', colorScheme: 'dark' }}
            />
            <span className="text-xs font-mono" style={{ color: '#4A5568', fontFamily: 'var(--font-space-mono), monospace' }}>
              {data.days.length} day{data.days.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        )}
        {period !== 'custom' && <div className="mb-6" />}

        {/* ── Metric cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard title="Total Cost" value={formatCost(data.cost)} subtitle="period" delta={data.cost_delta} />
          <MetricCard title="Active Hours" value={formatMinutes(data.hours.active_minutes)} subtitle={`span: ${formatMinutes(data.hours.span_minutes)}`} />
          <MetricCard title="Sessions" value={String(data.sessions)} subtitle={`across ${stats.meta.total_projects} projects`} />
          <MetricCard title="Total Tokens" value={formatTokens(data.tokens.total)} subtitle={`cache: ${Math.round((data.tokens.cache_read / (data.tokens.total || 1)) * 100)}% read`} />
        </div>

        {/* ── Charts row 1: Cost + Token ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="rounded-sm p-5" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={SECTION_TITLE_STYLE}>Cost Timeline</p>
              <span className="text-xs font-mono" style={{ color: '#F59E0B' }}>USD / period</span>
            </div>
            <CostChart days={data.days} />
          </div>
          <div className="rounded-sm p-5" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={SECTION_TITLE_STYLE}>Token Breakdown</p>
              <span className="text-xs font-mono" style={{ color: '#D97706' }}>stacked</span>
            </div>
            <TokenChart days={data.days} />
          </div>
        </div>

        {/* ── Charts row 2: Hours + Sessions ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="rounded-sm p-5" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={SECTION_TITLE_STYLE}>Active Hours</p>
              <span className="text-xs font-mono" style={{ color: '#F59E0B' }}>per day</span>
            </div>
            <HoursChart days={data.days} />
          </div>
          <div className="rounded-sm p-5" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={SECTION_TITLE_STYLE}>Sessions</p>
              <span className="text-xs font-mono" style={{ color: '#D97706' }}>per day</span>
            </div>
            <SessionsChart days={data.days} />
          </div>
        </div>

        {/* ── Activity Heatmap ── */}
        <div className="rounded-sm p-5 mb-3" style={CARD_STYLE}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-widest" style={SECTION_TITLE_STYLE}>Activity Overview</p>
            <span className="text-xs font-mono" style={{ color: '#4A5568' }}>
              {stats.meta.first_session} → {stats.meta.last_session}
            </span>
          </div>
          <ActivityHeatmap
            days={stats.all_time.days}
            totalSessions={stats.all_time.sessions}
            totalDays={stats.all_time.days.length}
            favoriteModel={favoriteModel}
            totalTokens={stats.all_time.tokens.total}
            longestStreak={streaks.longest}
            currentStreak={streaks.current}
          />
        </div>

        {/* ── Charts row 3: Working Hours breakdown + Project Matrix ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="rounded-sm p-5" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs uppercase tracking-widest" style={SECTION_TITLE_STYLE}>Working Hours</p>
              <span className="text-xs font-mono" style={{ color: '#4A5568' }}>
                {period === 'custom' ? 'RANGE' : PERIOD_LABELS[period]}
              </span>
            </div>
            <HoursDisplay hours={data.hours} />
          </div>
          <div className="rounded-sm p-5" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={SECTION_TITLE_STYLE}>Project Matrix</p>
              <span className="text-xs font-mono" style={{ color: '#4A5568' }}>{stats.meta.total_projects} total</span>
            </div>
            <ProjectTable projects={stats.projects} />
          </div>
        </div>

        {/* ── Models breakdown + Usage limits ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="rounded-sm p-5" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={SECTION_TITLE_STYLE}>Models</p>
              <span className="text-xs font-mono" style={{ color: '#4A5568' }}>tokens per day</span>
            </div>
            <ModelsBreakdown
              days={period === 'all_time' ? stats.all_time.days : data.days}
              modelBreakdown={stats.model_breakdown}
            />
          </div>
          <div className="rounded-sm p-5" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={SECTION_TITLE_STYLE}>/usage — Weekly Limits</p>
              <span className="text-xs font-mono" style={{ color: '#4A5568' }}>Claude Max</span>
            </div>
            <UsageLimitsDisplay usage={stats.usage} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-xs font-mono" style={{ color: '#4A5568', fontFamily: 'var(--font-space-mono), monospace' }}>
            CLAUDE CODE // SWEY INNOVATIONS
          </span>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>
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

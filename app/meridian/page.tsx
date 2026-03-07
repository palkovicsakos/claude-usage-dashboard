'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DollarSign, Clock, Layers, Hash, Sun, Moon } from 'lucide-react'

import stats from '@/data/stats.json'
import { type StatsData, type PeriodStats } from '@/lib/types'
import { formatCost, formatTokens, formatMinutes } from '@/lib/utils-stats'

import { MetricCard } from '@/components/meridian/metric-card'
import { CostChart } from '@/components/meridian/cost-chart'
import { TokenChart } from '@/components/meridian/token-chart'
import { HoursChart } from '@/components/meridian/hours-chart'
import { ProjectTable } from '@/components/meridian/project-table'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const typedStats = stats as StatsData

type PeriodKey = 'daily' | 'weekly' | 'monthly' | 'all_time'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'all_time', label: 'All Time' },
]

export default function MeridianPage() {
  const [period, setPeriod] = useState<PeriodKey>('daily')
  const [dark, setDark] = useState(false)

  const data: PeriodStats = typedStats[period]

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: dark ? '#0F172A' : '#F8FAFC', color: dark ? '#F1F5F9' : '#0F172A' }}
    >
      {/* Header */}
      <header
        className="border-b sticky top-0 z-10"
        style={{
          background: dark ? '#1E293B' : '#FFFFFF',
          borderColor: dark ? '#334155' : '#E2E8F0',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#2563EB] flex items-center justify-center">
              <span className="text-white text-xs font-bold font-mono">C</span>
            </div>
            <span
              className="font-mono text-sm font-semibold tracking-tight"
              style={{ color: dark ? '#F1F5F9' : '#0F172A' }}
            >
              claude-stats
            </span>
            <span
              className="hidden sm:inline text-xs font-mono px-1.5 py-0.5 rounded"
              style={{
                background: dark ? '#1E3A5F' : '#DBEAFE',
                color: '#2563EB',
              }}
            >
              meridian
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jarvis"
              className="text-xs font-medium transition-colors"
              style={{ color: dark ? '#94A3B8' : '#64748B' }}
            >
              Jarvis variant
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <button
              onClick={() => setDark((d) => !d)}
              className="p-1.5 rounded-lg transition-colors hover:opacity-80"
              style={{
                background: dark ? '#334155' : '#F1F5F9',
                color: dark ? '#94A3B8' : '#64748B',
              }}
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Period tabs */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-lg font-semibold tracking-tight"
              style={{ color: dark ? '#F1F5F9' : '#0F172A' }}
            >
              Usage Overview
            </h1>
            <p className="text-xs mt-0.5" style={{ color: dark ? '#94A3B8' : '#64748B' }}>
              {typedStats.meta.first_session} — {typedStats.meta.last_session} &middot;{' '}
              {typedStats.meta.total_projects} projects
            </p>
          </div>

          <div
            className="flex items-center rounded-lg p-1 gap-0.5"
            style={{ background: dark ? '#1E293B' : '#F1F5F9', border: `1px solid ${dark ? '#334155' : '#E2E8F0'}` }}
          >
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={
                  period === key
                    ? {
                        background: dark ? '#2563EB' : '#FFFFFF',
                        color: dark ? '#FFFFFF' : '#0F172A',
                        boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                      }
                    : {
                        background: 'transparent',
                        color: dark ? '#94A3B8' : '#64748B',
                      }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            title="Total Cost"
            value={formatCost(data.cost)}
            subtitle={`${data.sessions} sessions`}
            delta={data.cost_delta}
            icon={DollarSign}
          />
          <MetricCard
            title="Active Hours"
            value={formatMinutes(data.hours.active_minutes)}
            subtitle={`Span: ${formatMinutes(data.hours.span_minutes)}`}
            icon={Clock}
          />
          <MetricCard
            title="Sessions"
            value={String(data.sessions)}
            subtitle={`${typedStats.meta.total_projects} projects total`}
            icon={Layers}
          />
          <MetricCard
            title="Total Tokens"
            value={formatTokens(data.tokens.total)}
            subtitle={`Cache: ${formatTokens(data.tokens.cache_read + data.tokens.cache_create)}`}
            icon={Hash}
          />
        </div>

        {/* Charts row 1: Cost + Token breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Cost over time" dark={dark}>
            <CostChart days={data.days} />
          </ChartCard>
          <ChartCard title="Token breakdown" dark={dark}>
            <TokenChart days={data.days} />
          </ChartCard>
        </div>

        {/* Charts row 2: Hours + Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Working hours"
            subtitle="Active vs total span vs idle"
            dark={dark}
          >
            <div className="px-1 pt-2">
              <HoursChart hours={data.hours} />
            </div>
          </ChartCard>
          <ChartCard
            title="Project breakdown"
            subtitle={`${typedStats.projects.length} projects, sorted by cost`}
            dark={dark}
            noPadding
          >
            <ProjectTable projects={typedStats.projects} />
          </ChartCard>
        </div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Internal ChartCard helper                                           */
/* ------------------------------------------------------------------ */
interface ChartCardProps {
  title: string
  subtitle?: string
  dark?: boolean
  noPadding?: boolean
  children: React.ReactNode
}

function ChartCard({ title, subtitle, dark, noPadding, children }: ChartCardProps) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: dark ? '#1E293B' : '#FFFFFF',
        borderColor: dark ? '#334155' : '#E2E8F0',
      }}
    >
      <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: dark ? '#334155' : '#F1F5F9' }}>
        <h3
          className="text-sm font-semibold"
          style={{ color: dark ? '#F1F5F9' : '#0F172A' }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: dark ? '#94A3B8' : '#64748B' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className={noPadding ? '' : 'px-4 pt-4 pb-3'}>{children}</div>
    </div>
  )
}

'use client'

import { useMemo } from 'react'
import type { DayStats } from '@/lib/types'

interface ActivityHeatmapProps {
  days: DayStats[]
  totalSessions: number
  totalDays: number
  favoriteModel?: string
  totalTokens: number
  longestStreak: number
  currentStreak: number
}

function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const diff = d.getTime() - startOfWeek1.getTime()
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
}

function getMonthLabel(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  return (d.getDay() + 6) % 7 // 0=Mon, 6=Sun
}

function formatTokensShort(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

export function ActivityHeatmap({ days, totalSessions, totalDays, favoriteModel, totalTokens, longestStreak, currentStreak }: ActivityHeatmapProps) {
  const { cells, weeks, maxCost, monthLabels, activeDays } = useMemo(() => {
    // Build a map of date → cost
    const dateMap: Record<string, number> = {}
    for (const d of days) {
      dateMap[d.date] = (dateMap[d.date] || 0) + d.cost
    }

    // Build 52-week grid ending today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDow = (today.getDay() + 6) % 7 // Mon=0
    // Start from 52 weeks ago, beginning of that Monday
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 52 * 7 - todayDow)

    const cells: { date: string; cost: number; dow: number; week: number }[] = []
    let week = 0
    const cur = new Date(startDate)

    while (cur <= today) {
      const dateStr = cur.toISOString().split('T')[0]
      const dow = (cur.getDay() + 6) % 7
      if (dow === 0 && cells.length > 0) week++
      cells.push({ date: dateStr, cost: dateMap[dateStr] || 0, dow, week })
      cur.setDate(cur.getDate() + 1)
    }

    const maxCost = Math.max(...cells.map(c => c.cost), 0.01)
    const totalWeeks = week + 1

    // Month labels: find first cell of each month
    const seen = new Set<string>()
    const monthLabels: { week: number; label: string }[] = []
    for (const cell of cells) {
      const month = cell.date.substring(0, 7)
      if (!seen.has(month)) {
        seen.add(month)
        monthLabels.push({ week: cell.week, label: getMonthLabel(cell.date) })
      }
    }

    const activeDays = cells.filter(c => c.cost > 0).length

    return { cells, weeks: totalWeeks, maxCost, monthLabels, activeDays }
  }, [days])

  function getCellColor(cost: number): string {
    if (cost === 0) return 'rgba(0,212,255,0.04)'
    const intensity = cost / maxCost
    if (intensity < 0.2) return 'rgba(0,212,255,0.15)'
    if (intensity < 0.4) return 'rgba(0,212,255,0.3)'
    if (intensity < 0.6) return 'rgba(0,212,255,0.5)'
    if (intensity < 0.8) return 'rgba(0,212,255,0.7)'
    return '#00D4FF'
  }

  const CELL = 12
  const GAP = 2
  const DOW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

  // Compute streaks
  const sortedDates = days.map(d => d.date).sort()
  const dateSet = new Set(sortedDates)

  return (
    <div>
      {/* Month labels */}
      <div className="flex gap-px mb-1 ml-8" style={{ gap: GAP }}>
        {Array.from({ length: weeks }, (_, w) => {
          const label = monthLabels.find(m => m.week === w)
          return (
            <div key={w} style={{ width: CELL, fontSize: 9, color: '#4A5568', fontFamily: 'monospace', flexShrink: 0 }}>
              {label ? label.label : ''}
            </div>
          )
        })}
      </div>

      {/* Grid: 7 rows (Mon–Sun) × N weeks */}
      <div className="flex gap-px" style={{ gap: GAP }}>
        {/* Day labels */}
        <div className="flex flex-col mr-1" style={{ gap: GAP }}>
          {DOW_LABELS.map((label, i) => (
            <div
              key={i}
              style={{ width: 24, height: CELL, fontSize: 9, color: '#4A5568', fontFamily: 'monospace', lineHeight: `${CELL}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {Array.from({ length: weeks }, (_, w) => {
          const weekCells = cells.filter(c => c.week === w)
          return (
            <div key={w} className="flex flex-col" style={{ gap: GAP }}>
              {Array.from({ length: 7 }, (_, dow) => {
                const cell = weekCells.find(c => c.dow === dow)
                if (!cell) {
                  return <div key={dow} style={{ width: CELL, height: CELL }} />
                }
                return (
                  <div
                    key={dow}
                    title={cell.cost > 0 ? `${cell.date}: $${cell.cost.toFixed(2)}` : cell.date}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      background: getCellColor(cell.cost),
                      cursor: cell.cost > 0 ? 'pointer' : 'default',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.75' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 ml-8">
        <span style={{ fontSize: 9, color: '#4A5568', fontFamily: 'monospace' }}>Less</span>
        {[0, 0.2, 0.45, 0.7, 1].map((v, i) => (
          <div key={i} style={{ width: CELL, height: CELL, borderRadius: 2, background: getCellColor(v * maxCost * 0.99 + 0.01) }} />
        ))}
        <span style={{ fontSize: 9, color: '#4A5568', fontFamily: 'monospace' }}>More</span>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 grid grid-cols-2 gap-x-8 gap-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>Favorite model: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#00D4FF' }}>
            {favoriteModel ? favoriteModel.replace('claude-', '') : '—'}
          </span>
        </div>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>Total tokens: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#00D4FF' }}>
            {formatTokensShort(totalTokens)}
          </span>
        </div>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>Sessions: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#E8EDF5' }}>{totalSessions}</span>
        </div>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>Longest streak: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#00D4FF' }}>{longestStreak} days</span>
        </div>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>Active days: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#E8EDF5' }}>
            {activeDays}/{totalDays}
          </span>
        </div>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>Current streak: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#00D4FF' }}>{currentStreak} days</span>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useMemo } from 'react'
import type { DayStats } from '@/lib/types'

interface ActivityHeatmapProps {
  days: DayStats[]
  totalSessions: number
  totalDays: number
  favoriteModel: string
  totalTokens: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const CELL = 11
const GAP = 2

function getWeekIndex(date: Date, refSunday: Date): number {
  return Math.floor((date.getTime() - refSunday.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

export function ActivityHeatmap({ days, totalSessions, totalDays, favoriteModel, totalTokens }: ActivityHeatmapProps) {
  const { grid, monthLabels, longestStreak, currentStreak } = useMemo(() => {
    const WEEKS = 52
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const startSunday = new Date(today)
    startSunday.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7)
    startSunday.setHours(0, 0, 0, 0)

    const costByDate: Record<string, number> = {}
    for (const d of days) costByDate[d.date] = d.cost
    const maxCost = Math.max(...Object.values(costByDate), 0.01)

    const grid: { cost: number; date: string }[][] = Array.from({ length: 7 }, () => Array(WEEKS).fill({ cost: 0, date: '' }))
    for (let w = 0; w < WEEKS; w++) {
      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(startSunday)
        d.setDate(startSunday.getDate() + w * 7 + dow)
        if (d > today) continue
        const dateStr = d.toISOString().slice(0, 10)
        grid[dow][w] = { cost: costByDate[dateStr] ?? 0, date: dateStr }
      }
    }

    // Month labels
    const monthLabels: { label: string; col: number }[] = []
    let lastMonth = -1
    for (let w = 0; w < WEEKS; w++) {
      const d = new Date(startSunday)
      d.setDate(startSunday.getDate() + w * 7)
      if (d.getMonth() !== lastMonth) {
        monthLabels.push({ label: MONTHS[d.getMonth()], col: w })
        lastMonth = d.getMonth()
      }
    }

    // Streaks
    const sortedDates = days.map((d) => d.date).sort()
    let longest = 0, current = 0, streak = 0
    const todayStr = today.toISOString().slice(0, 10)
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) { streak = 1; continue }
      const prev = new Date(sortedDates[i - 1])
      const curr = new Date(sortedDates[i])
      const diff = (curr.getTime() - prev.getTime()) / 86400000
      streak = diff === 1 ? streak + 1 : 1
      if (streak > longest) longest = streak
    }
    if (sortedDates.length && sortedDates[sortedDates.length - 1] >= new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
      current = streak
    }

    return { grid, monthLabels, longestStreak: longest, currentStreak: current }
  }, [days])

  function getCellColor(cost: number): string {
    if (cost === 0) return '#F5F0EB'
    const intensity = cost / (days.reduce((m, d) => Math.max(m, d.cost), 0.01))
    if (intensity < 0.15) return '#F2C9BB'
    if (intensity < 0.35) return '#E8917A'
    if (intensity < 0.6) return '#D97057'
    if (intensity < 0.8) return '#C96442'
    return '#A84F31'
  }

  function formatTokensShort(t: number): string {
    if (t >= 1e9) return `${(t / 1e9).toFixed(1)}B`
    if (t >= 1e6) return `${(t / 1e6).toFixed(0)}M`
    if (t >= 1e3) return `${(t / 1e3).toFixed(0)}K`
    return String(t)
  }

  const totalWidth = 52 * (CELL + GAP)

  return (
    <div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', minWidth: totalWidth + 28 }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: 18, marginRight: 6 }}>
            {DAY_LABELS.map((label, i) => (
              <div key={i} style={{ height: CELL, display: 'flex', alignItems: 'center', fontSize: 9, color: '#B0A9A1', fontFamily: 'inherit', whiteSpace: 'nowrap', lineHeight: 1 }}>
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ flex: 1 }}>
            {/* Month labels */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 4, height: 14 }}>
              {monthLabels.map(({ label, col }) => (
                <div key={`${label}-${col}`} style={{ position: 'absolute', marginLeft: col * (CELL + GAP) + 34, fontSize: 9, color: '#B0A9A1', fontFamily: 'inherit', lineHeight: 1 }}>
                  {label}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {grid.map((row, dow) => (
                <div key={dow} style={{ display: 'flex', gap: GAP }}>
                  {row.map((cell, w) => (
                    <div
                      key={w}
                      title={cell.date ? `${cell.date}: $${cell.cost.toFixed(2)}` : ''}
                      style={{
                        width: CELL, height: CELL, borderRadius: 2,
                        background: getCellColor(cell.cost),
                        flexShrink: 0,
                        cursor: cell.date ? 'default' : 'default',
                        transition: 'opacity 0.1s',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ borderTop: '1px solid #EDE9E4' }}>
        {[
          { label: 'Favorite model', value: favoriteModel ? favoriteModel.replace('claude-', '') : '—' },
          { label: 'Total tokens', value: formatTokensShort(totalTokens) },
          { label: 'Active days', value: `${totalDays}` },
          { label: 'Longest streak', value: `${longestStreak} days` },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-xs" style={{ color: '#B0A9A1', marginBottom: 2, fontFamily: 'inherit' }}>{label}</div>
            <div className="text-sm font-semibold" style={{ color: '#C96442', fontFamily: 'inherit' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

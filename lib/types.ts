export interface TokenBreakdown {
  input: number
  output: number
  cache_create: number
  cache_read: number
  total: number
}

export interface HoursBreakdown {
  active_minutes: number
  span_minutes: number
  idle_minutes: number
}

export interface DayStats {
  date: string // YYYY-MM-DD
  cost: number
  tokens: TokenBreakdown
  hours: HoursBreakdown
  sessions: number
  models: string[]
}

export interface ProjectStats {
  name: string
  cost: number
  active_hours: number
  sessions: number
  pct: number // percentage of total cost
  last_active: string
}

export interface PeriodStats {
  cost: number
  cost_delta: number | null // vs previous period, null if no comparison
  tokens: TokenBreakdown
  hours: HoursBreakdown
  sessions: number
  days: DayStats[]
}

export interface StatsData {
  generated_at: string
  today: PeriodStats   // current day
  daily: PeriodStats   // last 7 days by day
  weekly: PeriodStats  // last 4 weeks by week
  monthly: PeriodStats // last 6 months by month
  all_time: PeriodStats
  projects: ProjectStats[]
  meta: {
    first_session: string
    last_session: string
    total_projects: number
  }
}

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

export interface ModelTokens {
  input: number
  output: number
  cache_create: number
  cache_read: number
  total: number
  pct?: number
  cost?: number
}

export interface DayStats {
  date: string // YYYY-MM-DD
  cost: number
  tokens: TokenBreakdown
  hours: HoursBreakdown
  sessions: number
  models: string[]
  model_tokens?: Record<string, ModelTokens>
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

export interface UsageLimits {
  session_tokens: number
  session_pct: number
  week_tokens: number
  week_pct: number
  week_sonnet_tokens: number
  week_sonnet_pct: number
  week_reset: string
  peak_week_tokens: number
  peak_day_tokens: number
}

export interface StatsData {
  generated_at: string
  today: PeriodStats   // current day
  daily: PeriodStats   // last 7 days by day
  weekly: PeriodStats  // last 4 weeks by week
  monthly: PeriodStats // last 6 months by month
  all_time: PeriodStats
  projects: ProjectStats[]
  model_breakdown: Record<string, ModelTokens>
  usage: UsageLimits
  meta: {
    first_session: string
    last_session: string
    total_projects: number
  }
}

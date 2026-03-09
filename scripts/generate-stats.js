#!/usr/bin/env node
/**
 * claude-stats data generator
 * Reads ~/.claude/ JSONL session files, aggregates cost/token/hour data,
 * and writes data/stats.json for the dashboard.
 *
 * Usage: node scripts/generate-stats.js [--dry]
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects')
const OUT_FILE = path.join(__dirname, '..', 'data', 'stats.json')
const IDLE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

// ── Week-start helper ────────────────────────────────────────────────────────
function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

// ── Model pricing (USD per million tokens) ──────────────────────────────────
const MODEL_PRICING = {
  'claude-opus-4-6':    { input: 15,   output: 75,   cache_write: 18.75, cache_read: 1.5  },
  'claude-sonnet-4-6':  { input: 3,    output: 15,   cache_write: 3.75,  cache_read: 0.3  },
  'claude-haiku-4-5':   { input: 0.8,  output: 4,    cache_write: 1,     cache_read: 0.08 },
  'default':            { input: 3,    output: 15,   cache_write: 3.75,  cache_read: 0.3  },
}

function getPrice(model) {
  if (!model) return MODEL_PRICING.default
  const key = Object.keys(MODEL_PRICING).find(k => model.includes(k.replace('claude-', '')))
  return key ? MODEL_PRICING[key] : MODEL_PRICING.default
}

function calcCost(usage, model) {
  const p = getPrice(model)
  const M = 1_000_000
  return (
    (usage.input_tokens || 0) / M * p.input +
    (usage.output_tokens || 0) / M * p.output +
    (usage.cache_creation_input_tokens || 0) / M * p.cache_write +
    (usage.cache_read_input_tokens || 0) / M * p.cache_read
  )
}

// ── Parse all JSONL session files ────────────────────────────────────────────
function parseAllSessions() {
  const sessions = []

  if (!fs.existsSync(PROJECTS_DIR)) {
    console.error(`No projects directory found at ${PROJECTS_DIR}`)
    process.exit(1)
  }

  const projectDirs = fs.readdirSync(PROJECTS_DIR)

  for (const proj of projectDirs) {
    const projPath = path.join(PROJECTS_DIR, proj)
    const stat = fs.statSync(projPath)
    if (!stat.isDirectory()) continue

    const files = fs.readdirSync(projPath).filter(f => f.endsWith('.jsonl'))

    for (const file of files) {
      const filePath = path.join(projPath, file)
      const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean)

      let sessionCost = 0
      let sessionTokens = { input: 0, output: 0, cache_create: 0, cache_read: 0, total: 0 }
      let sessionModels = new Set()
      let sessionModelTokens = {}  // { model: { input, output, cache_create, cache_read } }
      let timestamps = []
      const seenMsgIds = new Set()

      for (const line of lines) {
        try {
          const entry = JSON.parse(line)
          const usage = entry.message?.usage
          const model = entry.message?.model || ''
          const msgId = entry.message?.id

          if (usage && entry.type === 'assistant' && msgId && !seenMsgIds.has(msgId)) {
            seenMsgIds.add(msgId)
            const cost = calcCost(usage, model)
            sessionCost += cost

            sessionTokens.input += usage.input_tokens || 0
            sessionTokens.output += usage.output_tokens || 0
            sessionTokens.cache_create += usage.cache_creation_input_tokens || 0
            sessionTokens.cache_read += usage.cache_read_input_tokens || 0

            if (model) {
              sessionModels.add(model.replace('claude-', ''))
              if (!sessionModelTokens[model]) {
                sessionModelTokens[model] = { input: 0, output: 0, cache_create: 0, cache_read: 0 }
              }
              sessionModelTokens[model].input += usage.input_tokens || 0
              sessionModelTokens[model].output += usage.output_tokens || 0
              sessionModelTokens[model].cache_create += usage.cache_creation_input_tokens || 0
              sessionModelTokens[model].cache_read += usage.cache_read_input_tokens || 0
            }
          }

          if (entry.timestamp) {
            timestamps.push(new Date(entry.timestamp).getTime())
          }
        } catch (_) {}
      }

      sessionTokens.total = sessionTokens.input + sessionTokens.output + sessionTokens.cache_create + sessionTokens.cache_read

      if (timestamps.length > 0) {
        timestamps.sort()
        const firstTs = timestamps[0]
        const date = new Date(firstTs).toISOString().split('T')[0]

        // Compute active/span/idle from timestamps
        let activeMs = 0
        let spanMs = timestamps[timestamps.length - 1] - firstTs
        for (let i = 1; i < timestamps.length; i++) {
          const gap = timestamps[i] - timestamps[i - 1]
          if (gap < IDLE_THRESHOLD_MS) activeMs += gap
        }
        const idleMs = spanMs - activeMs

        sessions.push({
          project: proj,
          date,
          last_timestamp: timestamps[timestamps.length - 1],
          cost: sessionCost,
          tokens: sessionTokens,
          hours: {
            active_minutes: Math.round(activeMs / 60000),
            span_minutes: Math.round(spanMs / 60000),
            idle_minutes: Math.round(idleMs / 60000),
          },
          models: [...sessionModels],
          model_tokens: sessionModelTokens,
          file,
        })
      }
    }
  }

  return sessions
}

// ── Aggregate sessions by date ───────────────────────────────────────────────
function aggregateByDate(sessions) {
  const byDate = {}

  for (const s of sessions) {
    if (!byDate[s.date]) {
      byDate[s.date] = {
        date: s.date,
        cost: 0,
        tokens: { input: 0, output: 0, cache_create: 0, cache_read: 0, total: 0 },
        hours: { active_minutes: 0, span_minutes: 0, idle_minutes: 0 },
        sessions: 0,
        models: new Set(),
        model_tokens: {},
      }
    }
    const d = byDate[s.date]
    d.cost += s.cost
    d.tokens.input += s.tokens.input
    d.tokens.output += s.tokens.output
    d.tokens.cache_create += s.tokens.cache_create
    d.tokens.cache_read += s.tokens.cache_read
    d.tokens.total += s.tokens.total
    d.hours.active_minutes += s.hours.active_minutes
    d.hours.span_minutes += s.hours.span_minutes
    d.hours.idle_minutes += s.hours.idle_minutes
    d.sessions += 1
    s.models.forEach(m => d.models.add(m))
    // merge per-model tokens
    for (const [model, mt] of Object.entries(s.model_tokens || {})) {
      if (!d.model_tokens[model]) d.model_tokens[model] = { input: 0, output: 0, cache_create: 0, cache_read: 0, total: 0 }
      d.model_tokens[model].input += mt.input
      d.model_tokens[model].output += mt.output
      d.model_tokens[model].cache_create += mt.cache_create
      d.model_tokens[model].cache_read += mt.cache_read
      d.model_tokens[model].total += mt.input + mt.output + mt.cache_create + mt.cache_read
    }
  }

  return Object.values(byDate)
    .map(d => ({ ...d, models: [...d.models] }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ── Aggregate sessions by project ────────────────────────────────────────────
function aggregateByProject(sessions, totalCost) {
  const byProj = {}

  for (const s of sessions) {
    if (!byProj[s.project]) {
      byProj[s.project] = { cost: 0, active_minutes: 0, sessions: 0, last_active: s.date }
    }
    const p = byProj[s.project]
    p.cost += s.cost
    p.active_minutes += s.hours.active_minutes
    p.sessions += 1
    if (s.date > p.last_active) p.last_active = s.date
  }

  return Object.entries(byProj)
    .map(([name, d]) => ({
      name: name.replace(/^-Users-[^-]+-GitHub-Repos-/, '').replace(/-/g, '/').substring(0, 40),
      cost: Math.round(d.cost * 100) / 100,
      active_hours: Math.round(d.active_minutes / 60 * 10) / 10,
      sessions: d.sessions,
      pct: Math.round((d.cost / totalCost) * 1000) / 10,
      last_active: d.last_active,
    }))
    .sort((a, b) => b.cost - a.cost)
}

// ── Build period stats ────────────────────────────────────────────────────────
function buildPeriod(days) {
  const totals = days.reduce((acc, d) => {
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
  }, {
    cost: 0,
    tokens: { input: 0, output: 0, cache_create: 0, cache_read: 0, total: 0 },
    hours: { active_minutes: 0, span_minutes: 0, idle_minutes: 0 },
    sessions: 0,
  })

  return { ...totals, cost_delta: null, days }
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const isDry = process.argv.includes('--dry')
  console.log('Reading Claude session data...')

  const sessions = parseAllSessions()
  console.log(`Found ${sessions.length} sessions across ${new Set(sessions.map(s => s.project)).size} projects`)

  const allDays = aggregateByDate(sessions)
  const totalCost = allDays.reduce((s, d) => s + d.cost, 0)

  // Daily: last 7 days
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const dailyDays = allDays.filter(d => d.date >= sevenDaysAgo)

  // Weekly: last 4 weeks, grouped
  const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0]
  const weeklyDays = allDays.filter(d => d.date >= fourWeeksAgo)

  // Monthly: last 6 months
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0]
  const monthlyDays = allDays.filter(d => d.date >= sixMonthsAgo)

  const projects = aggregateByProject(sessions, totalCost)

  // Today
  const todayDays = allDays.filter(d => d.date === today)

  // ── Model breakdown (all-time) ─────────────────────────────────────────────
  const modelBreakdown = {}
  for (const s of sessions) {
    for (const [model, mt] of Object.entries(s.model_tokens || {})) {
      if (!modelBreakdown[model]) modelBreakdown[model] = { input: 0, output: 0, cache_create: 0, cache_read: 0, total: 0, cost: 0 }
      modelBreakdown[model].input += mt.input
      modelBreakdown[model].output += mt.output
      modelBreakdown[model].cache_create += mt.cache_create
      modelBreakdown[model].cache_read += mt.cache_read
      modelBreakdown[model].total += mt.input + mt.output + mt.cache_create + mt.cache_read
      modelBreakdown[model].cost += calcCost({ input_tokens: mt.input, output_tokens: mt.output, cache_creation_input_tokens: mt.cache_create, cache_read_input_tokens: mt.cache_read }, model)
    }
  }
  // Compute percentage of total
  const totalTokensAll = Object.values(modelBreakdown).reduce((s, m) => s + m.total, 0)
  for (const m of Object.values(modelBreakdown)) {
    m.pct = totalTokensAll > 0 ? Math.round((m.total / totalTokensAll) * 1000) / 10 : 0
    m.cost = Math.round(m.cost * 100) / 100
  }

  // ── Usage — historical peak comparison ────────────────────────────────────
  const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000
  const mondayThisWeek = getWeekStart(today)
  const weekReset = (() => {
    const d = new Date()
    const day = d.getDay()
    const daysUntilMonday = day === 0 ? 1 : 8 - day
    d.setDate(d.getDate() + daysUntilMonday)
    d.setHours(8, 0, 0, 0)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
  })()

  // Compute per-week totals for historical max
  const weeklyTokenMap = {}
  const weeklySessionTokenMap = {}
  for (const s of sessions) {
    const ws = getWeekStart(s.date)
    weeklyTokenMap[ws] = (weeklyTokenMap[ws] || 0) + s.tokens.total
    const sonnetMt = Object.entries(s.model_tokens || {}).find(([k]) => k.includes('sonnet'))
    const sonnetT = sonnetMt ? sonnetMt[1].input + sonnetMt[1].output + sonnetMt[1].cache_create + sonnetMt[1].cache_read : 0
    if (!weeklySessionTokenMap[ws]) weeklySessionTokenMap[ws] = { all: 0, sonnet: 0 }
    weeklySessionTokenMap[ws].all += s.tokens.total
    weeklySessionTokenMap[ws].sonnet += sonnetT
  }
  const peakWeekTokens = Math.max(...Object.values(weeklyTokenMap), 1)
  const peakDayTokens = Math.max(...allDays.map(d => d.tokens.total), 1)

  const sessionSessions = sessions.filter(s => s.last_timestamp && s.last_timestamp > fiveHoursAgo)
  const weekSessions = sessions.filter(s => s.date >= mondayThisWeek)

  const sessionTokens = sessionSessions.reduce((sum, s) => sum + s.tokens.total, 0)
  const thisWeekAll = (weeklySessionTokenMap[mondayThisWeek] || { all: 0 }).all
  const thisWeekSonnet = (weeklySessionTokenMap[mondayThisWeek] || { sonnet: 0 }).sonnet

  const usage = {
    session_tokens: sessionTokens,
    session_pct: Math.min(Math.round((sessionTokens / peakDayTokens) * 100), 100),
    week_tokens: thisWeekAll,
    week_pct: Math.min(Math.round((thisWeekAll / peakWeekTokens) * 100), 100),
    week_sonnet_tokens: thisWeekSonnet,
    week_sonnet_pct: Math.min(Math.round((thisWeekSonnet / peakWeekTokens) * 100), 100),
    week_reset: weekReset,
    peak_week_tokens: peakWeekTokens,
    peak_day_tokens: peakDayTokens,
  }

  const stats = {
    generated_at: new Date().toISOString(),
    meta: {
      first_session: allDays[0]?.date || today,
      last_session: allDays[allDays.length - 1]?.date || today,
      total_projects: new Set(sessions.map(s => s.project)).size,
    },
    today: buildPeriod(todayDays),
    daily: buildPeriod(dailyDays),
    weekly: buildPeriod(weeklyDays),
    monthly: buildPeriod(monthlyDays),
    all_time: buildPeriod(allDays),
    projects,
    model_breakdown: modelBreakdown,
    usage,
  }

  if (isDry) {
    console.log('\n-- DRY RUN (not writing) --')
    console.log(`Total cost: $${totalCost.toFixed(2)}`)
    console.log(`Date range: ${stats.meta.first_session} → ${stats.meta.last_session}`)
    console.log(`Projects: ${stats.meta.total_projects}`)
    return
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(stats, null, 2))
  console.log(`Written to ${OUT_FILE}`)
}

main()

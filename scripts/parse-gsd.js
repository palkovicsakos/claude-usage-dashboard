#!/usr/bin/env node
/**
 * parse-gsd.js — reads gsd-projects-overview.md from the workspace
 * and writes data/gsd-state.json for the dashboard to serve.
 */

const fs = require('fs')
const path = require('path')

const WORKSPACE = path.join(__dirname, '..', '..', 'claude-workspace')
const OVERVIEW_FILE = path.join(WORKSPACE, 'plans', 'gsd-projects-overview.md')
const OUT_FILE = path.join(__dirname, '..', 'data', 'gsd-state.json')

function parseOverview(md) {
  const projects = []

  // ── Parse summary table ──────────────────────────────────────────
  const summaryMatch = md.match(/## Summary[\s\S]*?\n\n([\s\S]*?)\n---/)
  if (!summaryMatch) return projects

  const tableRows = summaryMatch[1]
    .split('\n')
    .filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Project'))

  const summaryMap = {}
  for (const row of tableRows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean)
    if (cells.length < 4) continue
    const name = cells[0].replace(/\*\*/g, '').trim()
    const milestone = cells[1].trim()
    const phaseStr = cells[2].trim() // e.g. "15/30"
    const statusStr = cells[3].trim()
    const [completedStr, totalStr] = phaseStr.split('/')
    summaryMap[name] = {
      milestone,
      phases_complete: parseInt(completedStr) || 0,
      phases_total: parseInt(totalStr) || 0,
      gsd_status: statusStr.includes('COMPLETE') ? 'COMPLETE'
        : statusStr.includes('IN PROGRESS') ? 'IN_PROGRESS'
        : 'NOT_STARTED',
    }
  }

  // ── Parse per-project phase sections ────────────────────────────
  const projectSections = md.split(/\n---\n/).slice(1)

  for (const section of projectSections) {
    const nameMatch = section.match(/^##\s+(.+)/m)
    if (!nameMatch) continue
    const name = nameMatch[1].trim()
    if (!summaryMap[name]) continue

    const milestoneMatch = section.match(/\*\*Milestone:\*\*\s*(.+)/)
    const milestone = milestoneMatch ? milestoneMatch[1].trim() : summaryMap[name].milestone

    // Parse phase table rows
    const phases = []
    let currentPhase = null
    const phaseLines = section.split('\n').filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Phase'))
    for (const row of phaseLines) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.length < 3) continue
      const phaseCell = cells[0]
      const statusCell = cells[2] || ''
      const completedCell = cells[3] || ''

      const isComplete = phaseCell.startsWith('✅') || statusCell.toLowerCase().includes('complete')
      const isInProgress = phaseCell.startsWith('🔄') || phaseCell.startsWith('🟡') || statusCell.toLowerCase().includes('in progress')
      const phaseName = phaseCell.replace(/^[✅⚪🔄🟡]\s*\d*\.?\s*/, '').trim()
      const plansMatch = cells[1]?.match(/(\d+)\/(\d+)/)

      const phase = {
        name: phaseName,
        status: isComplete ? 'complete' : isInProgress ? 'active' : 'pending',
        plans_complete: plansMatch ? parseInt(plansMatch[1]) : 0,
        plans_total: plansMatch ? parseInt(plansMatch[2]) : 0,
        completed_date: completedCell && completedCell !== '-' && completedCell !== '—' ? completedCell : null,
      }
      phases.push(phase)
      if (phase.status === 'active' || (phase.status === 'pending' && !currentPhase && summaryMap[name].gsd_status === 'IN_PROGRESS')) {
        if (!currentPhase) currentPhase = phase.name
      }
    }

    // Find current phase: first pending after last complete when in-progress
    if (!currentPhase && summaryMap[name].gsd_status === 'IN_PROGRESS') {
      const firstPending = phases.find(p => p.status === 'pending')
      if (firstPending) {
        currentPhase = firstPending.name
        firstPending.status = 'active'
      }
    }

    const info = summaryMap[name]
    projects.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      milestone,
      phases_complete: info.phases_complete,
      phases_total: info.phases_total,
      gsd_status: info.gsd_status,
      current_phase: currentPhase || null,
      phases,
    })
  }

  // ── Include summary-only projects with no section ────────────────
  for (const [name, info] of Object.entries(summaryMap)) {
    if (!projects.find(p => p.name === name)) {
      projects.push({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        milestone: info.milestone,
        phases_complete: info.phases_complete,
        phases_total: info.phases_total,
        gsd_status: info.gsd_status,
        current_phase: null,
        phases: [],
      })
    }
  }

  return projects
}

function main() {
  if (!fs.existsSync(OVERVIEW_FILE)) {
    console.error(`Overview file not found: ${OVERVIEW_FILE}`)
    process.exit(1)
  }

  const md = fs.readFileSync(OVERVIEW_FILE, 'utf8')

  // Extract last refreshed timestamp
  const refreshedMatch = md.match(/Last refreshed:\s*(.+)/)
  const refreshed = refreshedMatch ? refreshedMatch[1].trim() : new Date().toISOString()

  const projects = parseOverview(md)

  const output = {
    generated_at: new Date().toISOString(),
    source_refreshed: refreshed,
    project_count: projects.length,
    projects,
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2))
  console.log(`✅ GSD state written → ${path.relative(process.cwd(), OUT_FILE)} (${projects.length} projects)`)
}

main()

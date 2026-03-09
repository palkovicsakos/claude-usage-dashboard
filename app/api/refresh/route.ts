import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import path from 'path'

export const dynamic = 'force-dynamic'

export function POST() {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate-stats.js')
    execSync(`node "${scriptPath}"`, { timeout: 60_000 })
    return NextResponse.json({ ok: true, refreshed_at: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

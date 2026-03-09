import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export function GET() {
  try {
    const statsPath = path.join(process.cwd(), 'data', 'stats.json')
    const content = fs.readFileSync(statsPath, 'utf8')
    return NextResponse.json(JSON.parse(content))
  } catch {
    return NextResponse.json({ error: 'Stats not found' }, { status: 404 })
  }
}

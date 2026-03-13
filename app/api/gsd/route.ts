import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'gsd-state.json')
    const content = fs.readFileSync(filePath, 'utf8')
    return NextResponse.json(JSON.parse(content))
  } catch {
    return NextResponse.json({ error: 'GSD state not found' }, { status: 404 })
  }
}

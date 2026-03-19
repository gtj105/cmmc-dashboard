import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const domain_id = searchParams.get('domain_id')
  const domainIdNum = domain_id ? parseInt(domain_id) : null
  if (domain_id && isNaN(domainIdNum!)) {
    return NextResponse.json({ error: 'Invalid domain_id' }, { status: 400 })
  }
  const framework = searchParams.get('framework')
  const status = searchParams.get('status')
  const risk_level = searchParams.get('risk_level')

  const practices = await sql`
    SELECT p.*, d.name AS domain_name, d.abbreviation
    FROM practices p
    JOIN domains d ON d.id = p.domain_id
    WHERE TRUE
      ${domainIdNum !== null ? sql`AND p.domain_id = ${domainIdNum}` : sql``}
      ${framework ? sql`AND p.framework = ${framework}` : sql``}
      ${status ? sql`AND p.status = ${status}` : sql``}
      ${risk_level ? sql`AND p.risk_level = ${risk_level}` : sql``}
    ORDER BY p.practice_id
  `

  return NextResponse.json(practices)
}

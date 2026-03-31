import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { checkCsrf } from '@/lib/api-csrf'
import { getOrgName, setOrgName } from '@/lib/settings'
import { audit } from '@/lib/audit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orgName = await getOrgName()
  return NextResponse.json({ org_name: orgName })
}

const PatchSchema = z.object({
  org_name: z.string().min(1).max(100).trim(),
})

export async function PATCH(req: NextRequest) {
  const csrfError = await checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  await setOrgName(parsed.data.org_name)

  await audit({
    action: 'settings.updated',
    actor: session.user.email ?? 'unknown',
    target: 'org_name',
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown',
    details: `org_name set to "${parsed.data.org_name}"`,
  })

  return NextResponse.json({ org_name: parsed.data.org_name })
}

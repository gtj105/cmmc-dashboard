import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import { getOrgName } from '@/lib/settings'
import { fetchEffectivePractices } from '@/lib/overlays'
import type { PoamItem } from '@/lib/types'
import { scopePoamItems } from './poam-page-data'
import { PoamTable } from './PoamTable'

export const dynamic = 'force-dynamic'

export default async function PoamPage() {
  const session = await getServerSession(getAuthOptions())
  if (!session) redirect('/login')

  const orgName = await getOrgName()
  const canEdit = session.user.role === 'editor' || session.user.role === 'admin'
  const isAdmin = session.user.role === 'admin'

  const [items, { effectivePractices, activePacks }] = await Promise.all([
    sql<PoamItem[]>`
      SELECT * FROM poam_items
      WHERE deleted_at IS NULL
      ORDER BY
        CASE status WHEN 'Open' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END,
        scheduled_completion ASC NULLS LAST,
        created_at DESC
    `,
    fetchEffectivePractices(sql),
  ])

  const overlayActive = activePacks.length > 0
  const customerOwnedPracticeIds = overlayActive
    ? new Set(effectivePractices.filter((p) => p.effective_poam_visibility).map((p) => p.practice_id))
    : null

  const scopedItems = scopePoamItems(items, overlayActive, customerOwnedPracticeIds)

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-8">
        <PoamTable initialItems={scopedItems} canEdit={canEdit} isAdmin={isAdmin} />
      </div>
    </AppShell>
  )
}

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import { getOrgName } from '@/lib/settings'
import AdminTabs from '@/components/AdminTabs'
import { type UserRow } from '@/components/UserTable'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession(getAuthOptions())
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    redirect('/overview')
  }

  const orgName = await getOrgName()
  const currentUserId = parseInt((session.user as { id?: string }).id ?? '0', 10)

  const users = await sql<UserRow[]>`
    SELECT id, email, name, role, created_at
    FROM users
    ORDER BY created_at ASC
  `

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Administration</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage users, backups, security events, and system health.</p>
        </div>

        <AdminTabs users={users} currentUserId={currentUserId} />
      </div>
    </AppShell>
  )
}

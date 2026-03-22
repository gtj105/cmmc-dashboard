import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import UserTable, { type UserRow } from '@/components/UserTable'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await getServerSession(getAuthOptions())
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    redirect('/overview')
  }

  const orgName = process.env.ORG_NAME ?? 'My Organization'
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
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage dashboard access roles.</p>
        </div>

        <UserTable users={users} currentUserId={currentUserId} />
      </div>
    </AppShell>
  )
}

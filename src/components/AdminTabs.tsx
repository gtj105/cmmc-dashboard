'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import UserTable, { type UserRow } from './UserTable'
import BackupPanel from './BackupPanel'
import AuditLogPanel from './AuditLogPanel'
import SystemHealthPanel from './SystemHealthPanel'

const TABS = [
  { id: 'users', label: 'Users' },
  { id: 'backup', label: 'Backup & Restore' },
  { id: 'audit', label: 'Audit Log' },
  { id: 'health', label: 'System Health' },
] as const

type TabId = (typeof TABS)[number]['id']

interface AdminTabsProps {
  users: UserRow[]
  currentUserId: number
}

export default function AdminTabs({ users, currentUserId }: AdminTabsProps) {
  // Check URL hash for initial tab (e.g. /admin#backup)
  const initialTab = (): TabId => {
    if (typeof window === 'undefined') return 'users'
    const hash = window.location.hash.replace('#', '')
    if (TABS.some((t) => t.id === hash)) return hash as TabId
    return 'users'
  }

  const [active, setActive] = useState<TabId>(initialTab)

  function selectTab(id: TabId) {
    setActive(id)
    window.history.replaceState(null, '', `#${id}`)
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-xs font-medium tracking-wide transition-colors',
              active === tab.id
                ? 'border-b-2 border-sky-500 text-foreground'
                : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === 'users' && <UserTable users={users} currentUserId={currentUserId} />}
      {active === 'backup' && <BackupPanel />}
      {active === 'audit' && <AuditLogPanel />}
      {active === 'health' && <SystemHealthPanel />}
    </div>
  )
}

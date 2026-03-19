'use client'

import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

interface TopNavProps {
  orgName: string
  user?: { name?: string | null; email?: string | null }
}

export default function TopNav({ orgName, user }: TopNavProps) {
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="flex h-14 items-center justify-between border-b border-border px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">{orgName}</span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-xs text-muted-foreground">CMMC Level 2 Dashboard</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

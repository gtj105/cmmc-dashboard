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
    <div className="flex h-14 items-center justify-between border-b border-border bg-background/95 px-6">
      <div className="flex items-center gap-3">
        <div>
          <div className="text-sm font-semibold tracking-tight text-foreground">{orgName}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Operations board</div>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <span className="text-xs text-muted-foreground">CMMC Level 2 command surface</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-sm border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-accent/40">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
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

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const CMMC_DOMAINS = [
  { id: 1, abbr: 'AC', name: 'Access Control' },
  { id: 2, abbr: 'AT', name: 'Awareness & Training' },
  { id: 3, abbr: 'AU', name: 'Audit & Accountability' },
  { id: 4, abbr: 'CA', name: 'Security Assessment' },
  { id: 5, abbr: 'CM', name: 'Configuration Mgmt' },
  { id: 6, abbr: 'IA', name: 'Identification & Auth' },
  { id: 7, abbr: 'IR', name: 'Incident Response' },
  { id: 8, abbr: 'MA', name: 'Maintenance' },
  { id: 9, abbr: 'MP', name: 'Media Protection' },
  { id: 10, abbr: 'PE', name: 'Physical Protection' },
  { id: 11, abbr: 'PS', name: 'Personnel Security' },
  { id: 12, abbr: 'RA', name: 'Risk Assessment' },
  { id: 13, abbr: 'SC', name: 'System & Comms' },
  { id: 14, abbr: 'SI', name: 'System Integrity' },
]

function NavItem({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
        active
          ? 'bg-accent text-foreground border-l-2 border-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      {children}
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex w-60 flex-col border-r border-border bg-card overflow-y-auto">
      <div className="flex h-14 items-center px-4 border-b border-border">
        <span className="text-sm font-bold text-foreground tracking-wide">CMMC L2</span>
      </div>
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        <NavItem href="/overview" active={pathname === '/overview'}>
          Overview
        </NavItem>

        <div className="px-3 py-2 mt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            CMMC Domains
          </span>
        </div>

        {CMMC_DOMAINS.map((domain) => (
          <NavItem
            key={domain.id}
            href={`/domain/${domain.id}`}
            active={pathname === `/domain/${domain.id}`}
          >
            <span className="w-7 text-xs font-mono font-semibold text-primary">{domain.abbr}</span>
            <span className="truncate">{domain.name}</span>
          </NavItem>
        ))}

        <div className="px-3 py-2 mt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Compliance
          </span>
        </div>

        <NavItem href="/itar" active={pathname === '/itar'}>
          ITAR Overlay
        </NavItem>
        <NavItem href="/risk" active={pathname === '/risk'}>
          Risk Tracker
        </NavItem>
      </nav>
    </div>
  )
}

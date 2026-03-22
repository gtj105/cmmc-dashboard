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
        'flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors',
        active
          ? 'border-l-2 border-l-sky-500 bg-accent/40 pl-[10px] text-foreground'
          : 'border-l-2 border-l-transparent pl-[10px] text-muted-foreground hover:bg-accent/30 hover:text-foreground'
      )}
    >
      {children}
    </Link>
  )
}

export default function Sidebar({ orgName, role }: { orgName: string; role?: string }) {
  const pathname = usePathname()

  return (
    <div className="flex w-64 flex-col overflow-y-auto border-r border-border bg-card/50">
      <div className="border-b border-border px-4 py-4">
        <span className="text-base font-semibold tracking-tight text-foreground">Command center</span>
        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">CMMC L2</div>
        <div className="mt-3 text-xs text-muted-foreground truncate">{orgName}</div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        <NavItem href="/overview" active={pathname === '/overview'}>
          Overview
        </NavItem>

        <div className="px-3 py-2 mt-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            CMMC Domains
          </span>
        </div>

        {CMMC_DOMAINS.map((domain) => (
          <NavItem
            key={domain.id}
            href={`/domain/${domain.id}`}
            active={pathname === `/domain/${domain.id}`}
          >
            <span className="w-7 text-xs font-semibold text-sky-500/60">{domain.abbr}</span>
            <span className="truncate">{domain.name}</span>
          </NavItem>
        ))}

        <div className="px-3 py-2 mt-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Compliance
          </span>
        </div>

        <NavItem href="/itar" active={pathname === '/itar'}>
          ITAR Overlay
        </NavItem>
        <NavItem href="/risk" active={pathname === '/risk'}>
          Risk Tracker
        </NavItem>
        <NavItem href="/overlays" active={pathname === '/overlays'}>
          Enclave Overlays
        </NavItem>

        <div className="px-3 py-2 mt-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600/70">
            Program Management
          </span>
        </div>

        <NavItem href="/poam" active={pathname === '/poam'}>
          POA&amp;M
        </NavItem>
        <NavItem href="/activity" active={pathname === '/activity'}>
          Activity Log
        </NavItem>
        <NavItem href="/report" active={pathname === '/report'}>
          Assessment Report
        </NavItem>

        <div className="px-3 py-2 mt-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Account
          </span>
        </div>
        <NavItem href="/settings" active={pathname === '/settings'}>
          Settings
        </NavItem>

        {role === 'admin' && (
          <>
            <div className="px-3 py-2 mt-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Admin
              </span>
            </div>
            <NavItem href="/admin/users" active={pathname === '/admin/users'}>
              Users
            </NavItem>
          </>
        )}
      </nav>
    </div>
  )
}

'use client'

import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  PACK_LAYOUT,
  displayStatusLabel,
  formatCount,
  residualImpactNote,
  type OverlayPackCard,
} from './overlay-page-data'

interface OverlayInventoryProps {
  handleToggle: (key: OverlayPackCard['key'], enabled: boolean) => Promise<void>
  packByKey: Map<OverlayPackCard['key'], OverlayPackCard>
  refreshingKey: OverlayPackCard['key'] | null
  selectedKey: OverlayPackCard['key']
  setSelectedKey: (key: OverlayPackCard['key']) => void
}

export default function OverlayInventory({
  handleToggle,
  packByKey,
  refreshingKey,
  selectedKey,
  setSelectedKey,
}: OverlayInventoryProps) {
  return (
    <div className="command-panel p-4">
      <p className="command-kicker">Overlay inventory</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        All four overlay packs can be toggled independently. They load as available but off by default, and
        deployment-sensitive claims remain marked verify config until your organization confirms them.
      </p>
      <div className="mt-4 space-y-3">
        {PACK_LAYOUT.map((packConfig) => {
          const pack = packByKey.get(packConfig.key)
          const enabled = pack?.enabled ?? false
          const isSelected = selectedKey === packConfig.key
          const status = pack?.status ?? (packConfig.key === 'm365_gcc_high' ? 'available' : 'not_loaded')

          return (
            <button
              key={packConfig.key}
              type="button"
              onClick={() => setSelectedKey(packConfig.key)}
              className={`w-full border px-3 py-3 text-left transition-colors ${
                isSelected ? 'border-sky-500/50 bg-accent/40' : 'border-border/80 bg-card/30 hover:bg-accent/20'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{packConfig.name}</span>
                    <Badge
                      variant="outline"
                      className={`border-border/70 text-[10px] uppercase tracking-[0.16em] ${
                        displayStatusLabel(status, enabled) === 'active'
                          ? 'bg-emerald-950/20 text-emerald-200'
                          : displayStatusLabel(status, enabled) === 'available'
                            ? 'bg-sky-950/20 text-sky-200'
                            : 'bg-amber-950/20 text-amber-200'
                      }`}
                    >
                      {displayStatusLabel(status, enabled)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {packConfig.provider}
                    {pack ? ` · ${formatCount(pack.impacted_count)} impacted controls` : ''}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    <span className="uppercase tracking-[0.16em] text-[10px] text-muted-foreground/80">
                      Residual scoring impact
                    </span>
                    <span className="ml-2 normal-case tracking-normal text-xs text-muted-foreground">
                      {residualImpactNote(packConfig.key, status, enabled)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {status === 'available' ? (
                    <Switch
                      checked={enabled}
                      disabled={refreshingKey !== null}
                      onCheckedChange={(next) => handleToggle(packConfig.key, next)}
                      aria-label={`Toggle ${packConfig.name}`}
                    />
                  ) : (
                    <Switch checked={false} disabled aria-label={`${packConfig.name} unavailable`} />
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:grid-cols-4">
                <span>{pack?.full_count ?? 0} full</span>
                <span>{pack?.partial_count ?? 0} partial</span>
                <span>{pack?.validation_required_count ?? 0} verify config</span>
                <span>{pack?.none_count ?? 0} none</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

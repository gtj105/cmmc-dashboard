'use client'

import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  formatCount,
  type ImpactFilter,
  type OverlayMappingGroup,
  type OverlayPackCard,
  validationStateLabel,
} from './overlay-page-data'
import { CustomerActions } from '@/components/CustomerActions'

interface ImpactedControlsProps {
  groupedMappings: OverlayMappingGroup[]
  impactFilter: ImpactFilter
  impactedCounts: { full: number; partial: number; validation_required: number; none: number }
  impactedMappingsLength: number
  mappingsLength: number
  mappingsLoading: boolean
  selectedPack: OverlayPackCard | null
  setImpactFilter: (filter: ImpactFilter) => void
}

export default function ImpactedControls({
  groupedMappings,
  impactFilter,
  impactedCounts,
  impactedMappingsLength,
  mappingsLength,
  mappingsLoading,
  selectedPack,
  setImpactFilter,
}: ImpactedControlsProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="command-kicker">Impacted controls</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            {selectedPack?.name ?? 'Microsoft 365 GCC High'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedPack?.status === 'available'
              ? 'Controls that inherit responsibility when the pack is active.'
              : 'Mapping pack not loaded, so this is a preview of the available pack only.'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums text-foreground">
            {formatCount(impactedMappingsLength)}
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            impacted controls
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All controls', count: impactedMappingsLength },
          { key: 'full', label: 'Fully inherited', count: impactedCounts.full },
          { key: 'partial', label: 'Partially inherited', count: impactedCounts.partial },
          { key: 'validation_required', label: 'Verify config', count: impactedCounts.validation_required },
        ].map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setImpactFilter(filter.key as ImpactFilter)}
            className={`border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
              impactFilter === filter.key
                ? 'border-sky-500/50 bg-accent/50 text-foreground'
                : 'border-border/70 bg-card/20 text-muted-foreground hover:bg-accent/20 hover:text-foreground'
            }`}
          >
            {filter.label} · {formatCount(filter.count)}
          </button>
        ))}
      </div>

      {mappingsLength === 0 ? (
        <div className="command-panel px-4 py-6 text-sm text-muted-foreground">
          {mappingsLoading
            ? 'Loading impacted controls...'
            : selectedPack?.status === 'available'
              ? 'No impacted controls are currently in scope for this pack.'
              : 'mapping pack not loaded'}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedMappings.map((group) => (
            <div key={group.key} className="command-panel">
              <div className="flex items-end justify-between gap-4 border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold tracking-tight text-foreground">{group.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{group.note}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold tabular-nums text-foreground">{group.items.length}</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">controls</div>
                </div>
              </div>
              <div className="command-table-shell border-0 border-t-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Practice ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-28">Inheritance</TableHead>
                      <TableHead className="w-40">Source</TableHead>
                      <TableHead>Customer action</TableHead>
                      <TableHead className="w-36">Validation state</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((mapping) => (
                      <TableRow key={mapping.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-mono text-xs text-muted-foreground">{mapping.practice_id}</div>
                            {mapping.domain_abbreviation && (
                              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                {mapping.domain_abbreviation}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm text-foreground">{mapping.practice_title ?? 'Unmapped control'}</div>
                            <div className="text-xs text-muted-foreground">{mapping.practice_risk_level ?? 'Unknown'} risk</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border/70 bg-card/50 text-[10px] uppercase tracking-[0.18em] text-foreground">
                            {mapping.effectiveInheritanceType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <a href={mapping.source_url} target="_blank" rel="noreferrer" className="text-xs text-sky-300 hover:text-sky-200">
                              {mapping.source_title}
                            </a>
                            <div className="text-xs text-muted-foreground">
                              {mapping.practice_status ?? 'Unknown'} status
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <CustomerActions text={mapping.customer_actions} />
                            {mapping.rationale && <div className="text-[11px] text-muted-foreground">{mapping.rationale}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs text-foreground">
                              {validationStateLabel(mapping.inheritance_type, mapping.validated, mapping.resolved_inheritance_type)}
                            </div>
                            {mapping.validation_notes && (
                              <div className="text-[11px] text-muted-foreground">{mapping.validation_notes}</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

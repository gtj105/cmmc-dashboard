'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Practice, Status, RiskLevel } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { RiskBadge } from '@/components/RiskBadge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const STATUSES: Status[] = ['Not Started', 'In Progress', 'Implemented', 'Audit Ready']
const RISKS: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical']

interface PracticeTableProps {
  practices: Practice[]
  onUpdate?: () => void  // callback to refresh parent data after mutation
}

async function patchPractice(id: number, updates: Record<string, unknown>) {
  const res = await fetch(`/api/practices/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update practice')
  return res.json()
}

export function PracticeTable({ practices: initialPractices, onUpdate }: PracticeTableProps) {
  const [practices, setPractices] = useState(initialPractices)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<Set<number>>(new Set())

  useEffect(() => {
    setPractices(initialPractices)
  }, [initialPractices])

  const filtered = practices.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (riskFilter !== 'all' && p.risk_level !== riskFilter) return false
    return true
  })

  const updatePractice = useCallback(async (id: number, updates: Record<string, unknown>) => {
    setUpdating((prev) => new Set(prev).add(id))
    try {
      const updated = await patchPractice(id, updates)
      setPractices((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)))
      onUpdate?.()
    } catch (err) {
      console.error('Update failed:', err)
    } finally {
      setUpdating((prev) => { const s = new Set(prev); s.delete(id); return s })
    }
  }, [onUpdate])

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-3 items-center">
        <div className="w-44">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All risks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risks</SelectItem>
              {RISKS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {practices.length} practices
        </span>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Practice ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-[150px]">Status</TableHead>
            <TableHead className="w-[90px]">Risk</TableHead>
            <TableHead className="w-[140px]">Owner</TableHead>
            <TableHead className="w-[130px]">Due Date</TableHead>
            <TableHead className="w-[80px] text-center">Evidence</TableHead>
            <TableHead className="w-[200px]">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                No practices match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((practice) => (
              <TableRow
                key={practice.id}
                className={updating.has(practice.id) ? 'opacity-60' : ''}
              >
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">
                    {practice.practice_id}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{practice.title}</span>
                </TableCell>
                <TableCell>
                  <Select
                    value={practice.status}
                    onValueChange={(value) =>
                      updatePractice(practice.id, { status: value as Status })
                    }
                    disabled={updating.has(practice.id)}
                  >
                    <SelectTrigger className="h-7 text-xs border-none bg-transparent p-0 hover:bg-accent focus:ring-0">
                      <SelectValue>
                        <StatusBadge status={practice.status} />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <StatusBadge status={s} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <RiskBadge risk={practice.risk_level} />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-7 text-xs border-muted/30 bg-transparent focus:bg-card"
                    defaultValue={practice.owner ?? ''}
                    placeholder="Assign owner"
                    onBlur={(e) => {
                      const newVal = e.target.value.trim()
                      if (newVal !== (practice.owner ?? '')) {
                        updatePractice(practice.id, { owner: newVal || null })
                      }
                    }}
                    disabled={updating.has(practice.id)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    className="h-7 text-xs border-muted/30 bg-transparent focus:bg-card"
                    defaultValue={practice.due_date ?? ''}
                    onBlur={(e) => {
                      const newVal = e.target.value || null
                      if (newVal !== practice.due_date) {
                        updatePractice(practice.id, { due_date: newVal })
                      }
                    }}
                    disabled={updating.has(practice.id)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={practice.evidence_exists}
                    onCheckedChange={(checked) =>
                      updatePractice(practice.id, { evidence_exists: checked })
                    }
                    disabled={updating.has(practice.id)}
                    aria-label="Evidence exists"
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    className="min-h-0 h-7 resize-none text-xs border-muted/30 bg-transparent focus:bg-card py-1"
                    defaultValue={practice.notes ?? ''}
                    placeholder="Add notes..."
                    onBlur={(e) => {
                      const newVal = e.target.value.trim()
                      if (newVal !== (practice.notes ?? '')) {
                        updatePractice(practice.id, { notes: newVal || null })
                      }
                    }}
                    disabled={updating.has(practice.id)}
                    rows={1}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

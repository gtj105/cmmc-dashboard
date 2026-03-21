# CMMC Dashboard — Four Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SPRS score, evidence gap widget, POA&M tracker, and activity log to the CMMC L2 compliance dashboard.

**Architecture:** Tasks 1–2 are pure server-side SQL additions to the existing overview page (no schema changes). Tasks 3–4 each require a new Postgres table (added to seed.ts), new API routes following the existing pattern, a new client-side page, and sidebar nav additions.

**Tech Stack:** Next.js 14 App Router, TypeScript, postgres.js (tagged template SQL, no ORM), Tailwind CSS + shadcn/ui, NextAuth v4 (session auth on every API route), IBM Plex Sans + IBM Plex Mono, warm dark theme (`hsl(25 12% 6%)`).

---

## Codebase Context (read before starting any task)

**Project root:** `/Users/gtj105/Documents/obsidian/dashboard`

**Key files:**
- `src/app/overview/page.tsx` — server component, direct SQL queries, no API calls
- `src/app/api/practices/[id]/route.ts` — reference PATCH handler pattern (auth check, sql update, return JSON)
- `src/app/risk/page.tsx` — reference client page pattern (useSession, fetch /api/*, table display)
- `src/components/layout/Sidebar.tsx` — add nav items here for new pages
- `src/lib/types.ts` — add new TypeScript interfaces here
- `src/lib/db.ts` — postgres.js singleton: `import sql from '@/lib/db'`
- `scripts/seed.ts` — schema source of truth; add CREATE TABLE + TRUNCATE entries here
- `src/lib/auth.ts` — import `authOptions` for `getServerSession`

**Auth pattern (API routes):**
```typescript
const session = await getServerSession(authOptions)
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

**Auth pattern (client pages):**
```typescript
const { data: session, status } = useSession()
useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])
```

**SQL pattern:**
```typescript
import sql from '@/lib/db'
const [row] = await sql`SELECT ... FROM ... WHERE ...`
const rows = await sql`SELECT ... FROM ...`
```

**Design system:**
- Background: `hsl(25 12% 6%)`, Card: `hsl(25 10% 8%)`, Border: `hsl(25 8% 16%)`
- Font: IBM Plex Sans (body) + IBM Plex Mono (data/IDs)
- Mono IDs: `font-mono text-xs text-muted-foreground`
- Status colors: Not Started=zinc, In Progress=amber-400, Implemented=blue-400, Audit Ready=green-400
- No Card wrappers on flat sections — use `border-t border-border` separators
- No decorative complexity — every element carries information

**Re-seed command:** `npm run seed` (resets all data, run after schema changes)

---

## Task 1: SPRS Score on Overview

SPRS (Supplier Performance Risk System) is the 0–110 number submitted to DoD. Formula: `110 - SUM(point deductions for non-implemented practices)`. Point values match DoD Assessment Methodology: Critical=5, High=3, Medium=1, Low=0.

**Files:**
- Modify: `src/app/overview/page.tsx`

- [ ] **Step 1: Add SPRS query to overview page**

In `src/app/overview/page.tsx`, after the existing stats query, add:

```typescript
// Fetch SPRS score
const [sprsResult] = await sql`
  SELECT (110 - COALESCE(SUM(
    CASE
      WHEN risk_level = 'Critical' THEN 5
      WHEN risk_level = 'High' THEN 3
      WHEN risk_level = 'Medium' THEN 1
      ELSE 0
    END
  ), 0))::int AS sprs_score
  FROM practices
  WHERE framework = 'CMMC'
    AND status NOT IN ('Implemented', 'Audit Ready')
`
const sprsScore: number = sprsResult.sprs_score
```

- [ ] **Step 2: Display SPRS score in the score hero section**

In `src/app/overview/page.tsx`, inside the Score Hero `<div className="py-4 border-b border-border">`, add a second metric block alongside the existing % score. Replace:

```tsx
<div className="flex items-end gap-10">
  <div>
    <div className={`text-7xl font-bold leading-none tracking-tight ${ragTextClass(score_pct)}`}>
      <AnimatedNumber value={score_pct} /><span className="text-3xl font-light text-muted-foreground">%</span>
    </div>
    <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest font-medium">
      CMMC L2 Compliance Score
    </p>
  </div>
  <div className="flex-1 pb-1.5">
    <AnimatedProgress value={score_pct} className="h-1.5" delay={400} />
    <p className="text-xs text-muted-foreground mt-1.5">
      {stats.implemented + stats.audit_ready} of {stats.total} practices complete
    </p>
  </div>
</div>
```

With:

```tsx
<div className="flex items-end gap-10">
  <div>
    <div className={`text-7xl font-bold leading-none tracking-tight ${ragTextClass(score_pct)}`}>
      <AnimatedNumber value={score_pct} /><span className="text-3xl font-light text-muted-foreground">%</span>
    </div>
    <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest font-medium">
      CMMC L2 Compliance Score
    </p>
  </div>
  <div className="border-l border-border pl-8">
    <div className={`text-5xl font-bold leading-none tracking-tight tabular-nums ${sprsScore >= 80 ? 'text-green-400' : sprsScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
      <AnimatedNumber value={sprsScore} />
    </div>
    <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest font-medium">
      SPRS Score <span className="text-[10px] normal-case tracking-normal">(0–110)</span>
    </p>
  </div>
  <div className="flex-1 pb-1.5">
    <AnimatedProgress value={score_pct} className="h-1.5" delay={400} />
    <p className="text-xs text-muted-foreground mt-1.5">
      {stats.implemented + stats.audit_ready} of {stats.total} practices complete
    </p>
  </div>
</div>
```

- [ ] **Step 3: Verify in browser**

Start the dev server: `npm run dev`

Open `http://localhost:3000/overview`. Confirm:
- SPRS score number appears between the % score and the progress bar
- It animates up from 0 on page load
- Color is green (≥80), amber (50–79), or red (<50) matching the seeded data

- [ ] **Step 4: Commit**

```bash
cd /Users/gtj105/Documents/obsidian/dashboard
git add src/app/overview/page.tsx
git commit -m "feat: add SPRS score to overview hero"
```

---

## Task 2: Evidence Gap Widget on Overview

Practices marked Implemented or Audit Ready without `evidence_exists = true` will fail a C3PAO audit even though they boost the compliance score. This widget surfaces that gap.

**Files:**
- Modify: `src/app/overview/page.tsx`

- [ ] **Step 1: Add evidence gap query**

In `src/app/overview/page.tsx`, after the SPRS query from Task 1, add:

```typescript
// Fetch evidence gap count
const [evidenceGapResult] = await sql`
  SELECT COUNT(*)::int AS evidence_gap
  FROM practices
  WHERE framework = 'CMMC'
    AND status IN ('Implemented', 'Audit Ready')
    AND evidence_exists = false
`
const evidenceGap: number = evidenceGapResult.evidence_gap
```

- [ ] **Step 2: Render evidence gap warning**

In `src/app/overview/page.tsx`, add this block immediately after the closing `</div>` of the Score Hero section (after the `{/* Score Hero */}` block, before `{/* Critical attention strip */}`):

```tsx
{/* Evidence Gap Warning */}
{evidenceGap > 0 && (
  <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-amber-600/35 bg-amber-950/10">
    <span className="text-amber-500 text-sm font-semibold tabular-nums">{evidenceGap}</span>
    <span className="text-xs text-amber-400">
      {evidenceGap === 1 ? 'practice' : 'practices'} marked complete but missing evidence — will fail C3PAO audit
    </span>
    <a href="/risk" className="ml-auto text-xs text-amber-500 hover:text-amber-400 hover:underline underline-offset-2 shrink-0">
      Review →
    </a>
  </div>
)}
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000/overview`. Confirm:
- If any practices are Implemented/Audit Ready with `evidence_exists = false` (seeded as false by default), the amber warning strip appears
- The count is accurate
- The "Review →" link navigates to `/risk`
- The strip is absent if `evidenceGap === 0`

- [ ] **Step 4: Commit**

```bash
cd /Users/gtj105/Documents/obsidian/dashboard
git add src/app/overview/page.tsx
git commit -m "feat: add evidence gap warning to overview"
```

---

## Task 3: POA&M Tracker

Plan of Action & Milestones (POA&M) is required by DFARS 252.204-7019. C3PAOs look at this directly during assessment. Each entry documents a gap finding, who owns fixing it, what resources are needed, and when it will be closed.

**Files:**
- Modify: `scripts/seed.ts` — add CREATE TABLE + truncate entry
- Create: `src/app/api/poam/route.ts` — GET (list) + POST (create)
- Create: `src/app/api/poam/[id]/route.ts` — PATCH (update) + DELETE
- Create: `src/app/poam/page.tsx` — client page
- Modify: `src/components/layout/Sidebar.tsx` — add nav item
- Modify: `src/lib/types.ts` — add PoamItem interface

- [ ] **Step 1: Add poam_items table to seed.ts**

In `scripts/seed.ts`, add the following CREATE TABLE block after the `users` table CREATE:

```typescript
await sql`
  CREATE TABLE IF NOT EXISTS poam_items (
    id SERIAL PRIMARY KEY,
    practice_id TEXT REFERENCES practices(practice_id) ON DELETE SET NULL,
    finding TEXT NOT NULL,
    responsible_individual TEXT,
    resources_required TEXT,
    scheduled_completion DATE,
    milestone_progress INTEGER NOT NULL DEFAULT 0 CHECK (milestone_progress BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'Open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`
```

Also update the TRUNCATE line from:
```typescript
await sql`TRUNCATE practices, domains, users RESTART IDENTITY CASCADE`
```
To:
```typescript
await sql`TRUNCATE poam_items, practices, domains, users RESTART IDENTITY CASCADE`
```

- [ ] **Step 2: Run seed to create the table**

```bash
cd /Users/gtj105/Documents/obsidian/dashboard
npm run seed
```

Expected output ends with: seeding complete (or similar). Confirm no errors.

- [ ] **Step 3: Add PoamItem type**

In `src/lib/types.ts`, append:

```typescript
export type PoamStatus = 'Open' | 'In Progress' | 'Closed'

export interface PoamItem {
  id: number
  practice_id: string | null
  finding: string
  responsible_individual: string | null
  resources_required: string | null
  scheduled_completion: string | null
  milestone_progress: number
  status: PoamStatus
  created_at: string
  updated_at: string
}
```

- [ ] **Step 4: Create GET + POST API route**

Create `src/app/api/poam/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'
import type { PoamStatus } from '@/lib/types'

const VALID_STATUSES: PoamStatus[] = ['Open', 'In Progress', 'Closed']

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await sql`
    SELECT * FROM poam_items ORDER BY
      CASE status WHEN 'Open' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END,
      scheduled_completion ASC NULLS LAST,
      created_at DESC
  `
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { finding, practice_id, responsible_individual, resources_required, scheduled_completion, milestone_progress, status } = body

  if (!finding || typeof finding !== 'string' || finding.trim() === '') {
    return NextResponse.json({ error: 'finding is required' }, { status: 400 })
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const [created] = await sql`
    INSERT INTO poam_items (finding, practice_id, responsible_individual, resources_required, scheduled_completion, milestone_progress, status)
    VALUES (
      ${finding.trim()},
      ${practice_id ?? null},
      ${responsible_individual ?? null},
      ${resources_required ?? null},
      ${scheduled_completion ?? null},
      ${milestone_progress ?? 0},
      ${status ?? 'Open'}
    )
    RETURNING *
  `
  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 5: Create PATCH + DELETE API route**

Create `src/app/api/poam/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'
import type { PoamStatus } from '@/lib/types'

const VALID_STATUSES: PoamStatus[] = ['Open', 'In Progress', 'Closed']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const { finding, practice_id, responsible_individual, resources_required, scheduled_completion, milestone_progress, status } = body

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (milestone_progress !== undefined && (milestone_progress < 0 || milestone_progress > 100)) {
    return NextResponse.json({ error: 'milestone_progress must be 0–100' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if ('finding' in body) updates.finding = finding
  if ('practice_id' in body) updates.practice_id = practice_id
  if ('responsible_individual' in body) updates.responsible_individual = responsible_individual
  if ('resources_required' in body) updates.resources_required = resources_required
  if ('scheduled_completion' in body) updates.scheduled_completion = scheduled_completion
  if ('milestone_progress' in body) updates.milestone_progress = milestone_progress
  if ('status' in body) updates.status = status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const [updated] = await sql`
    UPDATE poam_items
    SET ${sql(updates)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const [deleted] = await sql`DELETE FROM poam_items WHERE id = ${id} RETURNING id`
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
```

- [ ] **Step 6: Create the POA&M page**

Create `src/app/poam/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { PoamItem, PoamStatus } from '@/lib/types'

const STATUS_COLORS: Record<PoamStatus, string> = {
  'Open': 'text-red-400 bg-red-950/40 border-red-800/50',
  'In Progress': 'text-amber-400 bg-amber-950/40 border-amber-800/50',
  'Closed': 'text-green-400 bg-green-950/40 border-green-800/50',
}

const STATUSES: PoamStatus[] = ['Open', 'In Progress', 'Closed']

export default function PoamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<PoamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [newFinding, setNewFinding] = useState('')
  const [newPracticeId, setNewPracticeId] = useState('')
  const [newOwner, setNewOwner] = useState('')
  const [newResources, setNewResources] = useState('')
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/poam')
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? 'My Organization'

  const filtered = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    return true
  })

  async function handleStatusChange(id: number, newStatus: PoamStatus) {
    const res = await fetch(`/api/poam/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems((prev) => prev.map((item) => item.id === id ? updated : item))
    }
  }

  async function handleProgressChange(id: number, progress: number) {
    const res = await fetch(`/api/poam/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestone_progress: progress }),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems((prev) => prev.map((item) => item.id === id ? updated : item))
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newFinding.trim()) return
    setSaving(true)
    const res = await fetch('/api/poam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        finding: newFinding,
        practice_id: newPracticeId || null,
        responsible_individual: newOwner || null,
        resources_required: newResources || null,
        scheduled_completion: newDate || null,
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setItems((prev) => [created, ...prev])
      setNewFinding('')
      setNewPracticeId('')
      setNewOwner('')
      setNewResources('')
      setNewDate('')
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/poam/${id}`, { method: 'DELETE' })
    if (res.ok) setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const openCount = items.filter((i) => i.status === 'Open').length
  const inProgressCount = items.filter((i) => i.status === 'In Progress').length
  const closedCount = items.filter((i) => i.status === 'Closed').length

  if (status === 'loading' || loading) {
    return (
      <AppShell orgName={orgName}>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </AppShell>
    )
  }

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {orgName}
          </span>
        </div>

        {/* Title + KPIs */}
        <div className="py-4 border-b border-border">
          <div className="flex items-end gap-10">
            <div>
              <div className="text-5xl font-bold leading-none tracking-tight tabular-nums text-foreground">
                {items.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest font-medium">
                Plan of Action & Milestones
              </p>
            </div>
          </div>
          <div className="flex gap-0 mt-6 divide-x divide-border">
            {[
              { label: 'Open', value: openCount, color: 'text-red-400' },
              { label: 'In Progress', value: inProgressCount, color: 'text-amber-400' },
              { label: 'Closed', value: closedCount, color: 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 px-5">
                <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
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
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Cancel' : '+ Add Item'}
          </Button>
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleCreate} className="border border-border rounded-lg p-4 space-y-3 bg-card">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">New POA&amp;M Item</p>
            <div className="space-y-2">
              <textarea
                required
                placeholder="Finding description (required)"
                value={newFinding}
                onChange={(e) => setNewFinding(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Practice ID (e.g. AC.L2-3.1.1)"
                  value={newPracticeId}
                  onChange={(e) => setNewPracticeId(e.target.value)}
                  className="bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
                <input
                  type="text"
                  placeholder="Responsible individual"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Resources required"
                  value={newResources}
                  onChange={(e) => setNewResources(e.target.value)}
                  className="bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving}>
                {saving ? 'Saving…' : 'Add Item'}
              </Button>
            </div>
          </form>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {items.length === 0
              ? 'No POA&M items yet — add your first finding above.'
              : 'No items match the current filter.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Practice</TableHead>
                <TableHead>Finding</TableHead>
                <TableHead className="w-36">Owner</TableHead>
                <TableHead className="w-28">Due Date</TableHead>
                <TableHead className="w-24">Progress</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.practice_id ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-foreground">{item.finding}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{item.responsible_individual ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-mono">
                      {item.scheduled_completion
                        ? new Date(item.scheduled_completion).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={String(item.milestone_progress)}
                      onValueChange={(v) => handleProgressChange(item.id, parseInt(v))}
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((p) => (
                          <SelectItem key={p} value={String(p)}>{p}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(v) => handleStatusChange(item.id, v as PoamStatus)}
                    >
                      <SelectTrigger className={`h-7 w-28 text-xs border rounded px-2 ${STATUS_COLORS[item.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-muted-foreground hover:text-red-400 text-xs transition-colors"
                      title="Delete"
                    >
                      ×
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 7: Add POA&M to sidebar navigation**

In `src/components/layout/Sidebar.tsx`, add a new nav section after the existing Compliance section (after the Risk Tracker NavItem):

```tsx
        <div className="px-3 py-2 mt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Program Management
          </span>
        </div>

        <NavItem href="/poam" active={pathname === '/poam'}>
          POA&amp;M
        </NavItem>
```

- [ ] **Step 8: Verify POA&M page works**

Open `http://localhost:3000/poam`. Confirm:
- Page loads with empty state message
- "Add Item" button shows the form
- Create a new item: finding="Test finding", practice="AC.L2-3.1.1", owner="Admin"
- Item appears in the table
- Status dropdown changes update immediately
- Progress dropdown changes update immediately
- Delete (×) removes the item

- [ ] **Step 9: Commit**

```bash
cd /Users/gtj105/Documents/obsidian/dashboard
git add scripts/seed.ts src/lib/types.ts src/app/api/poam/route.ts src/app/api/poam/[id]/route.ts src/app/poam/page.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: add POA&M tracker with CRUD API and page"
```

---

## Task 4: Activity Log

Tracks who changed what and when — demonstrates program management maturity to C3PAOs. Without it, you can't prove the program is actively managed. Populated by the existing PATCH handler for practices.

**Files:**
- Modify: `scripts/seed.ts` — add CREATE TABLE + truncate entry
- Modify: `src/app/api/practices/[id]/route.ts` — write history on each update
- Create: `src/app/api/activity/route.ts` — GET paginated activity feed
- Create: `src/app/activity/page.tsx` — client page
- Modify: `src/components/layout/Sidebar.tsx` — add nav item under Program Management
- Modify: `src/lib/types.ts` — add ActivityEntry interface

- [ ] **Step 1: Add practice_history table to seed.ts**

In `scripts/seed.ts`, add this CREATE TABLE block immediately after the `poam_items` CREATE:

```typescript
await sql`
  CREATE TABLE IF NOT EXISTS practice_history (
    id SERIAL PRIMARY KEY,
    practice_id TEXT NOT NULL,
    field_changed TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`
```

Also update the TRUNCATE line to include practice_history:
```typescript
await sql`TRUNCATE practice_history, poam_items, practices, domains, users RESTART IDENTITY CASCADE`
```

- [ ] **Step 2: Run seed to create the table**

```bash
cd /Users/gtj105/Documents/obsidian/dashboard
npm run seed
```

Confirm no errors.

- [ ] **Step 3: Add ActivityEntry type**

In `src/lib/types.ts`, append:

```typescript
export interface ActivityEntry {
  id: number
  practice_id: string
  field_changed: string
  old_value: string | null
  new_value: string | null
  changed_by: string
  changed_at: string
}
```

- [ ] **Step 4: Instrument the PATCH handler to write history**

Replace the full PATCH handler in `src/app/api/practices/[id]/route.ts` with this version. It fetches the row BEFORE updating (to capture old values for history) and restores `risk_level` handling:

```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const { status, risk_level, evidence_exists, owner, due_date, notes } = body

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (risk_level !== undefined && !VALID_RISKS.includes(risk_level)) {
    return NextResponse.json({ error: 'Invalid risk_level' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if ('status' in body) updates.status = status
  if ('risk_level' in body) updates.risk_level = risk_level
  if ('evidence_exists' in body) updates.evidence_exists = evidence_exists
  if ('owner' in body) updates.owner = owner
  if ('due_date' in body) updates.due_date = due_date
  if ('notes' in body) updates.notes = notes

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Fetch current values before updating (for history)
  const [before] = await sql`SELECT * FROM practices WHERE id = ${id}`
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [updated] = await sql`
    UPDATE practices
    SET ${sql(updates)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `

  // Write history for each changed field
  const changedBy = session.user?.email ?? session.user?.name ?? 'unknown'
  for (const [field, newVal] of Object.entries(updates)) {
    const oldVal = (before as Record<string, unknown>)[field]
    if (String(oldVal) !== String(newVal)) {
      await sql`
        INSERT INTO practice_history (practice_id, field_changed, old_value, new_value, changed_by)
        VALUES (${before.practice_id}, ${field}, ${oldVal != null ? String(oldVal) : null}, ${newVal != null ? String(newVal) : null}, ${changedBy})
      `
    }
  }

  return NextResponse.json(updated)
}
```

- [ ] **Step 5: Create activity API route**

Create `src/app/api/activity/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entries = await sql`
    SELECT h.*, d.abbreviation AS domain_abbr
    FROM practice_history h
    LEFT JOIN practices p ON p.practice_id = h.practice_id
    LEFT JOIN domains d ON d.id = p.domain_id
    ORDER BY h.changed_at DESC
    LIMIT 200
  `
  return NextResponse.json(entries)
}
```

- [ ] **Step 6: Create the activity page**

Create `src/app/activity/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import type { ActivityEntry } from '@/lib/types'

const FIELD_LABELS: Record<string, string> = {
  status: 'status',
  evidence_exists: 'evidence',
  owner: 'owner',
  due_date: 'due date',
  notes: 'notes',
}

const STATUS_COLORS: Record<string, string> = {
  'Not Started': 'text-zinc-400',
  'In Progress': 'text-amber-400',
  'Implemented': 'text-blue-400',
  'Audit Ready': 'text-green-400',
}

interface ActivityEntryWithDomain extends ActivityEntry {
  domain_abbr: string | null
}

function formatValue(field: string, value: string | null): string {
  if (value === null || value === '') return 'none'
  if (field === 'evidence_exists') return value === 'true' ? 'yes' : 'no'
  if (field === 'due_date') {
    try {
      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return value }
  }
  return value
}

function formatDate(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ActivityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<ActivityEntryWithDomain[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/activity')
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? 'My Organization'

  if (status === 'loading' || loading) {
    return (
      <AppShell orgName={orgName}>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </AppShell>
    )
  }

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {orgName}
          </span>
        </div>

        <div className="py-4 border-b border-border">
          <div className="text-5xl font-bold leading-none tracking-tight tabular-nums text-foreground">
            {entries.length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest font-medium">
            Activity Log — Recent Changes
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No activity yet — changes to practices will appear here.
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 py-3 group hover:bg-accent/30 px-2 rounded-md transition-colors">
                <div className="w-28 shrink-0 text-right">
                  <span className="text-[11px] font-mono text-muted-foreground">{formatDate(entry.changed_at)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">{entry.changed_by}</span>
                  <span className="text-xs text-muted-foreground mx-1.5">changed</span>
                  <span className="text-xs text-muted-foreground font-medium">{FIELD_LABELS[entry.field_changed] ?? entry.field_changed}</span>
                  <span className="text-xs text-muted-foreground mx-1.5">on</span>
                  <a
                    href={`/risk`}
                    className="font-mono text-xs text-foreground hover:underline underline-offset-2"
                  >
                    {entry.practice_id}
                  </a>
                  {entry.domain_abbr && (
                    <span className="ml-1.5 text-[10px] font-mono text-muted-foreground">[{entry.domain_abbr}]</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {entry.old_value !== null && (
                    <>
                      <span className={`text-xs ${STATUS_COLORS[entry.old_value] ?? 'text-muted-foreground'} line-through`}>
                        {formatValue(entry.field_changed, entry.old_value)}
                      </span>
                      <span className="text-muted-foreground text-xs">→</span>
                    </>
                  )}
                  <span className={`text-xs font-medium ${STATUS_COLORS[entry.new_value ?? ''] ?? 'text-foreground'}`}>
                    {formatValue(entry.field_changed, entry.new_value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 7: Add Activity Log to sidebar**

In `src/components/layout/Sidebar.tsx`, add after the POA&M nav item (in the Program Management section added in Task 3):

```tsx
        <NavItem href="/activity" active={pathname === '/activity'}>
          Activity Log
        </NavItem>
```

- [ ] **Step 8: Verify activity log works end-to-end**

1. Open `http://localhost:3000/activity` — confirm empty state message
2. Go to any domain page (e.g. `/domain/1`)
3. Change a practice status (e.g. AC.L2-3.1.1 from Not Started → In Progress)
4. Return to `/activity` — confirm the change appears in the feed
5. Confirm the format: `[date] [user email] changed status on AC.L2-3.1.1 [AC]` with old → new values
6. Make 3 more changes and confirm they appear, newest first

- [ ] **Step 9: Commit**

```bash
cd /Users/gtj105/Documents/obsidian/dashboard
git add scripts/seed.ts src/lib/types.ts src/app/api/practices/[id]/route.ts src/app/api/activity/route.ts src/app/activity/page.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: add activity log with practice change history"
```

---

## Final Verification

After all 4 tasks:

- [ ] Overview shows SPRS score (animated, color-coded) next to the % score
- [ ] Overview shows amber evidence gap warning when `evidence_exists = false` practices are in Implemented/Audit Ready
- [ ] POA&M page accessible at `/poam`, sidebar shows "POA&M" under Program Management
- [ ] Activity page accessible at `/activity`, sidebar shows "Activity Log" under Program Management
- [ ] Changing a practice status on any domain page creates a history entry visible on `/activity`
- [ ] POA&M CRUD: create, update status, update progress, delete all work without page refresh
- [ ] `npm run seed` still works cleanly (no errors from new tables)

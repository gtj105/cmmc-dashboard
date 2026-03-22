# Assessment Report Export — Design Spec

**Date:** 2026-03-22
**Status:** Approved for implementation
**Author:** Design review + Claude Code

---

## Goal

Give any authenticated user a single print-ready page at `/report` that captures the full CMMC Level 2 compliance posture snapshot — SPRS score, domain completion, evidence gaps, open POA&M items, and recent activity — and lets them export it as a PDF via the browser's native Ctrl+P → Save as PDF flow.

Zero new dependencies. No third-party PDF libraries. No scheduled jobs. Works in every browser.

---

## Architecture

### Route

```
src/app/report/page.tsx        — async server component
src/app/report/report-data.ts  — data-fetching module (parallelize with Promise.all)
```

### Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| Rendering | Server component | Data is read-only; no client interactivity needed |
| Auth | `getServerSession` → redirect `/login` if no session | All authenticated roles (viewer/editor/admin) may view |
| Layout | No `AppShell` | Report renders standalone; sidebar must not appear in print |
| Print mechanism | `@media print` CSS + browser Ctrl+P | Zero complexity, works everywhere |
| Print CSS location | Inline `<style>` tag in `page.tsx` + Tailwind `print:` utilities | No new CSS file needed |
| New dependencies | None | Constraint from approved design |
| Sidebar link | Added under "Program Management" section | Consistent with POA&M / Activity Log placement |

---

## Data Model

All queries live in `src/app/report/report-data.ts` and are executed with `Promise.all` to parallelize independent fetches.

### `fetchReportData()` — parallel fetch shape

```ts
const [
  { baselinePractices, effectivePractices, activePacks },
  [stats],
  openPoamItems,
  recentActivity,
] = await Promise.all([
  fetchEffectivePractices(sql, { framework: 'CMMC' }),
  sql`
    SELECT
      COUNT(*) FILTER (WHERE framework = 'CMMC')::int             AS total_practices,
      COUNT(*) FILTER (
        WHERE framework = 'CMMC'
          AND status IN ('Implemented', 'Audit Ready')
      )::int                                                      AS implemented_count,
      MAX(updated_at)                                             AS last_assessment_date
    FROM practices
  `,
  sql<PoamItem[]>`
    SELECT id, finding, practice_id, owner, resources,
           scheduled_completion, status, created_at
    FROM poam_items
    WHERE status != 'Closed'
    ORDER BY
      CASE status WHEN 'Open' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END,
      scheduled_completion ASC NULLS LAST
  `,
  sql<ActivityEntryWithDomain[]>`
    SELECT h.practice_id, h.field_changed, h.old_value, h.new_value,
           h.changed_by, h.changed_at, d.abbreviation AS domain_abbr
    FROM practice_history h
    LEFT JOIN practices p ON p.practice_id = h.practice_id
    LEFT JOIN domains d   ON d.id = p.domain_id
    ORDER BY h.changed_at DESC
    LIMIT 20
  `,
])
```

### Derived values (computed in-process, no extra queries)

| Value | Source |
|---|---|
| `sprsScore` | `computeSprsScore(effectivePractices.filter(p => p.is_customer_scored))` from `overview-summary.ts` |
| `domainsWithPct` | `buildOverviewDomainSummaries(domains, effectivePractices)` from `overview-summary.ts` |
| `evidenceGap` | `effectivePractices.filter(p => p.is_customer_scored && (p.status === 'Implemented' || p.status === 'Audit Ready') && !p.evidence_exists).length` |
| `statusBreakdown` | Filter `effectivePractices` by `effectivePracticeStatus()` — reuse overview pattern |

Import `computeSprsScore`, `buildOverviewDomainSummaries` directly from `src/app/overview/overview-summary.ts` — do not duplicate.

### Types used (all existing in `src/lib/types.ts`)

- `PoamItem`
- `EffectivePractice`
- `ActivityEntry` (extend with `domain_abbr: string | null`)

---

## Page Structure

```
/report
├── <ReportHeader>          org name · "CMMC Level 2 Assessment Report" · report date
├── <SprsSection>           score card + max + date generated
├── <DomainCompletionTable> 14-row table with status classification
├── <EvidenceGapSection>    single-stat callout
├── <OpenPoamTable>         table of open + in-progress items
└── <RecentActivitySection> last 20 practice_history entries
```

### Section 1 — Report Header

Fields:
- Org name: `process.env.ORG_NAME ?? 'My Organization'`
- Title: "CMMC Level 2 Assessment Report"
- Report date: `new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })`
- Last assessment date: `stats.last_assessment_date` formatted via `formatAssessmentDate()` (reuse from `overview-data.ts`)

### Section 2 — SPRS Score

Fields:
- Current score: `metrics.sprsScore` (range −203 to 110)
- Maximum: 110
- Date generated: report generation timestamp (same as report date)
- Total practices: `stats.total_practices`
- Implemented count: `stats.implemented_count`

Display: large numeric callout, score / 110 fraction, color-coded by threshold:
- ≥ 88: green (On Track)
- 50–87: amber (At Risk)
- < 50: red (Critical)

### Section 3 — Domain Completion Table

Columns: Domain (abbr + full name) | Practices | Complete | % Complete | Status

Status classification per row:
- **On Track**: `completion_pct >= 80`
- **At Risk**: `completion_pct >= 40 && completion_pct < 80`
- **Not Started**: `completion_pct < 40`

Source: `domainsWithPct` array (14 rows, sorted ascending by `completion_pct` — weakest first).

### Section 4 — Evidence Gap

Single stat: count of customer-scored practices with status Implemented or Audit Ready that have `evidence_exists = false`.

Display: prominent number + label "practices missing evidence", brief explanatory sentence.

### Section 5 — Open POA&M Items

Table columns: # | Finding | Practice ID | Responsible Individual | Due Date | Status

Source: `openPoamItems` (pre-filtered to `status != 'Closed'`).

Empty state: "No open POA&M items." single line.

Due date formatted via `formatScheduledCompletion()` (reuse from `poam-page-data.ts`).

### Section 6 — Recent Activity

Last 20 entries from `practice_history` joined to `domains`.

Columns: Date/Time | Practice ID | Domain | Field Changed | Old Value → New Value | Changed By

Source: `recentActivity` query (LIMIT 20).

---

## Print Behavior

### Strategy

The page is authored screen-first with Tailwind classes for the dark theme. A `<style>` block inside the page component overrides everything for `@media print`.

### CSS approach

```html
<style>{`
  @media print {
    /* Force white background, black text */
    * { color: #000 !important; background: #fff !important;
        border-color: #ccc !important; }

    /* Hide browser chrome artifacts */
    @page { margin: 0.75in; size: letter portrait; }

    /* Page breaks */
    .print-break-before { page-break-before: always; }
    .print-avoid-break  { page-break-inside: avoid; }

    /* Hide interactive / nav elements */
    .print-hide { display: none !important; }

    /* Tables render cleanly */
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 10pt; }
    th { background: #f0f0f0 !important; font-weight: 600; }
  }
`}</style>
```

Tailwind `print:hidden` utility applied to:
- Any "Print Report" / "Back" navigation buttons on the page itself

Since the report page does **not** use `AppShell`, the sidebar and top nav are never rendered — no special hiding required for those components.

### Suggested page break placement

- Before Section 3 (Domain Completion Table) — `.print-break-before`
- Before Section 5 (Open POA&M) — `.print-break-before`
- POA&M rows and activity rows — `.print-avoid-break`

---

## File Naming

```
src/app/report/
  page.tsx            — async server component, auth guard, renders all sections
  report-data.ts      — fetchReportData(), returns typed result object
```

No new components directory needed — all sections are local functions/components within `page.tsx` unless the file exceeds ~300 lines, in which case split per-section into the same `src/app/report/` folder.

Reuse (import, do not copy):
- `computeSprsScore`, `buildOverviewDomainSummaries` ← `src/app/overview/overview-summary.ts`
- `formatAssessmentDate` ← `src/app/overview/overview-data.ts`
- `formatScheduledCompletion` ← `src/app/poam/poam-page-data.ts`
- `fetchEffectivePractices` ← `src/lib/overlays.ts`
- `sql` ← `src/lib/db.ts`
- `PoamItem`, `EffectivePractice`, `ActivityEntry` ← `src/lib/types.ts`

---

## Sidebar Link

Add to `src/components/layout/Sidebar.tsx` under the "Program Management" section, after the Activity Log entry:

```tsx
<NavItem href="/report" active={pathname === '/report'}>
  Assessment Report
</NavItem>
```

---

## Auth Pattern

Mirror the existing pattern used in every other page:

```ts
const session = await getServerSession(getAuthOptions())
if (!session) redirect('/login')
// No role check — all authenticated roles may view
```

Session shape: `session.user.email`, `session.user.name`, `session.user.role` (viewer | editor | admin).

---

## Out of Scope

- Scheduled / automated PDF generation
- Email delivery of reports
- Saved/versioned report history
- Custom date range selection
- Filtering by domain or status within the report
- Any third-party PDF library (Puppeteer, jsPDF, react-pdf, etc.)
- Role-gating (all authenticated users can view)
- CSV or Excel export
- Report watermarking or digital signatures

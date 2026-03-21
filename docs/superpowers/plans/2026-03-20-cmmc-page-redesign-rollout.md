# CMMC Page Redesign Rollout Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the domain, compliance, and program-management pages into the same command-surface visual system as the redesigned overview.

**Architecture:** Start by updating the shared visual system that currently drives the old look across multiple pages, then redesign the compliance pages that depend on those shared pieces, and only then redesign the program-management pages. Keep the current data model and route structure intact; the work is primarily layout, hierarchy, component semantics, and page-level interaction framing.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Tailwind CSS, NextAuth, Python `unittest` source-assertion tests

---

## File Structure

**Shared system files**
- Modify: `src/components/PracticeTable.tsx`
- Modify: `src/components/StatusBadge.tsx`
- Modify: `src/components/RiskBadge.tsx`
- Modify: `src/components/FrameworkBadge.tsx`
- Modify: `src/app/globals.css`
- Create: `tests/test_command_surface_system.py`

**Compliance page files**
- Modify: `src/app/domain/[id]/page.tsx`
- Modify: `src/app/itar/page.tsx`
- Modify: `src/app/risk/page.tsx`
- Create: `tests/test_compliance_page_redesign.py`

**Program-management page files**
- Modify: `src/app/poam/page.tsx`
- Modify: `src/app/activity/page.tsx`
- Create: `tests/test_program_management_redesign.py`

**Verification**
- Re-run: `tests/test_overview_command_surface.py`
- Re-run: `tests/test_login_error_handling.py`
- Re-run: `python3 -m unittest discover -s tests`

## Chunk 1: Shared Command-Surface System

### Task 1: Normalize shared badge semantics

**Files:**
- Modify: `src/components/StatusBadge.tsx`
- Modify: `src/components/RiskBadge.tsx`
- Modify: `src/components/FrameworkBadge.tsx`
- Test: `tests/test_command_surface_system.py`

- [ ] **Step 1: Write the failing test**

Add assertions that:
- `Implemented` is no longer styled with decorative blue
- `ITAR` is no longer styled with decorative purple
- badge classes remain semantic and border-based

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_command_surface_system`
Expected: FAIL because the current badge files still include blue/purple decorative styles

- [ ] **Step 3: Write minimal implementation**

Update the badge components so:
- `StatusBadge` uses restrained semantic tones
- `RiskBadge` remains risk-driven
- `FrameworkBadge` becomes quieter and structural rather than decorative

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_command_surface_system`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/StatusBadge.tsx src/components/RiskBadge.tsx src/components/FrameworkBadge.tsx tests/test_command_surface_system.py
git commit -m "feat: normalize dashboard badge semantics"
```

### Task 2: Refactor `PracticeTable` into command-surface table styling

**Files:**
- Modify: `src/components/PracticeTable.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/test_command_surface_system.py`

- [ ] **Step 1: Write the failing test**

Add assertions that `PracticeTable`:
- exposes a denser header/filter pattern
- supports stronger section labeling
- avoids the old generic filter-bar look

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_command_surface_system`
Expected: FAIL because the current table still uses the old filter-bar/table layout

- [ ] **Step 3: Write minimal implementation**

Update `PracticeTable` to:
- use a command-strip style header
- tighten spacing and alignment
- improve inline edit states
- keep the existing mutation behavior unchanged

Add only global tokens/utilities in `globals.css` that support repeated command-surface patterns across pages.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_command_surface_system`
Expected: PASS

- [ ] **Step 5: Run regression suite**

Run: `python3 -m unittest discover -s tests`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/PracticeTable.tsx src/app/globals.css tests/test_command_surface_system.py
git commit -m "feat: restyle shared command-surface table system"
```

## Chunk 2: Compliance Pages

### Task 3: Redesign the domain detail page

**Files:**
- Modify: `src/app/domain/[id]/page.tsx`
- Test: `tests/test_compliance_page_redesign.py`

- [ ] **Step 1: Write the failing test**

Add assertions that the domain page includes:
- an operational header instead of only a percent card
- an immediate-attention or blocker section
- the redesigned shared practice table

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_compliance_page_redesign`
Expected: FAIL because the current page is still summary-card plus table

- [ ] **Step 3: Write minimal implementation**

Redesign the page so it answers:
- what is the current domain state?
- what is blocking progress?
- which controls need action first?

Keep existing data fetching, but derive additional counts from the loaded practices rather than adding new API complexity unless needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_compliance_page_redesign`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/domain/[id]/page.tsx tests/test_compliance_page_redesign.py
git commit -m "feat: redesign cmmc domain detail page"
```

### Task 4: Redesign the ITAR overlay page

**Files:**
- Modify: `src/app/itar/page.tsx`
- Test: `tests/test_compliance_page_redesign.py`

- [ ] **Step 1: Write the failing test**

Add assertions that the ITAR page:
- removes decorative purple summary cards
- adopts the command-surface summary layout
- frames categories as operational signals instead of equal promo cards

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_compliance_page_redesign`
Expected: FAIL because the current ITAR page still uses purple card summaries

- [ ] **Step 3: Write minimal implementation**

Redesign ITAR as an overlay control surface:
- compact header
- category pressure summary
- category exceptions or laggards
- shared practice table below

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_compliance_page_redesign`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/itar/page.tsx tests/test_compliance_page_redesign.py
git commit -m "feat: redesign itar overlay page"
```

### Task 5: Redesign the risk tracker

**Files:**
- Modify: `src/app/risk/page.tsx`
- Test: `tests/test_compliance_page_redesign.py`

- [ ] **Step 1: Write the failing test**

Add assertions that the risk page:
- surfaces triage/urgency before the raw table
- includes stronger operational summary framing
- keeps the filters but integrates them into the new hierarchy

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_compliance_page_redesign`
Expected: FAIL because the current risk page is still a plain filter bar over a table

- [ ] **Step 3: Write minimal implementation**

Restructure the page around:
- top risk signals
- urgent due items or critical counts
- ranked list/table for action

Do not expand backend scope unless data needed for the triage summary is unavailable from `/api/risk`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_compliance_page_redesign`
Expected: PASS

- [ ] **Step 5: Run regression suite**

Run: `python3 -m unittest discover -s tests`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/risk/page.tsx tests/test_compliance_page_redesign.py
git commit -m "feat: redesign risk tracker page"
```

## Chunk 3: Program-Management Pages

### Task 6: Redesign the POA&M page

**Files:**
- Modify: `src/app/poam/page.tsx`
- Test: `tests/test_program_management_redesign.py`

- [ ] **Step 1: Write the failing test**

Add assertions that the POA&M page:
- replaces the old hero metric block
- introduces operational summary sections
- integrates the add-item flow into the new command-surface layout

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_program_management_redesign`
Expected: FAIL because the current page still uses the old KPI strip and generic form block

- [ ] **Step 3: Write minimal implementation**

Restructure POA&M around:
- backlog pressure
- due or aging items
- remediation pipeline
- action entry point for adding findings

Keep current CRUD behavior intact.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_program_management_redesign`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/poam/page.tsx tests/test_program_management_redesign.py
git commit -m "feat: redesign poam management page"
```

### Task 7: Redesign the activity page

**Files:**
- Modify: `src/app/activity/page.tsx`
- Test: `tests/test_program_management_redesign.py`

- [ ] **Step 1: Write the failing test**

Add assertions that the activity page:
- replaces the old hero count block
- includes a stronger “what changed that matters” frame
- distinguishes meaningful change from routine history visually

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_program_management_redesign`
Expected: FAIL because the current page is still count + chronological list

- [ ] **Step 3: Write minimal implementation**

Restructure activity around:
- high-signal recent changes
- chronological feed below
- tighter semantic status color alignment

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_program_management_redesign`
Expected: PASS

- [ ] **Step 5: Run regression suite**

Run: `python3 -m unittest discover -s tests`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/activity/page.tsx tests/test_program_management_redesign.py
git commit -m "feat: redesign activity log page"
```

## Chunk 4: Final Consistency and Verification

### Task 8: Run cross-page consistency pass

**Files:**
- Modify: any of the above files only if necessary
- Test: `tests/test_overview_command_surface.py`
- Test: `tests/test_login_error_handling.py`
- Test: `tests/test_command_surface_system.py`
- Test: `tests/test_compliance_page_redesign.py`
- Test: `tests/test_program_management_redesign.py`

- [ ] **Step 1: Re-read the design context**

Reference: `.impeccable.md`

Confirm all page redesigns still align with:
- credibility through restraint
- density with breathing room
- status-driven color
- no decorative complexity
- expert-first behavior

- [ ] **Step 2: Run targeted verification**

Run:
```bash
python3 -m unittest tests.test_overview_command_surface
python3 -m unittest tests.test_login_error_handling
python3 -m unittest tests.test_command_surface_system
python3 -m unittest tests.test_compliance_page_redesign
python3 -m unittest tests.test_program_management_redesign
```

Expected: all PASS

- [ ] **Step 3: Run full regression suite**

Run:
```bash
python3 -m unittest discover -s tests
```

Expected: PASS

- [ ] **Step 4: Manual visual verification**

Run:
```bash
npm run dev
```

Check:
- `/overview`
- `/domain/1`
- `/risk`
- `/itar`
- `/poam`
- `/activity`

Verify:
- all pages share the same command-surface family
- color semantics are consistent
- headers feel coherent with the overview
- tables and filters feel intentionally designed, not generic

- [ ] **Step 5: Commit final polish**

```bash
git add src/app src/components src/app/globals.css tests
git commit -m "feat: unify dashboard pages under command-surface design system"
```


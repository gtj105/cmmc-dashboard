# GCC High Overlay Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an organization-level overlay system that applies Microsoft 365 GCC High inherited coverage to residual scoring and control views without mutating baseline practice records.

**Architecture:** Add overlay-pack tables and a seeded Microsoft 365 GCC High mapping dataset, then build a centralized effective-responsibility layer that all reporting surfaces read from. Introduce an org-level `Enclave Overlays` page to control pack activation, expose disabled future packs, and surface inherited versus shared responsibility with baseline-versus-residual scoring.

**Tech Stack:** Next.js App Router, TypeScript, NextAuth, Postgres via `postgres` SQL client, React server/client components, Python `unittest` tests

---

## File Map

### Existing files likely to modify

- `src/lib/types.ts`
  Add overlay-related types, effective-practice types, and status enums.
- `scripts/seed.ts`
  Seed overlay packs and the initial Microsoft 365 GCC High mappings.
- `src/components/PracticeTable.tsx`
  Add ownership display and overlay-aware row behavior.
- `src/components/layout/Sidebar.tsx`
  Add navigation entry for `Enclave Overlays`.
- `src/app/overview/page.tsx`
  Show baseline versus residual scoring and overlay-aware blocker logic.
- `src/app/domain/[id]/page.tsx`
  Add residual scoring and control ownership cues.
- `src/app/risk/page.tsx`
  Exclude fully inherited controls and retain shared or validation-required controls.
- `src/app/poam/page.tsx`
  Exclude fully inherited controls from org remediation debt.
- `src/app/api/overview/route.ts`
  Return overlay-aware overview aggregates if this route still backs any client views.
- `src/app/api/risk/route.ts`
  Return overlay-aware risk lists.

### New files likely to create

- `src/lib/overlay-types.ts`
  Narrow overlay-specific shared types if `src/lib/types.ts` becomes crowded.
- `src/lib/overlays.ts`
  Central overlay queries and effective-responsibility computation helpers.
- `src/lib/overlay-scoring.ts`
  Compute baseline and residual aggregates from practices plus mappings.
- `src/app/overlays/page.tsx`
  Org-level `Enclave Overlays` page.
- `src/app/api/overlays/route.ts`
  Read enabled packs and visible pack metadata.
- `src/app/api/overlays/[key]/toggle/route.ts`
  Enable or disable a specific pack.
- `src/app/api/overlays/[key]/mappings/route.ts`
  Return impacted controls for the selected overlay.
- `tests/test_overlay_schema_and_seed.py`
  Lock down schema references and GCC High seed content.
- `tests/test_overlay_scoring.py`
  Verify residual denominator and blocker behavior.
- `tests/test_overlay_page.py`
  Verify page structure and disabled future packs.
- `tests/test_overlay_integration_views.py`
  Verify overview, domain, risk, and POA&M read overlay-aware data.

### Database changes

- Add `overlay_packs`
- Add `overlay_mappings`
- Add `overlay_validations`

If this project keeps schema in SQL migrations, create the migration there. If schema is still seed-and-bootstrap driven, add a small migration/bootstrap script rather than hiding DDL inside unrelated app code.

## Chunk 1: Overlay Data Foundation

### Task 1: Add overlay types

**Files:**
- Modify: `src/lib/types.ts`
- Optional create: `src/lib/overlay-types.ts`
- Test: `tests/test_overlay_schema_and_seed.py`

- [ ] **Step 1: Write the failing test**

Add assertions that the codebase defines these string unions and interfaces:

```python
def test_overlay_types_exist():
    text = read("src/lib/types.ts")
    assert "OverlayPackStatus" in text
    assert "InheritanceType" in text
    assert "EffectivePractice" in text
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_overlay_schema_and_seed -v`
Expected: FAIL because overlay types are not defined yet.

- [ ] **Step 3: Write minimal implementation**

Add types for:

```ts
export type OverlayPackKey = 'm365_gcc_high' | 'azure_government' | 'microsoft_defender' | 'microsoft_purview'
export type OverlayPackStatus = 'available' | 'not_loaded'
export type InheritanceType = 'full' | 'partial' | 'none' | 'validation_required'

export interface OverlayPack { ... }
export interface OverlayMapping { ... }
export interface OverlayValidation { ... }
export interface EffectivePractice extends Practice { ... }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_overlay_schema_and_seed -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/overlay-types.ts tests/test_overlay_schema_and_seed.py
git commit -m "feat: add overlay domain types"
```

### Task 2: Add overlay schema bootstrap

**Files:**
- Modify: `scripts/seed.ts`
- Test: `tests/test_overlay_schema_and_seed.py`

- [ ] **Step 1: Write the failing test**

Assert the seed/bootstrap path includes `overlay_packs`, `overlay_mappings`, and `overlay_validations`.

```python
def test_seed_creates_overlay_tables():
    text = read("scripts/seed.ts")
    assert "overlay_packs" in text
    assert "overlay_mappings" in text
    assert "overlay_validations" in text
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_overlay_schema_and_seed -v`
Expected: FAIL because the tables are not created or referenced.

- [ ] **Step 3: Write minimal implementation**

Extend seed/bootstrap setup to create:

- `overlay_packs`
- `overlay_mappings`
- `overlay_validations`

Include sensible uniqueness:

- `overlay_packs.key` unique
- unique mapping on `overlay_pack_id + practice_id`

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_overlay_schema_and_seed -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/seed.ts tests/test_overlay_schema_and_seed.py
git commit -m "feat: add overlay schema bootstrap"
```

### Task 3: Seed overlay packs and initial GCC High mappings

**Files:**
- Modify: `scripts/seed.ts`
- Test: `tests/test_overlay_schema_and_seed.py`

- [ ] **Step 1: Write the failing test**

Assert that seed data includes the four packs and that only `m365_gcc_high` is marked available.

```python
def test_seed_defines_overlay_packs():
    text = read("scripts/seed.ts")
    assert "m365_gcc_high" in text
    assert "azure_government" in text
    assert "microsoft_defender" in text
    assert "microsoft_purview" in text
```

Add a second test asserting the GCC High seed references Microsoft source URLs.

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_overlay_schema_and_seed -v`
Expected: FAIL because the seed packs and mappings are not present.

- [ ] **Step 3: Write minimal implementation**

Seed:

- four overlay packs
- `m365_gcc_high` status `available`
- other packs status `not_loaded`
- a first-pass GCC High mapping dataset with source title, source URL, inheritance type, rationale, and customer action notes

Do not fake completeness. Include a comment and data shape that support incremental expansion.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_overlay_schema_and_seed -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/seed.ts tests/test_overlay_schema_and_seed.py
git commit -m "feat: seed gcc high overlay pack"
```

## Chunk 2: Effective Responsibility and Scoring

### Task 4: Build overlay query helpers

**Files:**
- Create: `src/lib/overlays.ts`
- Test: `tests/test_overlay_scoring.py`

- [ ] **Step 1: Write the failing test**

Add tests that search for helper names and their expected decision rules.

```python
def test_overlay_helpers_define_effective_resolution():
    text = read("src/lib/overlays.ts")
    assert "resolveEffectiveInheritance" in text
    assert "validation_required" in text
    assert "partial" in text
    assert "full" in text
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_overlay_scoring -v`
Expected: FAIL because helper file does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement helpers to:

- fetch overlay packs
- fetch active packs
- fetch mappings for active packs
- resolve effective inheritance with conservative precedence

Core rule:

```ts
if (hasValidationRequired) return 'validation_required'
if (hasFull) return 'full'
if (hasPartial) return 'partial'
return 'none'
```

If you believe `full` should outrank `validation_required`, document the reasoning and update the spec before implementation. Otherwise stay conservative.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_overlay_scoring -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/overlays.ts tests/test_overlay_scoring.py
git commit -m "feat: add overlay resolution helpers"
```

### Task 5: Build overlay scoring helpers

**Files:**
- Create: `src/lib/overlay-scoring.ts`
- Modify: `src/lib/overlays.ts`
- Test: `tests/test_overlay_scoring.py`

- [ ] **Step 1: Write the failing test**

Add tests asserting the scoring helper excludes `full` from residual denominator and keeps `partial` plus `validation_required` in scope.

```python
def test_scoring_rules_keep_partial_controls_scored():
    text = read("src/lib/overlay-scoring.ts")
    assert "is_customer_scored" in text
    assert "inheritance_type === 'full'" in text
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_overlay_scoring -v`
Expected: FAIL because scoring helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement pure helpers that compute:

- baseline totals
- residual totals
- residual blocker counts
- per-domain residual completion

Use one source of truth for:

```ts
const isCustomerScored = inheritanceType !== 'full'
const isActiveBlocker = isCustomerScored && status === 'Not Started'
```

Extend as needed for current UI rules, but keep the logic centralized.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_overlay_scoring -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/overlay-scoring.ts src/lib/overlays.ts tests/test_overlay_scoring.py
git commit -m "feat: add residual scoring helpers"
```

## Chunk 3: Overlay Control Surface

### Task 6: Add overlays API routes

**Files:**
- Create: `src/app/api/overlays/route.ts`
- Create: `src/app/api/overlays/[key]/toggle/route.ts`
- Create: `src/app/api/overlays/[key]/mappings/route.ts`
- Modify: `src/lib/overlays.ts`
- Test: `tests/test_overlay_page.py`

- [ ] **Step 1: Write the failing test**

Add tests asserting the routes exist and reference:

- pack listing
- pack toggle mutation
- impacted control mappings

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_overlay_page -v`
Expected: FAIL because the routes do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement:

- `GET /api/overlays`
- `POST /api/overlays/[key]/toggle`
- `GET /api/overlays/[key]/mappings`

Guard mutations by session role, following existing admin or editor patterns in the repo.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_overlay_page -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/overlays src/lib/overlays.ts tests/test_overlay_page.py
git commit -m "feat: add overlay api routes"
```

### Task 7: Build the Enclave Overlays page

**Files:**
- Create: `src/app/overlays/page.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/ui/switch.tsx` if needed for disabled treatment only
- Test: `tests/test_overlay_page.py`

- [ ] **Step 1: Write the failing test**

Add tests asserting the page contains:

- `Enclave Overlays`
- four overlay names
- disabled `mapping pack not loaded` states
- residual summary labels

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_overlay_page -v`
Expected: FAIL because the page and nav entry do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Build a server-rendered page with:

- command-surface header
- summary metrics
- four overlay rows
- active toggle for `Microsoft 365 GCC High`
- disabled rows for `Azure Government`, `Microsoft Defender`, `Microsoft Purview`
- impacted controls table for the selected available pack

Add a sidebar entry under organization-level navigation.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_overlay_page -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/overlays/page.tsx src/components/layout/Sidebar.tsx src/components/ui/switch.tsx tests/test_overlay_page.py
git commit -m "feat: add enclave overlays page"
```

## Chunk 4: Overlay-Aware Core Views

### Task 8: Make overview overlay-aware

**Files:**
- Modify: `src/app/overview/page.tsx`
- Modify: `src/app/api/overview/route.ts` if still required
- Modify: `src/lib/overlay-scoring.ts`
- Test: `tests/test_overlay_integration_views.py`

- [ ] **Step 1: Write the failing test**

Add tests asserting overview source includes:

- baseline-versus-residual framing
- residual customer responsibility wording
- overlay-aware blocker or domain usage

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_overlay_integration_views -v`
Expected: FAIL because overview is not overlay-aware yet.

- [ ] **Step 3: Write minimal implementation**

Update overview to:

- show residual score as primary when pack active
- show baseline score as secondary context
- compute blocker and most-exposed-domain summaries from residual responsibility

Keep the current command-surface layout; do not regress it to a generic admin page.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_overlay_integration_views -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/overview/page.tsx src/app/api/overview/route.ts src/lib/overlay-scoring.ts tests/test_overlay_integration_views.py
git commit -m "feat: add overlay-aware overview scoring"
```

### Task 9: Make domain pages and practice table overlay-aware

**Files:**
- Modify: `src/app/domain/[id]/page.tsx`
- Modify: `src/components/PracticeTable.tsx`
- Modify: `src/lib/types.ts`
- Test: `tests/test_overlay_integration_views.py`

- [ ] **Step 1: Write the failing test**

Add tests asserting domain and practice-table sources include ownership cues:

- `Inherited`
- `Shared`
- `Validation required`

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_overlay_integration_views -v`
Expected: FAIL because ownership cues are absent.

- [ ] **Step 3: Write minimal implementation**

Update the domain page summary and `PracticeTable` to:

- surface effective inheritance
- quiet fully inherited controls
- keep shared and validation-required rows actionable

Prefer a focused ownership badge component if the table logic starts to sprawl.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_overlay_integration_views -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/domain/[id]/page.tsx src/components/PracticeTable.tsx src/lib/types.ts tests/test_overlay_integration_views.py
git commit -m "feat: show overlay ownership in control views"
```

### Task 10: Make risk and POA&M overlay-aware

**Files:**
- Modify: `src/app/risk/page.tsx`
- Modify: `src/app/api/risk/route.ts`
- Modify: `src/app/poam/page.tsx`
- Modify: `src/lib/overlay-scoring.ts`
- Test: `tests/test_overlay_integration_views.py`

- [ ] **Step 1: Write the failing test**

Add tests asserting:

- fully inherited controls are excluded from risk triage language or queries
- shared and validation-required controls remain visible
- POA&M language and totals reference customer-owned work

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_overlay_integration_views -v`
Expected: FAIL because risk and POA&M are not overlay-aware yet.

- [ ] **Step 3: Write minimal implementation**

Update risk and POA&M to consume centralized overlay helpers. Do not duplicate scoring filters inline.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_overlay_integration_views -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/risk/page.tsx src/app/api/risk/route.ts src/app/poam/page.tsx src/lib/overlay-scoring.ts tests/test_overlay_integration_views.py
git commit -m "feat: apply overlays to risk and poam"
```

## Chunk 5: Verification and Finish

### Task 11: Run targeted verification

**Files:**
- Test: `tests/test_overlay_schema_and_seed.py`
- Test: `tests/test_overlay_scoring.py`
- Test: `tests/test_overlay_page.py`
- Test: `tests/test_overlay_integration_views.py`

- [ ] **Step 1: Run targeted test files**

Run:

```bash
python3 -m unittest tests.test_overlay_schema_and_seed tests.test_overlay_scoring tests.test_overlay_page tests.test_overlay_integration_views -v
```

Expected: PASS

- [ ] **Step 2: Fix any failures**

Make only the minimal changes needed to address actual test output.

- [ ] **Step 3: Re-run targeted test files**

Run the same command until it passes.

- [ ] **Step 4: Commit**

```bash
git add tests src scripts
git commit -m "test: verify gcc high overlay feature set"
```

### Task 12: Run full verification and manual route checks

**Files:**
- Modify only if failures require it

- [ ] **Step 1: Run the full suite**

Run:

```bash
python3 -m unittest discover -s tests
```

Expected: PASS

- [ ] **Step 2: Start the dev server and check core routes**

Run:

```bash
npm run dev
```

Check:

- `/login`
- `/overview`
- `/overlays`
- `/domain/1`
- `/risk`
- `/poam`

Expected:

- routes render
- disabled placeholder packs are visible
- enabling `Microsoft 365 GCC High` changes residual scoring presentation

- [ ] **Step 3: If build networking is still local-font clean, run production build**

Run:

```bash
npm run build
```

Expected: PASS if no new runtime regressions were introduced. If sandbox or environment blocks it, capture the exact blocker instead of claiming success.

- [ ] **Step 4: Commit**

```bash
git add src scripts tests
git commit -m "feat: finish gcc high overlay rollout"
```

## Notes for the Implementer

- Do not overwrite baseline practice statuses when a pack is enabled.
- Keep overlay logic centralized in helper modules so the scoring rules do not drift between pages.
- Be conservative with `validation_required`; if a Microsoft claim depends on deployment specifics, do not grant inherited credit by default.
- Keep the existing command-surface styling direction; do not regress into generic card grids.
- The repo already has unrelated uncommitted changes. Never revert them.

# GCC High Overlay Handoff

## Current State

The dashboard now includes an organization-level overlay system for four Microsoft overlay packs.

Implemented areas:

- overlay schema in the local Postgres bootstrap path
- org-level `Enclave Overlays` page
- toggle flow with route revalidation and client refresh
- overlay-aware overview, domain, risk, and POA&M behavior
- four seeded overlay packs available but off by default:
  - `Microsoft 365 GCC High`
  - `Azure Government`
  - `Microsoft Defender`
  - `Microsoft Purview`
- ownership labels:
  - `CSP` = Cloud Service Provider
  - `Shared`
  - `OSC` = Organization Seeking Certification

Important behavior:

- `CSP` / fully inherited controls count toward progress to the `110`
- `Shared` controls are automatically treated as `In Progress` when the raw status is still `Not Started`
- `Shared` controls only count as covered when the OSC status reaches `Implemented` or `Audit Ready`
- `Validation required` controls do not count as covered until validated
- risk and POA&M stay focused on work the OSC still needs to do
- the overview keeps the burndown chart and domain radar together in the trend section

## Seeded Mapping Status

The local seed now loads:

- `4` overlay packs
- `236` total overlay mappings

Current pack availability:

- `m365_gcc_high`: `available`
- `azure_government`: `available`
- `microsoft_defender`: `available`
- `microsoft_purview`: `available`

Current pack counts:

- `Microsoft 365 GCC High`: `44`
- `Azure Government`: `92`
- `Microsoft Defender`: `58`
- `Microsoft Purview`: `42`

The mapping sets are still conservative first-pass datasets. They are broader than the original starter pack, but they are not final assessor-grade Microsoft control matrices yet.

## Key Files

Overlay model and scoring:

- `src/lib/types.ts`
- `src/lib/overlays.ts`
- `src/lib/overlay-scoring.ts`

Seed/bootstrap:

- `scripts/seed.ts`

Overlay UI and routes:

- `src/app/overlays/page.tsx`
- `src/app/api/overlays/route.ts`
- `src/app/api/overlays/[key]/toggle/route.ts`
- `src/app/api/overlays/[key]/mappings/route.ts`

Integrated views:

- `src/app/overview/page.tsx`
- `src/app/domain/[id]/page.tsx`
- `src/app/risk/page.tsx`
- `src/app/poam/page.tsx`
- `src/components/PracticeTable.tsx`

Relevant tests:

- `tests/test_overlay_schema_and_seed.py`
- `tests/test_overlay_scoring.py`
- `tests/test_overlay_page.py`
- `tests/test_overlay_integration_views.py`

## How To Run

From the dashboard root:

```bash
cd /Users/gtj105/Documents/obsidian/dashboard
rm -rf .next
npm run seed
npm run dev
```

Then:

- open `http://localhost:3000/login`
- sign in with `admin@localhost` / `admin`
- open `http://localhost:3000/overlays`
- enable `Microsoft 365 GCC High`
- review `http://localhost:3000/overview`

## Verification Snapshot

Last verified working state:

- `python3 -m unittest discover -s tests`
- `./node_modules/.bin/tsc --noEmit --pretty false`

Both were passing when this handoff was written.

## Known Limitations

- None of the four overlay packs are complete for all `110` CMMC controls.
- The mapping sets are intentionally conservative. Many entries are `partial` or `validation_required`.
- There is not yet a dedicated validation-management UI for resolving `validation_required` mappings.
- The overview radar is a deliberate visualization choice; if its semantics change again, update tests and docs at the same time to avoid the drift that happened in this session.

## Recommended Next Steps

1. Add a drilldown view or export for exactly which controls are currently counted as `CSP`, `Shared`, `Validation required`, and `OSC`.
2. Continue expanding all four mapping datasets from the `gcc high` vault and Microsoft primary-source material.
3. Add a validation workflow so `validation_required` mappings can be resolved in-app.
4. Decide whether overlay-specific deployment assumptions should be captured in the UI before more aggressive inherited credit is granted.

## Refactor Priority

The repo does not need a broad rewrite before more work continues, but several files are now too large and are carrying mixed responsibilities.

Highest-value refactor targets:

- `scripts/seed.ts`
  - too much schema bootstrap, seed data, and data content in one file
- `src/app/overlays/page.tsx`
  - route orchestration, client state, and rendering are tightly packed together
- `src/app/overview/page.tsx`
  - too much aggregation, scoring composition, and presentation in one server component
- `src/app/poam/page.tsx`
  - fetch orchestration, overlay filtering, form logic, and rendering are all in one client page
- `src/lib/overlays.ts`
  - query helpers and effective-practice resolution logic are mixed in one module

Recommended refactor shape:

- move overlay seed data to a dedicated data file such as `scripts/data/gcc-high-mappings.ts`
- split `src/lib/overlays.ts` into:
  - query functions
  - effective-practice resolution helpers
- extract overview/domain summary card builders into smaller helpers or components
- extract the overlays page state machine into a dedicated hook

The codebase is messy in specific areas, but it is still recoverable with targeted refactors. It does not need a stop-everything rewrite.

# Four-Pack Overlay Expansion Implementation Plan

## Objective

Implement four available overlay packs in the dashboard using the source material in `/Users/gtj105/Documents/obsidian/gcc high`:

- `Microsoft 365 GCC High`
- `Azure Government`
- `Microsoft Defender`
- `Microsoft Purview`

Preserve the current scoring model and keep uncertain inherited coverage as `validation_required`.

## Phase 1: Seed data restructure

### Goal

Replace the single-pack seed-data layout with a pack-oriented structure that is maintainable as mapping volume grows.

### Tasks

1. Create pack-specific mapping files under `scripts/data/`:
   - `m365-gcc-high-mappings.ts`
   - `azure-government-mappings.ts`
   - `microsoft-defender-mappings.ts`
   - `microsoft-purview-mappings.ts`
2. Add a small index file such as `scripts/data/overlay-pack-index.ts` that exports pack keys, labels, notes, and mapping arrays.
3. Update `scripts/seed.ts` to import pack data from the new index rather than from a single GCC High mapping file.
4. Update any seed-focused tests that assume one mapping file.

### Verification

- `python3 -m unittest tests.test_overlay_schema_and_seed -v`
- `./node_modules/.bin/tsc --noEmit --pretty false`

## Phase 2: Mapping completion from the gcc high vault

### Goal

Populate conservative first-pass datasets for all four packs from the local source material.

### Tasks

1. Review overlay-scoping notes in:
   - `07 Scoping/Overlay - Microsoft 365 Services.md`
   - `07 Scoping/Overlay - Azure Government GCC High.md`
   - `07 Scoping/Overlay - Microsoft Defender.md`
   - `07 Scoping/Overlay - Microsoft Purview.md`
2. Use the placemat index and control notes to map controls into:
   - `full`
   - `partial`
   - `validation_required`
   - `none`
3. Add rationale, source titles, source paths/URLs, customer actions, and notes for each mapping.
4. Keep claims conservative:
   - default to `validation_required` when deployment or boundary assumptions are not explicit
   - avoid `full` unless the source material clearly supports provider-delivered coverage

### Verification

- add or update tests asserting all four pack datasets exist and contain mappings
- add or update tests asserting multiple pack keys appear in seed data

## Phase 3: Activate all four packs in the app

### Goal

Make the three current placeholders load as real available packs after seed.

### Tasks

1. Update seed/bootstrap defaults so:
   - `m365_gcc_high` = `available`
   - `azure_government` = `available`
   - `microsoft_defender` = `available`
   - `microsoft_purview` = `available`
2. Ensure the overlays page inventory renders all four as togglable packs.
3. Ensure summary and impacted-control endpoints return pack data for all four.

### Verification

- `python3 -m unittest tests.test_overlay_page -v`
- reseed local DB and confirm `/overlays` shows four available packs

## Phase 4: Multi-pack composition verification

### Goal

Confirm the existing effective inheritance resolver behaves correctly when multiple packs are active at the same time.

### Tasks

1. Add or update scoring tests to cover overlapping mappings across packs.
2. Verify precedence remains conservative when multiple packs affect a single practice.
3. Confirm `validation_required` still blocks coverage until validated.
4. Confirm `full` and `partial` interactions do not break residual/customer-owned visibility.

### Verification

- `python3 -m unittest tests.test_overlay_scoring -v`
- `python3 -m unittest tests.test_overlay_integration_views -v`

## Phase 5: Integrated view verification

### Goal

Confirm the app surfaces still behave correctly with multiple real packs available and active.

### Tasks

1. Reseed database with the new four-pack data.
2. Verify:
   - `/overlays`
   - `/overview`
   - `/domain/<id>`
   - `/risk`
   - `/poam`
3. Confirm:
   - overview coverage updates as packs are enabled
   - risk excludes fully inherited controls
   - POA&M remains focused on OSC/shared work
   - practice ownership cues remain correct

### Verification

- `python3 -m unittest discover -s tests`
- `./node_modules/.bin/tsc --noEmit --pretty false`
- local manual check after `npm run seed` and `npm run dev`

## Expected File Areas

Primary files likely affected:

- `scripts/seed.ts`
- `scripts/data/overlay-pack-index.ts`
- `scripts/data/m365-gcc-high-mappings.ts`
- `scripts/data/azure-government-mappings.ts`
- `scripts/data/microsoft-defender-mappings.ts`
- `scripts/data/microsoft-purview-mappings.ts`
- `src/app/overlays/page.tsx`
- `src/app/api/overlays/route.ts`
- tests under `tests/`

## Guardrails

- do not change the ownership/scoring model in this implementation
- do not convert uncertain mappings into `full` or `partial` just to improve the score
- do not introduce a validation-management UI in this phase
- do not overwrite the raw control status model

## Completion Criteria

This implementation is complete when:

- four overlay packs are available in the UI
- the new seed structure is pack-specific and maintainable
- the mapping sets are loaded from the local `gcc high` source material
- uncertain controls remain `validation_required`
- verification passes end to end

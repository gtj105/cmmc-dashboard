# Four-Pack Overlay Expansion Design

## Goal

Expand the dashboard's overlay system from a single first-pass `Microsoft 365 GCC High` pack into four implemented org-level overlay packs sourced from the material in `/Users/gtj105/Documents/obsidian/gcc high`:

- `Microsoft 365 GCC High`
- `Azure Government`
- `Microsoft Defender`
- `Microsoft Purview`

The app should continue to use the current ownership/scoring model:

- `full` maps to `CSP` ownership and counts toward progress to the 110
- `partial` maps to `Shared`
- `validation_required` does not count as covered until validated
- `none` remains `OSC`

The implementation should stay conservative. When the vault material is not strong enough to justify inherited credit outright, the mapping must be seeded as `validation_required`.

## Current State

The current dashboard already includes:

- overlay schema and bootstrap support
- an `Enclave Overlays` page
- a toggle flow that revalidates dependent views
- overlay-aware overview, domain, risk, and POA&M pages
- a first-pass `Microsoft 365 GCC High` mapping set with `30` mappings

Current limitations:

- only `m365_gcc_high` is available
- `azure_government`, `microsoft_defender`, and `microsoft_purview` are placeholders
- the seed dataset is not complete across the 110 CMMC Level 2 controls
- uncertain mappings are not yet backed by a richer validation-management workflow

## Source Material

Primary implementation material for this expansion comes from the local vault at `/Users/gtj105/Documents/obsidian/gcc high`, especially:

- `master-library-gcc high/07 Scoping/Overlay - Microsoft 365 Services.md`
- `master-library-gcc high/07 Scoping/Overlay - Azure Government GCC High.md`
- `master-library-gcc high/07 Scoping/Overlay - Microsoft Defender.md`
- `master-library-gcc high/07 Scoping/Overlay - Microsoft Purview.md`
- `master-library-gcc high/07 Scoping/Microsoft Placemat Overlay Index.md`
- the family and control notes under `master-library-gcc high/01 Controls/`
- `Microsoft_Product_Placemat_for_CMMC.xlsm`

These vault materials should be treated as the implementation source set for the local seed pack, not as a replacement for the dashboard's current data model.

## Design

### 1. Overlay pack model

The existing overlay-pack schema is sufficient and should be preserved. The app should expose four available packs:

- `m365_gcc_high`
- `azure_government`
- `microsoft_defender`
- `microsoft_purview`

All four packs should be present and selectable on the overlays page once the seed data is loaded.

### 2. Seed data structure

The current single-file seed strategy does not scale to four packs cleanly. Seed data should be reorganized into one source file per overlay pack under `scripts/data/`, with a small index that exports pack metadata and mapping arrays.

Recommended structure:

- `scripts/data/m365-gcc-high-mappings.ts`
- `scripts/data/azure-government-mappings.ts`
- `scripts/data/microsoft-defender-mappings.ts`
- `scripts/data/microsoft-purview-mappings.ts`
- `scripts/data/overlay-pack-index.ts`

Each file should export a strongly typed array of `SeedOverlayMapping` objects plus any shared note constants needed for that pack.

The seed script should import these pack datasets rather than carrying overlay content inline.

### 3. Conservative mapping rules

Mapping guidance for this release:

- use `full` only where the source material clearly supports provider-delivered coverage
- use `partial` where the service materially supports the control but the OSC still has significant implementation responsibility
- use `validation_required` when the vault material suggests support but the inherited claim depends on tenant configuration, service deployment, boundary placement, or policy enforcement details
- use `none` where the control remains fully owned by the OSC

This release should prefer under-claiming inheritance over over-claiming it.

### 4. UI behavior

The overlays page should keep the current interaction model, but its pack inventory should change from:

- one available pack
- three disabled placeholders

to:

- four available packs

The page should continue to show:

- impacted control count
- `full`, `partial`, `validation_required`, and `none` counts
- per-pack source/rationale/customer-action detail for impacted controls

No new UI concept is required for this phase. The objective is to make the existing surface fully populated and reliable.

### 5. Scoring and integrated views

No new scoring model is needed.

Existing behavior should continue unchanged:

- overview progress is coverage-first and counts `full` CSP coverage toward the 110
- shared controls only count when the OSC status is complete
- `validation_required` does not count as covered until validated
- risk and POA&M remain focused on work the OSC still needs to do

The important implementation constraint is that activating multiple packs at once must compose safely using the existing effective-inheritance resolution logic.

### 6. Validation scope for this release

This release should not introduce a new validation-management UI. The current `validation_required` model is enough to safely ship a broader mapping dataset.

That means:

- uncertain mappings can be loaded now
- they remain visible and auditable
- they do not inflate coverage until validated

## Implementation Outline

1. Restructure overlay seed data into pack-specific files.
2. Build completed first-pass mapping datasets for all four packs from the `gcc high` vault.
3. Update the seed/bootstrap so all four packs load as `available`.
4. Reseed and confirm overlay summaries and toggle behavior with multiple packs.
5. Verify overview/domain/risk/POA&M behavior under multi-pack activation.

## Testing

Testing should cover:

- seed-file structure and presence of all four pack datasets
- available-pack state for all four packs after seed
- mapping counts per pack
- multi-pack overlay composition using the existing effective inheritance resolver
- overlays page rendering of all four available packs
- integration behavior in overview, domains, risk, and POA&M with multiple packs active

## Risks

The main risk is not code complexity. It is mapping quality.

Specific risks:

- over-claiming inherited credit from suggestive but not decisive source material
- duplicating or conflicting mappings across packs for the same control
- allowing one pack's `full` mapping to hide nuance that should remain `partial` or `validation_required` when multiple packs are active

The mitigation is to keep the seed datasets conservative and traceable.

## Success Criteria

This work is complete when:

- all four overlay packs are seeded and available in the UI
- the app can enable them independently
- the mapping datasets are sourced from the local `gcc high` vault materials
- uncertain mappings stay `validation_required`
- tests and TypeScript verification pass

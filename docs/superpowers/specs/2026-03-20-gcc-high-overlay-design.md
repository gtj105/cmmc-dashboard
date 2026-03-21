# GCC High Overlay Design

Date: 2026-03-20
Status: Draft for review

## Goal

Add an organization-level overlay system that applies Microsoft inherited coverage to the existing CMMC dashboard without mutating baseline practice records. The first released mapping pack targets `Microsoft 365 GCC High`. The product must:

- show inherited, shared, and customer-owned responsibility clearly
- recalculate scores based on residual customer responsibility
- preserve the raw baseline view for auditability
- leave room for later overlay packs such as `Azure Government`, `Microsoft Defender`, and `Microsoft Purview`

## Scope

This design adds:

- an org-level `Enclave Overlays` page
- overlay pack toggles
- seeded `Microsoft 365 GCC High` control mappings
- computed residual scoring across overview, domains, risk, POA&M, and control tables
- disabled placeholder toggles for `Azure Government`, `Microsoft Defender`, and `Microsoft Purview`

This design does not add:

- multi-enclave or per-boundary modeling
- automatic Microsoft tenant discovery
- service deployment verification automation
- seeded mappings for Azure Government, Defender, or Purview in the first release

## Product Model

The system keeps baseline compliance data unchanged and adds a computed responsibility layer on top of it.

- Baseline data: the current `practices` table and existing workflow
- Overlay data: seeded control mappings tied to overlay packs
- Effective responsibility: the result of applying enabled overlay packs to baseline practices

The first release treats overlays as organization-level settings. A toggle affects the entire organization and all reporting views.

## Overlay Packs

The org-level UI exposes four overlay rows:

1. `Microsoft 365 GCC High`
2. `Azure Government`
3. `Microsoft Defender`
4. `Microsoft Purview`

First-release behavior:

- `Microsoft 365 GCC High` is available and can be enabled
- `Azure Government`, `Microsoft Defender`, and `Microsoft Purview` are shown as disabled with `mapping pack not loaded`

Each row shows:

- overlay name
- provider
- status: `active`, `available`, or `not_loaded`
- affected control count
- count of `full`, `partial`, and `validation_required` mappings
- short note about residual scoring impact

## Inheritance Semantics

Each practice mapping uses one of four inheritance types:

- `full`: Microsoft coverage removes the control from the customer-owned denominator
- `partial`: the control remains in scope for customer scoring and remediation, but is labeled as shared responsibility
- `none`: overlay has no scoring effect on the control
- `validation_required`: mapping is seeded from Microsoft guidance but should not grant inherited credit until the organization confirms the required deployment assumptions

The product must not convert inherited coverage into false completion. Overlays modify responsibility, not baseline status.

## Scoring Rules

The app should calculate two score views:

- `Baseline score`: current score from raw practice statuses
- `Residual score`: score after enabled overlays are applied

Residual scoring rules:

- `full`
  - remove the control from the customer-owned denominator
  - exclude the control from active blocker counts, domain exposure counts, risk ranking, and POA&M responsibility totals
- `partial`
  - keep the control in the denominator
  - keep the control visible in blocker, risk, and POA&M views
  - label the control as shared responsibility
- `none`
  - no behavior change
- `validation_required`
  - treat as customer-owned until validated
  - surface in review-oriented UI so the org can confirm the claim

The main dashboard should prioritize residual customer responsibility whenever an overlay is enabled, while still exposing the baseline score as reference context.

## Data Model

Add three new tables.

### `overlay_packs`

- `id`
- `key` unique, such as `m365_gcc_high`
- `name`
- `provider`
- `status` enum-like string: `available`, `not_loaded`
- `enabled` boolean
- `description`
- `created_at`
- `updated_at`

### `overlay_mappings`

- `id`
- `overlay_pack_id`
- `practice_id`
- `inheritance_type` string: `full`, `partial`, `none`, `validation_required`
- `source_title`
- `source_url`
- `rationale`
- `customer_actions`
- `notes`
- `created_at`
- `updated_at`

### `overlay_validations`

- `id`
- `overlay_mapping_id`
- `validated` boolean
- `resolved_inheritance_type` nullable string: `full`, `partial`, or `none`
- `validated_by`
- `validated_at`
- `validation_notes`

This structure keeps source traceability, organization validation, and future overlay expansion separated from baseline control records.

## Effective Responsibility Layer

The application should compute an effective practice view at read time rather than mutating `practices`.

Derived fields should include:

- `effective_inheritance_type`
- `is_customer_scored`
- `is_shared_responsibility`
- `is_fully_inherited`
- `requires_validation`
- `effective_blocker`
- `effective_risk_visibility`
- `effective_poam_visibility`

If multiple overlays are enabled in the future, the effective layer should resolve by strongest inherited effect while preserving validation safety:

- `validation_required` never grants credit
- `full` overrides `none`
- `partial` overrides `none`
- `partial` does not override `full`

For the first release, only one enabled mapping pack is expected, but the logic should not assume that forever.

## Page Behavior

### Enclave Overlays Page

Add a new org-level page called `Enclave Overlays`.

Header summary:

- active overlays
- residual customer-owned controls
- fully inherited controls
- shared controls still requiring action

Main content:

- four overlay rows with toggle state and pack status
- impacted controls table when an available pack is selected
- grouping and filtering by `Fully inherited`, `Partially inherited`, and `Validation required`

Impacted controls table columns:

- practice ID
- title
- inheritance type
- source
- customer action
- validation state

### Overview

When an overlay is active:

- main score reflects residual customer responsibility
- baseline score remains visible as secondary context
- blocker counts exclude fully inherited controls
- shared and validation-required controls remain in exposure counts
- domain ranking uses residual exposure, not baseline totals

### Domain Pages

Add ownership cues per control:

- `Inherited`
- `Shared`
- `Customer`
- `Validation required`

Domain completion and immediate-attention summaries should reflect residual responsibility. Fully inherited controls stay visible for audit traceability but should be visually quieter and excluded from the attention panel.

### Practice Table

Add an ownership column or compact responsibility badge. Partial mappings remain editable because customer action still exists. Fully inherited controls remain visible but should not behave like customer remediation items in overlay-aware contexts.

### Risk

Exclude fully inherited controls from the default triage list. Keep partial and validation-required controls visible because they still create customer work or uncertainty.

### POA&M

Exclude fully inherited controls from org remediation debt. Partial and validation-required controls stay in scope.

## Mapping Seed Strategy

The first seeded pack is `Microsoft 365 GCC High`.

Primary source documents:

- Microsoft Product Placemat for CMMC: `https://aka.ms/cmmc/productplacemat`
- Microsoft Technical Reference Guide for CMMC: `https://aka.ms/cmmc/techrefguide`
- Office 365 GCC High and DoD service description: `https://learn.microsoft.com/en-us/office365/servicedescriptions/office-365-platform-service-description/office-365-us-government/gcc-high-and-dod`
- Office 365 US Government service description: `https://learn.microsoft.com/en-us/office365/servicedescriptions/office-365-platform-service-description/office-365-us-government/office-365-us-government`

Seeding rules:

- use `full` only when Microsoft documentation clearly supports provider coverage for that control responsibility
- use `partial` when documentation indicates shared responsibility
- use `validation_required` when control benefit depends on actual tenant configuration, license deployment, or implementation choices
- include source title, source URL, rationale, and customer action notes on every seeded mapping row

The seeded dataset should be described in-product as documentation-based and subject to organization validation for selected controls.

## Validation Model

Validation is required where Microsoft documentation supports potential inheritance but actual customer deployment determines whether credit is defensible.

Examples include:

- features that depend on licensing and configuration
- service capabilities that require admin enablement or policy deployment
- controls where Microsoft guidance is directionally supportive but not sufficient for automatic inherited credit

Validation workflow:

1. mapping seeded as `validation_required`
2. overlay enabled
3. UI shows pending validation state
4. org validates or rejects the claim, recording the resolved inherited outcome when credit is granted
5. effective responsibility updates accordingly

If validation is not complete, the app must remain conservative and continue scoring the control as customer-owned.

## Testing

Release-one coverage should include:

- data-layer tests for effective responsibility resolution
- scoring tests proving fully inherited controls leave the denominator
- tests proving partial and validation-required controls stay in blocker, risk, and POA&M views
- page tests for overlay toggle rendering and disabled future packs
- tests for baseline-versus-residual presentation on overview and domain pages

## Implementation Notes

- keep the baseline `practices` schema intact
- prefer overlay-aware helper functions or views over duplicating scoring logic across routes
- design the schema for future packs without forcing multi-enclave support now
- ensure the UI language consistently distinguishes provider responsibility from customer completion

## Risks

- overstating inherited credit if mappings are too aggressive
- confusing users if baseline and residual scoring are not clearly labeled
- scattering responsibility logic across multiple pages instead of centralizing it
- future extension pain if overlay precedence is not defined upfront

## Recommendation

Implement the overlay system as an organization-level computed responsibility layer with separate overlay-pack toggles. Seed `Microsoft 365 GCC High` first, keep `Azure Government`, `Microsoft Defender`, and `Microsoft Purview` visible but disabled, and drive all downstream scoring from residual customer responsibility rather than mutated control status.

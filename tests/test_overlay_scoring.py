import json
import pathlib
import subprocess
import tempfile
import textwrap
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
NODE = "node"
OVERLAY_SCORING_URL = (ROOT / "src/lib/overlay-scoring.ts").as_uri()
OVERLAYS_URL = (ROOT / "src/lib/overlays.ts").as_uri()
OVERLAY_RESOLUTION_URL = (ROOT / "src/lib/overlay-resolution.ts").as_uri()
TYPES_URL = (ROOT / "src/lib/types.ts").as_uri()


def run_ts(code: str) -> dict:
    with tempfile.NamedTemporaryFile("w", suffix=".ts", delete=False) as handle:
        rendered = textwrap.dedent(code)
        rendered = rendered.replace("__OVERLAY_SCORING_URL__", OVERLAY_SCORING_URL)
        rendered = rendered.replace("__OVERLAYS_URL__", OVERLAYS_URL)
        rendered = rendered.replace("__OVERLAY_RESOLUTION_URL__", OVERLAY_RESOLUTION_URL)
        rendered = rendered.replace("__TYPES_URL__", TYPES_URL)
        handle.write(rendered)
        temp_path = pathlib.Path(handle.name)

    try:
        result = subprocess.run(
            [NODE, "--experimental-strip-types", str(temp_path)],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(result.stdout)
    finally:
        temp_path.unlink(missing_ok=True)


class OverlayScoringTests(unittest.TestCase):
    def test_resolve_effective_inheritance_uses_conservative_precedence(self) -> None:
        result = run_ts(
            """
            import { resolveEffectiveInheritance } from '__OVERLAY_RESOLUTION_URL__'

            const cases = [
              resolveEffectiveInheritance(['none', 'partial']),
              resolveEffectiveInheritance(['partial', 'full']),
              resolveEffectiveInheritance(['full', 'validation_required']),
              resolveEffectiveInheritance(['partial', 'validation_required']),
              resolveEffectiveInheritance(['none', 'validation_required']),
              resolveEffectiveInheritance(['none']),
            ]

            console.log(JSON.stringify(cases))
            """
        )

        self.assertEqual(
            result,
            ['partial', 'full', 'full', 'partial', 'validation_required', 'none'],
        )

    def test_overlay_scoring_helpers_separate_baseline_coverage_and_residual_totals(self) -> None:
        result = run_ts(
            """
            import { computeBaselineTotals, computeCoverageTotals, computeResidualBlockerCount, computeResidualTotals, computePerDomainCoverageCompletion, computePerDomainResidualCompletion } from '__OVERLAY_SCORING_URL__'
            import type { EffectivePractice, Practice } from '__TYPES_URL__'

            const base = (overrides: Partial<Practice>): Practice => ({
              id: overrides.id ?? 0,
              domain_id: overrides.domain_id ?? 1,
              framework: overrides.framework ?? 'CMMC',
              practice_id: overrides.practice_id ?? 'AC.L2-3.1.1',
              title: overrides.title ?? 'Sample',
              description: overrides.description ?? '',
              status: overrides.status ?? 'Not Started',
              risk_level: overrides.risk_level ?? 'Medium',
              owner: overrides.owner ?? null,
              due_date: overrides.due_date ?? null,
              evidence_exists: overrides.evidence_exists ?? false,
              notes: overrides.notes ?? null,
              created_at: overrides.created_at ?? '2026-03-20T00:00:00Z',
              updated_at: overrides.updated_at ?? '2026-03-20T00:00:00Z',
            })

            const practices: Practice[] = [
              base({ id: 1, domain_id: 1, practice_id: 'AC.1', status: 'Not Started', risk_level: 'High' }),
              base({ id: 2, domain_id: 1, practice_id: 'AC.2', status: 'Implemented', risk_level: 'Low' }),
              base({ id: 3, domain_id: 2, practice_id: 'IA.1', status: 'In Progress', risk_level: 'Critical' }),
              base({ id: 4, domain_id: 2, practice_id: 'IA.2', status: 'Audit Ready', risk_level: 'Medium' }),
            ]

            const effectivePractices: EffectivePractice[] = [
              { ...practices[0], overlay_pack_key: 'm365_gcc_high', overlay_pack_name: 'Microsoft 365 GCC High', inheritance_type: 'full', effective_inheritance_type: 'full', source_title: 'x', source_url: 'x', customer_actions: 'x', effective_blocker: false, effective_risk_visibility: false, effective_poam_visibility: false, is_customer_scored: false, is_shared_responsibility: false, is_fully_inherited: true, requires_validation: false },
              { ...practices[1], overlay_pack_key: 'm365_gcc_high', overlay_pack_name: 'Microsoft 365 GCC High', inheritance_type: 'partial', effective_inheritance_type: 'partial', source_title: 'x', source_url: 'x', customer_actions: 'x', effective_blocker: false, effective_risk_visibility: true, effective_poam_visibility: true, is_customer_scored: true, is_shared_responsibility: true, is_fully_inherited: false, requires_validation: false },
              { ...practices[2], overlay_pack_key: 'm365_gcc_high', overlay_pack_name: 'Microsoft 365 GCC High', inheritance_type: 'validation_required', effective_inheritance_type: 'validation_required', source_title: 'x', source_url: 'x', customer_actions: 'x', effective_blocker: true, effective_risk_visibility: true, effective_poam_visibility: true, is_customer_scored: true, is_shared_responsibility: false, is_fully_inherited: false, requires_validation: true },
              { ...practices[3], overlay_pack_key: null, overlay_pack_name: null, inheritance_type: null, effective_inheritance_type: 'none', source_title: null, source_url: null, customer_actions: null, effective_blocker: false, effective_risk_visibility: true, effective_poam_visibility: true, is_customer_scored: true, is_shared_responsibility: false, is_fully_inherited: false, requires_validation: false },
            ]

            const baseline = computeBaselineTotals(practices)
            const coverage = computeCoverageTotals(effectivePractices)
            const residual = computeResidualTotals(effectivePractices)
            const blockers = computeResidualBlockerCount(effectivePractices)
            const byCoverageDomain = computePerDomainCoverageCompletion(effectivePractices)
            const byDomain = computePerDomainResidualCompletion(effectivePractices)

            console.log(JSON.stringify({ baseline, coverage, residual, blockers, byCoverageDomain, byDomain }))
            """
        )

        self.assertEqual(result["baseline"], {
            "total": 4,
            "not_started": 1,
            "in_progress": 1,
            "implemented": 1,
            "audit_ready": 1,
            "score_pct": 50,
        })
        self.assertEqual(result["coverage"], {
            "total": 4,
            "not_started": 0,
            "in_progress": 1,
            "osc_complete": 2,
            "csp_inherited": 1,
            "total_covered": 3,
            "customer_owned_remaining": 1,
            "score_pct": 75,
        })
        self.assertEqual(result["residual"], {
            "total": 4,
            "customer_owned_total": 3,
            "full": 1,
            "partial": 1,
            "none": 1,
            "validation_required": 1,
            "implemented": 1,
            "audit_ready": 1,
            "in_progress": 1,
            "not_started": 0,
            "score_pct": 67,
        })
        self.assertEqual(result["blockers"], 1)
        self.assertEqual(result["byCoverageDomain"], [
            {"domain_id": 1, "total": 2, "not_started": 0, "in_progress": 0, "osc_complete": 1, "csp_inherited": 1, "total_covered": 2, "customer_owned_remaining": 0, "completion_pct": 100},
            {"domain_id": 2, "total": 2, "not_started": 0, "in_progress": 1, "osc_complete": 1, "csp_inherited": 0, "total_covered": 1, "customer_owned_remaining": 1, "completion_pct": 50},
        ])
        self.assertEqual(result["byDomain"], [
            {"domain_id": 1, "total": 1, "implemented": 1, "audit_ready": 0, "in_progress": 0, "not_started": 0, "completion_pct": 100},
            {"domain_id": 2, "total": 2, "implemented": 0, "audit_ready": 1, "in_progress": 1, "not_started": 0, "completion_pct": 50},
        ])

    def test_effective_practice_status_promotes_shared_and_validation_required_not_started_controls(self) -> None:
        result = run_ts(
            """
            import {
              effectivePracticeStatus,
              computeCoverageTotals,
              computeResidualTotals,
            } from '__OVERLAY_SCORING_URL__'
            import type { EffectivePractice, Practice } from '__TYPES_URL__'

            const base = (overrides: Partial<Practice>): Practice => ({
              id: overrides.id ?? 0,
              domain_id: overrides.domain_id ?? 1,
              framework: overrides.framework ?? 'CMMC',
              practice_id: overrides.practice_id ?? 'AC.L2-3.1.1',
              title: overrides.title ?? 'Sample',
              description: overrides.description ?? '',
              status: overrides.status ?? 'Not Started',
              risk_level: overrides.risk_level ?? 'Medium',
              owner: overrides.owner ?? null,
              due_date: overrides.due_date ?? null,
              evidence_exists: overrides.evidence_exists ?? false,
              notes: overrides.notes ?? null,
              created_at: overrides.created_at ?? '2026-03-20T00:00:00Z',
              updated_at: overrides.updated_at ?? '2026-03-20T00:00:00Z',
            })

            const effectivePractices: EffectivePractice[] = [
              { ...base({ id: 1, practice_id: 'AC.1', status: 'Not Started' }), overlay_pack_key: 'm365_gcc_high', overlay_pack_name: 'Microsoft 365 GCC High', inheritance_type: 'partial', effective_inheritance_type: 'partial', source_title: 'x', source_url: 'x', customer_actions: 'x', effective_blocker: true, effective_risk_visibility: true, effective_poam_visibility: true, is_customer_scored: true, is_shared_responsibility: true, is_fully_inherited: false, requires_validation: false },
              { ...base({ id: 2, practice_id: 'AC.2', status: 'Not Started' }), overlay_pack_key: 'm365_gcc_high', overlay_pack_name: 'Microsoft 365 GCC High', inheritance_type: 'validation_required', effective_inheritance_type: 'validation_required', source_title: 'x', source_url: 'x', customer_actions: 'x', effective_blocker: true, effective_risk_visibility: true, effective_poam_visibility: true, is_customer_scored: true, is_shared_responsibility: false, is_fully_inherited: false, requires_validation: true },
              { ...base({ id: 3, practice_id: 'AC.3', status: 'Not Started' }), overlay_pack_key: null, overlay_pack_name: null, inheritance_type: null, effective_inheritance_type: 'none', source_title: null, source_url: null, customer_actions: null, effective_blocker: true, effective_risk_visibility: true, effective_poam_visibility: true, is_customer_scored: true, is_shared_responsibility: false, is_fully_inherited: false, requires_validation: false },
            ]

            console.log(JSON.stringify({
              statuses: effectivePractices.map((practice) => effectivePracticeStatus(practice)),
              coverage: computeCoverageTotals(effectivePractices),
              residual: computeResidualTotals(effectivePractices),
            }))
            """
        )

        self.assertEqual(result["statuses"], ["In Progress", "In Progress", "Not Started"])
        self.assertEqual(result["coverage"]["in_progress"], 2)
        self.assertEqual(result["coverage"]["not_started"], 1)
        self.assertEqual(result["residual"]["in_progress"], 2)
        self.assertEqual(result["residual"]["not_started"], 1)

    def test_per_domain_residual_completion_treats_all_fully_inherited_domain_as_complete(self) -> None:
        result = run_ts(
            """
            import { computePerDomainResidualCompletion } from '__OVERLAY_SCORING_URL__'
            import type { EffectivePractice, Practice } from '__TYPES_URL__'

            const base = (overrides: Partial<Practice>): Practice => ({
              id: overrides.id ?? 0,
              domain_id: overrides.domain_id ?? 1,
              framework: overrides.framework ?? 'CMMC',
              practice_id: overrides.practice_id ?? 'AC.L2-3.1.1',
              title: overrides.title ?? 'Sample',
              description: overrides.description ?? '',
              status: overrides.status ?? 'Not Started',
              risk_level: overrides.risk_level ?? 'Medium',
              owner: overrides.owner ?? null,
              due_date: overrides.due_date ?? null,
              evidence_exists: overrides.evidence_exists ?? false,
              notes: overrides.notes ?? null,
              created_at: overrides.created_at ?? '2026-03-20T00:00:00Z',
              updated_at: overrides.updated_at ?? '2026-03-20T00:00:00Z',
            })

            const practices: EffectivePractice[] = [
              { ...base({ id: 1, domain_id: 7, practice_id: 'IR.1', status: 'Not Started', risk_level: 'High' }), overlay_pack_key: 'm365_gcc_high', overlay_pack_name: 'Microsoft 365 GCC High', inheritance_type: 'full', effective_inheritance_type: 'full', source_title: 'x', source_url: 'x', customer_actions: 'x', effective_blocker: false, effective_risk_visibility: false, effective_poam_visibility: false, is_customer_scored: false, is_shared_responsibility: false, is_fully_inherited: true, requires_validation: false },
              { ...base({ id: 2, domain_id: 7, practice_id: 'IR.2', status: 'Implemented', risk_level: 'Critical' }), overlay_pack_key: 'm365_gcc_high', overlay_pack_name: 'Microsoft 365 GCC High', inheritance_type: 'full', effective_inheritance_type: 'full', source_title: 'x', source_url: 'x', customer_actions: 'x', effective_blocker: false, effective_risk_visibility: false, effective_poam_visibility: false, is_customer_scored: false, is_shared_responsibility: false, is_fully_inherited: true, requires_validation: false },
            ]

            console.log(JSON.stringify(computePerDomainResidualCompletion(practices)))
            """
        )

        self.assertEqual(result, [
            {"domain_id": 7, "total": 0, "implemented": 0, "audit_ready": 0, "in_progress": 0, "not_started": 0, "completion_pct": 100},
        ])

    def test_build_effective_practices_applies_validation_resolution_without_mutating_mapping(self) -> None:
        result = run_ts(
            """
            import { buildEffectivePractices } from '__OVERLAY_RESOLUTION_URL__'
            import type { OverlayMapping, OverlayPack, OverlayValidation, Practice } from '__TYPES_URL__'

            const practice: Practice = {
              id: 1,
              domain_id: 1,
              framework: 'CMMC',
              practice_id: 'IA.L2-3.5.3',
              title: 'Use Multifactor Authentication',
              description: '',
              status: 'Not Started',
              risk_level: 'Critical',
              owner: null,
              due_date: null,
              evidence_exists: false,
              notes: null,
              created_at: '2026-03-20T00:00:00Z',
              updated_at: '2026-03-20T00:00:00Z',
            }

            const pack: OverlayPack = {
              id: 1,
              key: 'm365_gcc_high',
              name: 'Microsoft 365 GCC High',
              provider: 'Microsoft',
              status: 'available',
              enabled: true,
              description: 'Overlay pack',
              created_at: '2026-03-20T00:00:00Z',
              updated_at: '2026-03-20T00:00:00Z',
            }

            const mapping: OverlayMapping = {
              id: 10,
              overlay_pack_id: 1,
              practice_id: 'IA.L2-3.5.3',
              inheritance_type: 'validation_required',
              source_title: 'Microsoft guidance',
              source_url: 'https://example.com',
              rationale: 'Needs tenant validation',
              customer_actions: 'Validate tenant MFA',
              notes: null,
              created_at: '2026-03-20T00:00:00Z',
              updated_at: '2026-03-20T00:00:00Z',
            }

            const unvalidated: OverlayValidation = {
              id: 100,
              overlay_mapping_id: 10,
              validated: false,
              validated_by: null,
              validated_at: null,
              validation_notes: null,
              resolved_inheritance_type: 'full',
            }

            const validated: OverlayValidation = {
              ...unvalidated,
              validated: true,
              validated_by: 'auditor@localhost',
              validated_at: '2026-03-20T12:00:00Z',
            }

            const before = buildEffectivePractices([practice], [mapping], [pack], [unvalidated])[0]
            const after = buildEffectivePractices([practice], [mapping], [pack], [validated])[0]

            console.log(JSON.stringify({
              before: {
                effective_inheritance_type: before.effective_inheritance_type,
                is_customer_scored: before.is_customer_scored,
                is_fully_inherited: before.is_fully_inherited,
                requires_validation: before.requires_validation,
              },
              after: {
                effective_inheritance_type: after.effective_inheritance_type,
                is_customer_scored: after.is_customer_scored,
                is_fully_inherited: after.is_fully_inherited,
                requires_validation: after.requires_validation,
              },
            }))
            """
        )

        self.assertEqual(result, {
            "before": {
                "effective_inheritance_type": "validation_required",
                "is_customer_scored": True,
                "is_fully_inherited": False,
                "requires_validation": True,
            },
            "after": {
                "effective_inheritance_type": "full",
                "is_customer_scored": False,
                "is_fully_inherited": True,
                "requires_validation": False,
            },
        })

    def test_build_effective_practices_preserves_traceability_for_explicit_none_mappings(self) -> None:
        result = run_ts(
            """
            import { buildEffectivePractices } from '__OVERLAY_RESOLUTION_URL__'
            import type { OverlayMapping, OverlayPack, Practice } from '__TYPES_URL__'

            const practice: Practice = {
              id: 1,
              domain_id: 7,
              framework: 'CMMC',
              practice_id: 'IR.L2-3.6.1',
              title: 'Establish an Operational Incident-Handling Capability',
              description: '',
              status: 'Not Started',
              risk_level: 'High',
              owner: null,
              due_date: null,
              evidence_exists: false,
              notes: null,
              created_at: '2026-03-20T00:00:00Z',
              updated_at: '2026-03-20T00:00:00Z',
            }

            const pack: OverlayPack = {
              id: 1,
              key: 'm365_gcc_high',
              name: 'Microsoft 365 GCC High',
              provider: 'Microsoft',
              status: 'available',
              enabled: false,
              description: 'Overlay pack',
              created_at: '2026-03-20T00:00:00Z',
              updated_at: '2026-03-20T00:00:00Z',
            }

            const mapping: OverlayMapping = {
              id: 30,
              overlay_pack_id: 1,
              practice_id: 'IR.L2-3.6.1',
              inheritance_type: 'none',
              source_title: 'Microsoft shared responsibility guidance',
              source_url: 'https://example.com/shared-responsibility',
              rationale: 'No inherited credit applies to incident response planning.',
              customer_actions: 'Maintain the internal incident response plan.',
              notes: null,
              created_at: '2026-03-20T00:00:00Z',
              updated_at: '2026-03-20T00:00:00Z',
            }

            const effective = buildEffectivePractices([practice], [mapping], [pack], [])[0]
            console.log(JSON.stringify({
              overlay_pack_key: effective.overlay_pack_key,
              inheritance_type: effective.inheritance_type,
              effective_inheritance_type: effective.effective_inheritance_type,
              source_title: effective.source_title,
              customer_actions: effective.customer_actions,
              is_customer_scored: effective.is_customer_scored,
            }))
            """
        )

        self.assertEqual(result, {
            "overlay_pack_key": "m365_gcc_high",
            "inheritance_type": "none",
            "effective_inheritance_type": "none",
            "source_title": "Microsoft shared responsibility guidance",
            "customer_actions": "Maintain the internal incident response plan.",
            "is_customer_scored": True,
        })


if __name__ == "__main__":
    unittest.main()

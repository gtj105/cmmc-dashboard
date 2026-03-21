import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class OverlayIntegrationViewsTests(unittest.TestCase):
    def test_overview_source_mentions_coverage_primary_and_baseline_secondary(self) -> None:
        overview = (ROOT / "src/app/overview/page.tsx").read_text()
        overview_data = (ROOT / "src/app/overview/overview-data.ts").read_text()
        overview_summary = (ROOT / "src/app/overview/overview-summary.ts").read_text()

        for expected in [
            "fetchEffectivePractices",
            "buildOverviewMetrics",
            "buildOverviewDomainSummaries",
            "buildCriticalPracticeSummaries",
            "Compliance command surface",
            "Current SPRS",
            "Baseline",
            "OSC Complete",
            "CSP Covered",
            "Total Covered",
        ]:
            self.assertIn(expected, overview + "\n" + overview_data + "\n" + overview_summary)

    def test_domain_and_practice_table_show_overlay_ownership_cues(self) -> None:
        domain = (ROOT / "src/app/domain/[id]/page.tsx").read_text()
        table = (ROOT / "src/components/PracticeTable.tsx").read_text()

        for expected in [
            "fetchEffectivePractices",
            "Open controls",
            "Evidence gaps",
            "ownershipSegments",
        ]:
            self.assertIn(expected, domain)

        for expected in [
            "EffectivePractice",
            "CSP",
            "Shared",
            "Validation required",
            "OSC",
            "CSP = Cloud Service Provider",
            "OSC = Organization Seeking Certification",
            "isFullyInheritedReadOnly",
            "const editDisabled = !canEdit || updating.has(practice.id) || fullyInheritedReadOnly",
            "is_fully_inherited",
            "is_shared_responsibility",
            "requires_validation",
            "customer_actions",
            "Ownership",
            "CSP covered. This row counts toward progress and stays quiet in immediate-attention views.",
        ]:
            self.assertIn(expected, table)

    def test_risk_and_poam_use_overlay_visibility_rules(self) -> None:
        risk_page = (ROOT / "src/app/risk/page.tsx").read_text()
        risk_page_data = (ROOT / "src/app/risk/risk-page-data.ts").read_text()
        risk_page_hook = (ROOT / "src/app/risk/use-risk-page-data.ts").read_text()
        risk_route = (ROOT / "src/app/api/risk/route.ts").read_text()
        poam_page = (ROOT / "src/app/poam/page.tsx").read_text()
        poam_hook = (ROOT / "src/app/poam/use-poam-page-data.ts").read_text()
        poam_data = (ROOT / "src/app/poam/poam-page-data.ts").read_text()

        for expected in [
            "CSP-covered controls are removed from triage pressure",
            "Shared and validation-required controls remain in view",
            "effective_risk_visibility",
            "effective_poam_visibility",
            "buildEffectivePractices",
            "fetchActiveOverlayPacks",
            "fetchMappingsForActivePacks",
            "fetchOverlayValidationsForActivePacks",
        ]:
            self.assertIn(
                expected,
                risk_page + "\n" + risk_page_data + "\n" + risk_page_hook + "\n" + risk_route + "\n" + poam_page + "\n" + poam_hook + "\n" + poam_data,
            )

        for expected in [
            "Customer-owned remediation work",
            "customer-owned backlog",
        ]:
            self.assertIn(expected, poam_page)


if __name__ == "__main__":
    unittest.main()

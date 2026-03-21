import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


def read(rel_path: str) -> str:
    return (ROOT / rel_path).read_text()


class ProgramManagementRedesignTests(unittest.TestCase):
    def test_risk_support_modules_exist(self) -> None:
        for rel_path in [
            "src/app/risk/risk-page-data.ts",
            "src/app/risk/use-risk-page-data.ts",
        ]:
            self.assertTrue((ROOT / rel_path).exists(), f"Missing expected file: {rel_path}")

    def test_overview_support_modules_exist(self) -> None:
        for rel_path in [
            "src/app/overview/overview-data.ts",
            "src/app/overview/overview-summary.ts",
        ]:
            self.assertTrue((ROOT / rel_path).exists(), f"Missing expected file: {rel_path}")

    def test_poam_support_modules_exist(self) -> None:
        for rel_path in [
            "src/app/poam/poam-page-data.ts",
            "src/app/poam/use-poam-page-data.ts",
        ]:
            self.assertTrue((ROOT / rel_path).exists(), f"Missing expected file: {rel_path}")

    def test_poam_page_uses_program_management_sections(self) -> None:
        poam_page = read("src/app/poam/page.tsx")
        poam_data = read("src/app/poam/poam-page-data.ts")
        poam_hook = read("src/app/poam/use-poam-page-data.ts")

        self.assertIn("Remediation command surface", poam_page)
        self.assertIn("Backlog pressure", poam_page)
        self.assertIn("Create finding", poam_page)
        self.assertIn("buildOverlayValidationPayload", poam_data)
        self.assertIn("scopePoamItems", poam_data)
        self.assertIn("fetchCustomerOwnedPracticeIds", poam_hook)
        self.assertIn("buildEffectivePractices", poam_hook)

    def test_activity_page_uses_high_signal_summary(self) -> None:
        activity_page = read("src/app/activity/page.tsx")

        self.assertIn("High-signal activity", activity_page)
        self.assertIn("Recent changes that matter", activity_page)
        self.assertNotIn("text-blue-400", activity_page)

    def test_risk_page_uses_extracted_triage_helpers(self) -> None:
        risk_page = read("src/app/risk/page.tsx")
        risk_data = read("src/app/risk/risk-page-data.ts")
        risk_hook = read("src/app/risk/use-risk-page-data.ts")

        self.assertIn("Risk command surface", risk_page)
        self.assertIn("Critical exposure", risk_page)
        self.assertIn("buildRiskSummary", risk_data)
        self.assertIn("filterAndSortRiskPractices", risk_data)
        self.assertIn("useRiskPageData", risk_hook)

    def test_overview_page_uses_extracted_data_composition_helpers(self) -> None:
        overview_page = read("src/app/overview/page.tsx")
        overview_data = read("src/app/overview/overview-data.ts")

        self.assertIn("Compliance command surface", overview_page)
        self.assertIn("Current SPRS", overview_page)
        self.assertIn("fetchOverviewData", overview_page)
        self.assertIn("buildCoverageCards", overview_data)
        self.assertIn("computeItarScorePct", overview_data)


if __name__ == "__main__":
    unittest.main()

import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


def read(rel_path: str) -> str:
    return (ROOT / rel_path).read_text()


class CompliancePageRedesignTests(unittest.TestCase):
    def test_domain_page_uses_operational_sections(self) -> None:
        domain_page = read("src/app/domain/[id]/page.tsx")

        self.assertIn("Domain command surface", domain_page)
        self.assertIn("Immediate Attention", domain_page)
        self.assertIn("Open controls", domain_page)

    def test_itar_page_drops_purple_card_grid(self) -> None:
        itar_page = read("src/app/itar/page.tsx")

        self.assertNotIn("grid grid-cols-5", itar_page)
        self.assertNotIn("text-purple-400", itar_page)
        self.assertIn("Overlay command surface", itar_page)
        self.assertIn("Category pressure", itar_page)

    def test_risk_page_uses_triage_sections(self) -> None:
        risk_page = read("src/app/risk/page.tsx")

        self.assertIn("Risk command surface", risk_page)
        self.assertIn("Immediate Triage", risk_page)
        self.assertIn("Critical exposure", risk_page)


if __name__ == "__main__":
    unittest.main()

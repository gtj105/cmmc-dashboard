import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


def read(rel_path: str) -> str:
    return (ROOT / rel_path).read_text()


class OverviewCommandSurfaceTests(unittest.TestCase):
    def test_overview_uses_command_surface_sections(self) -> None:
        overview = read("src/app/overview/page.tsx")

        self.assertIn("Immediate Attention", overview)
        self.assertIn("Weakest Domains", overview)
        self.assertIn("Program Trend", overview)
        self.assertIn("Top blockers", overview)

    def test_overview_charts_include_radar(self) -> None:
        charts = read("src/app/overview/OverviewCharts.tsx")

        self.assertIn("RadarChart", charts)
        self.assertIn("PolarGrid", charts)
        self.assertIn("Domain Radar", charts)
        self.assertIn("PolarRadiusAxis", charts)


if __name__ == "__main__":
    unittest.main()

import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


def read(rel_path: str) -> str:
    return (ROOT / rel_path).read_text()


class CommandSurfaceSystemTests(unittest.TestCase):
    def test_badges_use_quieter_semantic_tones(self) -> None:
        status_badge = read("src/components/StatusBadge.tsx")
        framework_badge = read("src/components/FrameworkBadge.tsx")

        self.assertNotIn("text-blue-400", status_badge)
        self.assertNotIn("bg-blue-900/40", status_badge)
        self.assertNotIn("text-purple-400", framework_badge)
        self.assertNotIn("bg-purple-900/40", framework_badge)

    def test_practice_table_uses_command_surface_header(self) -> None:
        table = read("src/components/PracticeTable.tsx")

        self.assertIn("Command filters", table)
        self.assertIn("Operational view", table)
        self.assertIn("border-b border-border pb-3", table)


if __name__ == "__main__":
    unittest.main()

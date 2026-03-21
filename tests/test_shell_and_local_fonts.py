import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


def read(rel_path: str) -> str:
    return (ROOT / rel_path).read_text()


class ShellAndLocalFontsTests(unittest.TestCase):
    def test_layout_uses_local_fonts(self) -> None:
        layout = read("src/app/layout.tsx")

        self.assertIn("next/font/local", layout)
        self.assertNotIn("next/font/google", layout)
        self.assertIn("ibm-plex-sans-regular.woff2", layout)
        self.assertIn("ibm-plex-mono-medium.woff2", layout)

    def test_shell_uses_command_surface_copy(self) -> None:
        topnav = read("src/components/layout/TopNav.tsx")
        sidebar = read("src/components/layout/Sidebar.tsx")

        self.assertIn("Operations board", topnav)
        self.assertIn("Command center", sidebar)
        self.assertIn("Compliance", sidebar)


if __name__ == "__main__":
    unittest.main()

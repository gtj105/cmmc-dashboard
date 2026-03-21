import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class DataTransferScriptTests(unittest.TestCase):
    def test_package_json_exposes_export_and_import_scripts(self) -> None:
        package_json = (ROOT / "package.json").read_text()
        self.assertIn('"export-data": "node --env-file=.env ./node_modules/.bin/tsx scripts/export-data.ts"', package_json)
        self.assertIn('"import-data": "node --env-file=.env ./node_modules/.bin/tsx scripts/import-data.ts"', package_json)

    def test_export_script_covers_all_operational_tables(self) -> None:
        script = (ROOT / "scripts/export-data.ts").read_text()
        for table in ["users", "domains", "practices", "poam_items", "practice_history"]:
          self.assertIn(f"FROM {table}", script)
        self.assertIn("writeFile", script)
        self.assertIn("JSON.stringify", script)

    def test_import_script_requires_file_and_explicit_wipe(self) -> None:
        script = (ROOT / "scripts/import-data.ts").read_text()
        self.assertIn("--file", script)
        self.assertIn("--wipe", script)
        self.assertIn("TRUNCATE practice_history, poam_items, practices, domains, users RESTART IDENTITY CASCADE", script)
        self.assertIn("INSERT INTO users", script)
        self.assertIn("INSERT INTO domains", script)
        self.assertIn("INSERT INTO practices", script)
        self.assertIn("INSERT INTO poam_items", script)
        self.assertIn("INSERT INTO practice_history", script)


if __name__ == "__main__":
    unittest.main()

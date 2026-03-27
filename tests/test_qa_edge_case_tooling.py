import json
import pathlib
import stat
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

WRAPPER_SCRIPTS = [
    "scripts/bootstrap.sh",
    "scripts/start-runtime.sh",
    "scripts/stop-runtime.sh",
    "scripts/start-dev.sh",
    "scripts/seed-runtime.sh",
    "scripts/create-admin.sh",
    "scripts/export-runtime.sh",
    "scripts/import-runtime.sh",
    "scripts/validate-runtime.sh",
]


class QaEdgeCaseToolingTests(unittest.TestCase):

    def test_smoke_test_script_exists_and_is_executable(self) -> None:
        """Post-deploy smoke test script must exist and be executable."""
        script = ROOT / "scripts" / "smoke-test.sh"
        self.assertTrue(script.exists(), "scripts/smoke-test.sh must exist")
        mode = script.stat().st_mode
        self.assertTrue(mode & stat.S_IXUSR, "scripts/smoke-test.sh must be executable")

    def test_validate_db_script_exists(self) -> None:
        """DB invariant validator must exist as a TS script."""
        script = ROOT / "scripts" / "validate-db.ts"
        self.assertTrue(script.exists(), "scripts/validate-db.ts must exist")
        content = script.read_text()
        self.assertIn("Validating DB invariants", content)
        self.assertIn("process.exit(1)", content)

    def test_package_json_has_validate_db_script(self) -> None:
        """package.json must expose npm run validate-db."""
        package_json = json.loads((ROOT / "package.json").read_text())
        scripts = package_json.get("scripts", {})
        self.assertIn("validate-db", scripts, 'package.json must define "validate-db"')
        self.assertEqual(
            scripts["validate-db"],
            "node --env-file=.env ./node_modules/.bin/tsx scripts/validate-db.ts",
        )

    def test_wrapper_scripts_exist_and_are_executable(self) -> None:
        """All runtime wrapper scripts must exist and be executable."""
        for rel_path in WRAPPER_SCRIPTS:
            script = ROOT / rel_path
            self.assertTrue(script.exists(), f"{rel_path} must exist")
            mode = script.stat().st_mode
            self.assertTrue(mode & stat.S_IXUSR, f"{rel_path} must be executable")

    def test_wrapper_scripts_use_docker_compose(self) -> None:
        """Wrapper scripts must use docker compose — operators should not need host-side Node."""
        for rel_path in WRAPPER_SCRIPTS:
            content = (ROOT / rel_path).read_text()
            self.assertIn(
                "docker compose",
                content,
                f"{rel_path} must use 'docker compose' not host-side npm run"
            )

    def test_bootstrap_sh_calls_setup_secrets(self) -> None:
        """bootstrap.sh must call setup-secrets.sh to ensure secrets are initialized."""
        content = (ROOT / "scripts" / "bootstrap.sh").read_text()
        self.assertIn("setup-secrets.sh", content,
            "bootstrap.sh must call setup-secrets.sh")

    def test_bootstrap_sh_is_idempotent_safe(self) -> None:
        """bootstrap.sh must document idempotent behavior."""
        content = (ROOT / "scripts" / "bootstrap.sh").read_text()
        self.assertIn("Idempotent", content,
            "bootstrap.sh header must document that it is idempotent")

    def test_import_script_no_longer_creates_schema(self) -> None:
        """import-data.ts must not create schema — schema is owned by seed.ts."""
        content = (ROOT / "scripts" / "import-data.ts").read_text()
        self.assertNotIn("ensureTables", content,
            "import-data.ts must not contain ensureTables — schema is owned by seed.ts")
        self.assertNotIn("CREATE TABLE IF NOT EXISTS", content,
            "import-data.ts must not contain table creation — use assertSchemaReady instead")

    def test_import_script_has_schema_readiness_check(self) -> None:
        """import-data.ts must check schema is ready and fail clearly if not."""
        content = (ROOT / "scripts" / "import-data.ts").read_text()
        self.assertIn("assertSchemaReady", content,
            "import-data.ts must call assertSchemaReady() to fail clearly on missing schema")
        self.assertIn("Schema not ready", content,
            "import-data.ts schema check must produce a clear 'Schema not ready' error")

    def test_start_dev_sh_uses_separate_project(self) -> None:
        """start-dev.sh must use a separate compose project to isolate dev from runtime."""
        content = (ROOT / "scripts" / "start-dev.sh").read_text()
        self.assertIn("-p cmmc-dev", content,
            "start-dev.sh must use '-p cmmc-dev' to isolate dev stack from runtime")
        self.assertIn("docker-compose.dev.yml", content,
            "start-dev.sh must reference docker-compose.dev.yml")


if __name__ == "__main__":
    unittest.main()

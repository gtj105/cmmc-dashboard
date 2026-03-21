import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class ContainerHardeningTests(unittest.TestCase):
    def test_dockerignore_excludes_sensitive_and_large_paths(self) -> None:
        dockerignore = ROOT / ".dockerignore"
        self.assertTrue(dockerignore.exists(), ".dockerignore must exist")

        entries = {
            line.strip()
            for line in dockerignore.read_text().splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        }

        for required in [".env", ".env.*", ".git", ".next", "node_modules"]:
            self.assertIn(required, entries)

    def test_compose_does_not_publish_postgres_or_use_weak_defaults(self) -> None:
        compose = (ROOT / "docker-compose.yml").read_text()

        self.assertNotIn('POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}', compose)
        self.assertNotIn('DATABASE_URL: postgres://cmmc_user:${POSTGRES_PASSWORD:-changeme}@db:5432/cmmc_db', compose)
        self.assertNotIn('      - "5432:5432"', compose)

        self.assertIn('POSTGRES_PASSWORD: ${POSTGRES_PASSWORD?POSTGRES_PASSWORD is required}', compose)
        self.assertIn('DATABASE_URL: postgres://cmmc_user:${POSTGRES_PASSWORD?POSTGRES_PASSWORD is required}@db:5432/cmmc_db', compose)

    def test_nginx_sets_basic_security_headers(self) -> None:
        nginx = (ROOT / "nginx.conf").read_text()

        self.assertIn("add_header X-Content-Type-Options nosniff always;", nginx)
        self.assertIn('add_header X-Frame-Options "DENY" always;', nginx)
        self.assertIn('add_header Referrer-Policy "strict-origin-when-cross-origin" always;', nginx)


if __name__ == "__main__":
    unittest.main()

import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class DeploymentConfigTests(unittest.TestCase):

    def test_env_example_uses_port_80_nextauth_url(self) -> None:
        """.env.example must not pin NEXTAUTH_URL to the dev port."""
        env_example = (ROOT / ".env.example").read_text()
        lines = [l.strip() for l in env_example.splitlines() if l.startswith("NEXTAUTH_URL")]
        self.assertTrue(len(lines) >= 1, ".env.example must define NEXTAUTH_URL")
        for line in lines:
            self.assertNotIn(":3000", line, (
                "NEXTAUTH_URL in .env.example must not use port 3000. "
                "Docker serves via nginx on port 80. Use http://localhost"
            ))

    def test_env_example_does_not_contain_nextauth_secret(self) -> None:
        """.env.example must not contain real NextAuth secret configuration."""
        env_example = (ROOT / ".env.example").read_text()
        self.assertNotIn("NEXTAUTH_SECRET=", env_example, (
            "NEXTAUTH_SECRET must not appear in .env.example — "
            "it is committed to the repo. Use NEXTAUTH_SECRET_FILE via Docker secrets."
        ))

    def test_compose_app_env_has_hostname_binding(self) -> None:
        """docker-compose must force Next standalone to bind on all interfaces."""
        compose = (ROOT / "docker-compose.yml").read_text()
        self.assertIn('HOSTNAME: "0.0.0.0"', compose, (
            'docker-compose.yml app environment must include HOSTNAME: "0.0.0.0". '
            "Next.js standalone binds to the container hostname otherwise."
        ))

    def test_compose_nextauth_url_default_has_no_port(self) -> None:
        """docker-compose NEXTAUTH_URL fallback must not include :3000."""
        compose = (ROOT / "docker-compose.yml").read_text()
        for line in compose.splitlines():
            if "NEXTAUTH_URL" in line and ":-" in line:
                self.assertNotIn(":3000", line, (
                    "NEXTAUTH_URL default in docker-compose.yml must not use port 3000. "
                    "Use http://localhost (nginx on 80)."
                ))

    def test_middleware_csrf_secure_flag_uses_nextauth_url_not_node_env(self) -> None:
        """Secure cookie flag must follow NEXTAUTH_URL scheme, not NODE_ENV."""
        middleware = (ROOT / "src/middleware.ts").read_text()
        self.assertNotIn(
            "process.env.NODE_ENV === 'production'",
            middleware,
            "middleware.ts must not use NODE_ENV to set Secure cookie flag — "
            "NODE_ENV=production in Docker even on HTTP. "
            "Use: process.env.NEXTAUTH_URL?.startsWith('https') ?? false"
        )
        self.assertIn(
            "NEXTAUTH_URL",
            middleware,
            "middleware.ts must key Secure flag off NEXTAUTH_URL scheme"
        )

    def test_healthcheck_uses_127_0_0_1_not_localhost(self) -> None:
        """Health checks must probe 127.0.0.1 instead of localhost."""
        compose = (ROOT / "docker-compose.yml").read_text()
        self.assertNotIn(
            "http://localhost:3000/api/health",
            compose,
            "Health check must use 127.0.0.1, not localhost — DNS can fail inside the container"
        )
        self.assertIn("http://127.0.0.1:3000/api/health", compose)

    def test_compose_app_does_not_expose_port_3000_publicly(self) -> None:
        """App traffic should go through nginx, not a published 3000 port."""
        compose = (ROOT / "docker-compose.yml").read_text()
        self.assertNotIn('"3000:3000"', compose)
        self.assertNotIn("'3000:3000'", compose)
        self.assertIn("expose:", compose)

    def test_dev_compose_overlay_exists(self) -> None:
        """docker-compose.dev.yml must exist for isolated dev runtime."""
        dev_compose = ROOT / "docker-compose.dev.yml"
        self.assertTrue(dev_compose.exists(),
            "docker-compose.dev.yml must exist for isolated dev runtime")

    def test_dev_compose_uses_separate_volumes(self) -> None:
        """Dev compose overlay must use separate volumes from the runtime stack."""
        dev_compose = (ROOT / "docker-compose.dev.yml").read_text()
        self.assertIn("pgdata-dev", dev_compose,
            "docker-compose.dev.yml must use a separate DB volume (pgdata-dev)")
        self.assertIn("evidence-dev", dev_compose,
            "docker-compose.dev.yml must use a separate evidence volume (evidence-dev)")

    def test_dev_compose_uses_separate_port(self) -> None:
        """Dev compose overlay must bind to a port distinct from the runtime (80)."""
        dev_compose = (ROOT / "docker-compose.dev.yml").read_text()
        self.assertIn("3001", dev_compose,
            "docker-compose.dev.yml must expose dev instance on a distinct port (3001)")

    def test_deployment_doc_exists(self) -> None:
        """docs/DEPLOYMENT.md must exist as the operator-first deployment guide."""
        self.assertTrue((ROOT / "docs" / "DEPLOYMENT.md").exists(),
            "docs/DEPLOYMENT.md must exist")

    def test_development_doc_exists(self) -> None:
        """docs/DEVELOPMENT.md must exist as the developer workflow guide."""
        self.assertTrue((ROOT / "docs" / "DEVELOPMENT.md").exists(),
            "docs/DEVELOPMENT.md must exist")

    def test_readme_does_not_use_env_local_as_primary_path(self) -> None:
        """README must not instruct operators to use .env.local as the runtime config path."""
        readme = (ROOT / "README.md").read_text()
        self.assertNotIn(".env.local", readme,
            "README must not reference .env.local — the runtime uses setup-secrets.sh and .env")

    def test_readme_references_bootstrap_script(self) -> None:
        """README must point operators to bootstrap.sh as the first-run command."""
        readme = (ROOT / "README.md").read_text()
        self.assertIn("bootstrap.sh", readme,
            "README must reference bootstrap.sh as the first-run command")

    def test_readme_references_deployment_doc(self) -> None:
        """README must link to docs/DEPLOYMENT.md."""
        readme = (ROOT / "README.md").read_text()
        self.assertIn("DEPLOYMENT.md", readme,
            "README must link to docs/DEPLOYMENT.md")


if __name__ == "__main__":
    unittest.main()

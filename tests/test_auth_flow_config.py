import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class AuthFlowConfigTests(unittest.TestCase):

    def test_signout_callback_url_is_relative(self) -> None:
        """signOut must use a relative callbackUrl."""
        topnav = (ROOT / "src/components/layout/TopNav.tsx").read_text()
        self.assertIn("callbackUrl: '/login'", topnav,
            "signOut must use relative callbackUrl: '/login'")
        self.assertNotIn("callbackUrl: 'http://", topnav,
            "signOut callbackUrl must not be an absolute URL")

    def test_nextauth_secret_read_from_file_with_trim(self) -> None:
        """File-based NextAuth secrets must be trimmed."""
        auth = (ROOT / "src/lib/auth.ts").read_text()
        self.assertIn(".trim()", auth,
            "getNextAuthSecret must call .trim() on the file contents to strip newlines")

    def test_login_page_uses_redirect_false(self) -> None:
        """signIn must use redirect: false so the app controls redirect handling."""
        login = (ROOT / "src/app/login/page.tsx").read_text()
        self.assertIn("redirect: false", login,
            "Login page signIn call must use redirect: false")

    def test_auth_options_session_strategy_is_jwt(self) -> None:
        """Session strategy must remain jwt."""
        auth = (ROOT / "src/lib/auth.ts").read_text()
        self.assertIn("strategy: 'jwt'", auth)

    def test_auth_options_has_explicit_sign_in_page(self) -> None:
        """pages.signIn must point to /login."""
        auth = (ROOT / "src/lib/auth.ts").read_text()
        self.assertIn("signIn: '/login'", auth)

    def test_nextauth_url_not_hardcoded_in_auth_source(self) -> None:
        """Auth code must not hardcode localhost:3000."""
        for path in [
            ROOT / "src/lib/auth.ts",
            ROOT / "src/app/api/auth/[...nextauth]/route.ts",
        ]:
            content = path.read_text()
            self.assertNotIn("localhost:3000", content,
                f"{path.name} must not contain hardcoded localhost:3000")


if __name__ == "__main__":
    unittest.main()

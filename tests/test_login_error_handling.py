import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


def read(rel_path: str) -> str:
    return (ROOT / rel_path).read_text()


class LoginErrorHandlingTests(unittest.TestCase):
    def test_auth_routes_errors_back_to_login(self) -> None:
        auth = read("src/lib/auth.ts")

        self.assertIn("pages: { signIn: '/login', error: '/login' }", auth)

    def test_login_page_reads_and_displays_auth_errors(self) -> None:
        login = read("src/app/login/page.tsx")

        self.assertIn("useSearchParams", login)
        self.assertIn("searchParams.get('error')", login)
        self.assertIn("CredentialsSignin", login)
        self.assertIn("Authentication error", login)


if __name__ == "__main__":
    unittest.main()

import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class CreateUserScriptTests(unittest.TestCase):
    def test_package_json_exposes_create_user_script(self) -> None:
        package_json = (ROOT / "package.json").read_text()
        self.assertIn('"create-user": "node --env-file=.env ./node_modules/.bin/tsx scripts/create-user.ts"', package_json)

    def test_create_user_script_requires_prompt_and_valid_roles(self) -> None:
        script = (ROOT / "scripts/create-user.ts").read_text()

        self.assertIn("promptForPassword()", script)
        self.assertIn("Passwords do not match", script)
        self.assertIn("const VALID_ROLES: UserRole[] = ['viewer', 'editor', 'admin']", script)
        self.assertIn("INSERT INTO users (email, password_hash, name, role)", script)
        self.assertIn("CREATE TABLE IF NOT EXISTS users", script)


if __name__ == "__main__":
    unittest.main()

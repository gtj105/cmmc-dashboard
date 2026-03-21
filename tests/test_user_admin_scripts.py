import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class UserAdminScriptTests(unittest.TestCase):
    def test_package_json_exposes_user_admin_scripts(self) -> None:
        package_json = (ROOT / "package.json").read_text()
        self.assertIn('"list-users": "node --env-file=.env ./node_modules/.bin/tsx scripts/list-users.ts"', package_json)
        self.assertIn('"set-role": "node --env-file=.env ./node_modules/.bin/tsx scripts/set-role.ts"', package_json)

    def test_list_users_script_reads_expected_columns(self) -> None:
        script = (ROOT / "scripts/list-users.ts").read_text()
        self.assertIn("SELECT id, email, name, role, created_at FROM users ORDER BY id", script)
        self.assertIn("console.table", script)

    def test_set_role_script_validates_role_and_updates_user(self) -> None:
        script = (ROOT / "scripts/set-role.ts").read_text()
        self.assertIn("const VALID_ROLES: UserRole[] = ['viewer', 'editor', 'admin']", script)
        self.assertIn("UPDATE users", script)
        self.assertIn("SET role =", script)
        self.assertIn("WHERE email =", script)
        self.assertIn("Role updated for", script)


if __name__ == "__main__":
    unittest.main()

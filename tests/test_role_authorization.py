import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


def read(rel_path: str) -> str:
    return (ROOT / rel_path).read_text()


class RoleAuthorizationTests(unittest.TestCase):
    def test_auth_and_types_include_role(self) -> None:
        auth = read("src/lib/auth.ts")
        next_auth_types = read("src/types/next-auth.d.ts")

        self.assertIn("SELECT id, email, password_hash, name, role FROM users", auth)
        self.assertIn("token.role = normalizeRole('role' in user ? user.role : undefined)", auth)
        self.assertIn("session.user.role = normalizeRole(token.role)", auth)
        self.assertIn("role: UserRole", next_auth_types)

    def test_seed_defines_role_and_admin_user(self) -> None:
        seed = read("scripts/seed.ts")

        self.assertIn("USER_ROLE_VALUES", seed)
        self.assertIn("role TEXT NOT NULL DEFAULT '${USER_ROLE_VALUES[0]}'", seed)
        self.assertIn("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT", seed)
        self.assertIn("INSERT INTO users (email, password_hash, name, role)", seed)
        self.assertIn("'admin')", seed)

    def test_mutation_routes_require_editor_or_admin(self) -> None:
        practice_route = read("src/app/api/practices/[id]/route.ts")
        poam_route = read("src/app/api/poam/route.ts")
        poam_id_route = read("src/app/api/poam/[id]/route.ts")

        self.assertIn("requireRole(session, 'editor')", practice_route)
        self.assertIn("requireRole(session, 'editor')", poam_route)
        self.assertIn("requireRole(session, 'editor')", poam_id_route)
        self.assertIn("requireRole(session, 'admin')", poam_id_route)

    def test_ui_hides_edit_controls_for_viewers(self) -> None:
        practice_table = read("src/components/PracticeTable.tsx")
        poam_page = read("src/app/poam/page.tsx")
        poam_hook = read("src/app/poam/use-poam-page-data.ts")

        self.assertIn("canEdit", practice_table)
        self.assertIn("const editDisabled = !canEdit || updating.has(practice.id) || fullyInheritedReadOnly", practice_table)
        self.assertIn("disabled={editDisabled}", practice_table)
        self.assertIn("canEdit", poam_page)
        self.assertIn("const canEdit = session?.user?.role === 'editor' || session?.user?.role === 'admin'", poam_hook)
        self.assertIn("const canDelete = session?.user?.role === 'admin'", poam_hook)


if __name__ == "__main__":
    unittest.main()

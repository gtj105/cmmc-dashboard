import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class OverlaySchemaAndSeedTests(unittest.TestCase):
    def test_overlay_types_are_declared_in_shared_types_module(self) -> None:
        types_file = (ROOT / "src/lib/types.ts").read_text()

        for value_list in [
            "USER_ROLE_VALUES",
            "OVERLAY_PACK_KEYS",
            "OVERLAY_PACK_STATUSES",
            "INHERITANCE_TYPES",
            "RESOLVED_INHERITANCE_TYPES",
        ]:
            self.assertIn(value_list, types_file)

        for name in [
            "OverlayPackKey",
            "OverlayPackStatus",
            "InheritanceType",
            "OverlayPack",
            "OverlayMapping",
            "OverlayValidation",
            "EffectivePractice",
        ]:
            self.assertIn(name, types_file)

        for field in [
            "effective_inheritance_type",
            "effective_blocker",
            "effective_risk_visibility",
            "effective_poam_visibility",
        ]:
            self.assertIn(field, types_file)

    def test_seed_bootstrap_creates_overlay_tables_with_uniqueness(self) -> None:
        seed_file = (ROOT / "scripts/seed.ts").read_text()

        self.assertIn("USER_ROLE_VALUES", seed_file)
        self.assertIn("OVERLAY_PACK_STATUSES", seed_file)
        self.assertIn("INHERITANCE_TYPES", seed_file)
        self.assertIn("RESOLVED_INHERITANCE_TYPES", seed_file)
        self.assertIn("CREATE TABLE IF NOT EXISTS overlay_packs", seed_file)
        self.assertIn("CREATE TABLE IF NOT EXISTS overlay_mappings", seed_file)
        self.assertIn("CREATE TABLE IF NOT EXISTS overlay_validations", seed_file)
        self.assertIn("key TEXT NOT NULL UNIQUE", seed_file)
        self.assertIn("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check", seed_file)
        self.assertIn("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN", seed_file)
        self.assertIn("USER_ROLE_VALUES[0]", seed_file)
        self.assertIn("overlay_pack_id INTEGER NOT NULL REFERENCES overlay_packs(id)", seed_file)
        self.assertIn("practice_id TEXT NOT NULL REFERENCES practices(practice_id)", seed_file)
        self.assertIn("overlay_mapping_id INTEGER NOT NULL UNIQUE REFERENCES overlay_mappings(id)", seed_file)
        self.assertIn("resolved_inheritance_type TEXT", seed_file)
        self.assertIn("ALTER TABLE overlay_validations ADD COLUMN IF NOT EXISTS resolved_inheritance_type TEXT", seed_file)
        self.assertIn("ALTER TABLE overlay_validations DROP CONSTRAINT IF EXISTS overlay_validations_resolved_inheritance_type_check", seed_file)
        self.assertIn("ADD CONSTRAINT overlay_validations_resolved_inheritance_type_check", seed_file)
        self.assertLess(seed_file.index("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check"), seed_file.index("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN"))
        self.assertGreater(
            seed_file.index("Inserting overlay mappings..."),
            seed_file.index("Inserting 20 ITAR controls..."),
        )

    def test_seed_includes_overlay_pack_presence_and_starter_gcc_high_dataset(self) -> None:
        seed_file = (ROOT / "scripts/seed.ts").read_text()
        overlay_index_file = (ROOT / "scripts/data/overlay-pack-index.ts").read_text()
        m365_file = (ROOT / "scripts/data/m365-gcc-high-mappings.ts").read_text()
        azure_file = (ROOT / "scripts/data/azure-government-mappings.ts").read_text()
        defender_file = (ROOT / "scripts/data/microsoft-defender-mappings.ts").read_text()
        purview_file = (ROOT / "scripts/data/microsoft-purview-mappings.ts").read_text()

        for key in [
            "m365_gcc_high",
            "azure_government",
            "microsoft_defender",
            "microsoft_purview",
        ]:
            self.assertIn(key, overlay_index_file)

        self.assertIn("overlayPackSeeds", seed_file)
        self.assertIn("overlayPackSeeds", overlay_index_file)
        self.assertIn("for (const pack of overlayPackSeeds)", seed_file)
        self.assertIn("expectedOverlayMappingCount", seed_file)

        for mapping_file in [m365_file, azure_file, defender_file, purview_file]:
            self.assertIn("SeedOverlayMapping", mapping_file)
            self.assertIn("buildMappings", mapping_file)
            self.assertIn("SOURCE_TITLE", mapping_file)
            self.assertIn("SOURCE_URL", mapping_file)
            self.assertIn("'full'", mapping_file)
            self.assertIn("'partial'", mapping_file)
            self.assertIn("PACK_NOTE", mapping_file)

        self.assertIn("status: OVERLAY_PACK_STATUSES[0]", overlay_index_file)
        self.assertIn("enabled: false", overlay_index_file)
        self.assertIn("description", overlay_index_file)


if __name__ == "__main__":
    unittest.main()

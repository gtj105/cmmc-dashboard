import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class OverlayPageTests(unittest.TestCase):
    def test_overlay_support_modules_exist(self) -> None:
        expected_paths = [
            ROOT / "src/app/overlays/overlay-page-data.ts",
            ROOT / "src/app/overlays/use-overlay-page-data.ts",
            ROOT / "src/app/overlays/overlay-inventory.tsx",
            ROOT / "src/app/overlays/impacted-controls.tsx",
            ROOT / "src/lib/overlay-queries.ts",
            ROOT / "src/lib/overlay-resolution.ts",
        ]

        for path in expected_paths:
            self.assertTrue(path.exists(), f"Missing expected file: {path}")

    def test_overlay_page_and_routes_exist(self) -> None:
        expected_paths = [
            ROOT / "src/app/overlays/page.tsx",
            ROOT / "src/app/api/overlays/route.ts",
            ROOT / "src/app/api/overlays/[key]/toggle/route.ts",
            ROOT / "src/app/api/overlays/[key]/mappings/route.ts",
        ]

        for path in expected_paths:
          self.assertTrue(path.exists(), f"Missing expected file: {path}")

    def test_overlay_page_uses_command_surface_language(self) -> None:
        page_path = ROOT / "src/app/overlays/page.tsx"
        page_data_path = ROOT / "src/app/overlays/overlay-page-data.ts"
        inventory_path = ROOT / "src/app/overlays/overlay-inventory.tsx"
        impacted_controls_path = ROOT / "src/app/overlays/impacted-controls.tsx"
        self.assertTrue(page_path.exists(), f"Missing expected file: {page_path}")
        self.assertTrue(page_data_path.exists(), f"Missing expected file: {page_data_path}")
        self.assertTrue(inventory_path.exists(), f"Missing expected file: {inventory_path}")
        self.assertTrue(impacted_controls_path.exists(), f"Missing expected file: {impacted_controls_path}")

        page = page_path.read_text()
        page_data = page_data_path.read_text()
        inventory = inventory_path.read_text()
        impacted_controls = impacted_controls_path.read_text()
        for expected in [
            "Enclave Overlays",
            "Compliance command surface",
            "Microsoft 365 GCC High",
            "Azure Government",
            "Microsoft Defender",
            "Microsoft Purview",
            "Impacted controls",
        ]:
            self.assertTrue(expected in page or expected in page_data or expected in inventory or expected in impacted_controls)

    def test_overlay_page_covers_statuses_toggle_summary_and_grouping(self) -> None:
        page = (ROOT / "src/app/overlays/page.tsx").read_text()
        page_data = (ROOT / "src/app/overlays/overlay-page-data.ts").read_text()
        page_hook = (ROOT / "src/app/overlays/use-overlay-page-data.ts").read_text()
        inventory = (ROOT / "src/app/overlays/overlay-inventory.tsx").read_text()
        impacted_controls = (ROOT / "src/app/overlays/impacted-controls.tsx").read_text()

        page_expected = [
            "active",
            "available",
            "not_loaded",
            "Residual scoring impact",
            "Fully inherited",
            "Partially inherited",
            "Validation required",
            "Toggle ${packConfig.name}",
            "Switch checked={false} disabled",
            "aria-label={`${packConfig.name} unavailable`}",
            "summaryCards",
            "No impacted controls are currently in scope for this pack.",
        ]

        helper_expected = [
            "customer_owned_controls",
            "fully_inherited_controls",
            "shared_controls",
            "validation_required_controls",
            "effectiveInheritanceType",
            "resolveEffectiveInheritanceType",
            "effectiveMappings",
            "impactedMappings",
            "validationStateLabel(mapping.inheritance_type, mapping.validated, mapping.resolved_inheritance_type)",
            "selectedKeyRef",
            "mappingRequestKeyRef",
            "packRequestIdRef",
            "mappingsLoading",
            "loadPacks(selectedKeyRef.current)",
            "router.refresh()",
            "setMappings([])",
        ]

        for expected in page_expected:
            self.assertTrue(expected in page or expected in inventory or expected in impacted_controls)

        for expected in helper_expected:
            self.assertTrue(
                expected in page or expected in page_data or expected in page_hook or expected in inventory or expected in impacted_controls,
                f"Missing expected overlay helper string: {expected}",
            )

    def test_overlay_summary_route_uses_validations_for_effective_counts(self) -> None:
        route = (ROOT / "src/app/api/overlays/route.ts").read_text()
        overlay_queries = (ROOT / "src/lib/overlay-queries.ts").read_text()
        overlay_exports = (ROOT / "src/lib/overlays.ts").read_text()

        for expected in [
            "fetchOverlayValidationsForActivePacks",
            "fetchOverlayValidationsForActivePacks(sql, activePacks)",
            "buildEffectivePractices(practices, mappings, activePacks, validations)",
        ]:
            self.assertTrue(expected in route or expected in overlay_exports)

        self.assertIn("AND status = 'available'", overlay_queries)

    def test_toggle_route_revalidates_overlay_dependent_pages(self) -> None:
        route = (ROOT / "src/app/api/overlays/[key]/toggle/route.ts").read_text()

        for expected in [
            "revalidatePath",
            "revalidatePath('/overlays')",
            "revalidatePath('/overview')",
            "revalidatePath('/risk')",
            "revalidatePath('/poam')",
            "revalidatePath(`/domain/${domainId}`)",
        ]:
            self.assertIn(expected, route)

    def test_sidebar_includes_overlays_nav_item(self) -> None:
        sidebar = (ROOT / "src/components/layout/Sidebar.tsx").read_text()

        self.assertIn('href="/overlays"', sidebar)
        self.assertIn("Enclave Overlays", sidebar)


if __name__ == "__main__":
    unittest.main()

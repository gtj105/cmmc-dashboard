import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASELINE = ROOT / "scripts" / "data" / "baseline.json"
MIGRATION = ROOT / "scripts" / "migrate-sprs-weights.sql"

EXPECTED_CMMC_COUNT = 110
EXPECTED_ITAR_COUNT = 20
EXPECTED_WEIGHT_SUM = 314
EXPECTED_BASELINE_SPRS = -204
EXPECTED_5PT_COUNT = 44
EXPECTED_3PT_COUNT = 14
EXPECTED_1PT_COUNT = 52


class BaselineJsonInvariantTests(unittest.TestCase):

    def setUp(self) -> None:
        with open(BASELINE) as f:
            data = json.load(f)
        self.practices = data["practices"]
        self.cmmc = [p for p in self.practices if not p["practice_id"].startswith("ITAR")]
        self.itar = [p for p in self.practices if p["practice_id"].startswith("ITAR")]

    def test_practice_count(self) -> None:
        """baseline.json must contain exactly 110 CMMC + 20 ITAR practices."""
        self.assertEqual(len(self.cmmc), EXPECTED_CMMC_COUNT,
            f"Expected {EXPECTED_CMMC_COUNT} CMMC practices, got {len(self.cmmc)}")
        self.assertEqual(len(self.itar), EXPECTED_ITAR_COUNT,
            f"Expected {EXPECTED_ITAR_COUNT} ITAR practices, got {len(self.itar)}")

    def test_sprs_weight_sum(self) -> None:
        """CMMC practice weights must sum to 314."""
        total = sum(p["sprs_weight"] for p in self.cmmc)
        self.assertEqual(total, EXPECTED_WEIGHT_SUM,
            f"CMMC sprs_weight sum is {total}, expected {EXPECTED_WEIGHT_SUM}. "
            f"Run scripts/migrate-sprs-weights.sql then regenerate baseline.json.")

    def test_baseline_sprs_score(self) -> None:
        """At all-not-started baseline, SPRS score must equal -204."""
        total = sum(p["sprs_weight"] for p in self.cmmc)
        score = 110 - total
        self.assertEqual(score, EXPECTED_BASELINE_SPRS,
            f"Baseline SPRS score is {score}, expected {EXPECTED_BASELINE_SPRS}")

    def test_weight_tier_counts(self) -> None:
        """Exactly 44 five-point, 14 three-point, and 52 one-point CMMC practices."""
        count_5 = sum(1 for p in self.cmmc if p["sprs_weight"] == 5)
        count_3 = sum(1 for p in self.cmmc if p["sprs_weight"] == 3)
        count_1 = sum(1 for p in self.cmmc if p["sprs_weight"] == 1)
        self.assertEqual(count_5, EXPECTED_5PT_COUNT, f"Expected {EXPECTED_5PT_COUNT} five-point practices, got {count_5}")
        self.assertEqual(count_3, EXPECTED_3PT_COUNT, f"Expected {EXPECTED_3PT_COUNT} three-point practices, got {count_3}")
        self.assertEqual(count_1, EXPECTED_1PT_COUNT, f"Expected {EXPECTED_1PT_COUNT} one-point practices, got {count_1}")

    def test_no_zero_or_null_weights_in_cmmc(self) -> None:
        """No CMMC practice may have a null or zero weight."""
        bad = [p["practice_id"] for p in self.cmmc if not p.get("sprs_weight")]
        self.assertEqual(bad, [],
            f"These CMMC practices have null/zero sprs_weight: {bad}. "
            f"Run scripts/migrate-sprs-weights.sql.")

    def test_cmmc_is_customer_scored_true(self) -> None:
        """All 110 CMMC practices must have is_customer_scored=True."""
        bad = [p["practice_id"] for p in self.cmmc if p.get("is_customer_scored") is not True]
        self.assertEqual(bad, [],
            f"These CMMC practices have is_customer_scored != true: {bad}")

    def test_itar_is_customer_scored_false(self) -> None:
        """ITAR practices must remain out of customer SPRS scoring."""
        bad = [p["practice_id"] for p in self.itar if p.get("is_customer_scored") is not False]
        self.assertEqual(bad, [],
            f"These ITAR practices have is_customer_scored != false: {bad}")

    def test_all_baseline_statuses_are_not_started(self) -> None:
        """Factory reset baseline must be fully Not Started."""
        non_baseline = [
            p["practice_id"] for p in self.practices
            if p.get("status") != "Not Started"
        ]
        self.assertEqual(non_baseline, [],
            f"These practices in baseline.json are not 'Not Started': {non_baseline}. "
            f"Regenerate from a clean DB.")


class MigrationAlignmentTests(unittest.TestCase):

    def setUp(self) -> None:
        with open(BASELINE) as f:
            data = json.load(f)
        self.practices = {
            p["practice_id"]: p
            for p in data["practices"]
            if not p["practice_id"].startswith("ITAR")
        }
        sql = MIGRATION.read_text()
        m5 = re.search(r"sprs_weight = 5 WHERE practice_id IN \(([^)]+)\)", sql, re.DOTALL)
        m3 = re.search(r"sprs_weight = 3 WHERE practice_id IN \(([^)]+)\)", sql, re.DOTALL)
        self.sql_5pt = set(re.findall(r"'([A-Z]+\.L2-[\d.]+)'", m5.group(1))) if m5 else set()
        self.sql_3pt = set(re.findall(r"'([A-Z]+\.L2-[\d.]+)'", m3.group(1))) if m3 else set()

    def test_five_point_practices_match_migration(self) -> None:
        """Every practice listed as 5-point in SQL must be 5 in baseline.json."""
        for pid in self.sql_5pt:
            self.assertIn(pid, self.practices, f"{pid} in migration SQL but not in baseline.json")
            self.assertEqual(self.practices[pid]["sprs_weight"], 5,
                f"{pid} is 5-point in migration SQL but weight={self.practices[pid]['sprs_weight']} in baseline.json")

    def test_three_point_practices_match_migration(self) -> None:
        """Every practice listed as 3-point in SQL must be 3 in baseline.json."""
        for pid in self.sql_3pt:
            self.assertIn(pid, self.practices, f"{pid} in migration SQL but not in baseline.json")
            self.assertEqual(self.practices[pid]["sprs_weight"], 3,
                f"{pid} is 3-point in migration SQL but weight={self.practices[pid]['sprs_weight']} in baseline.json")

    def test_one_point_practices_are_not_in_higher_tier_lists(self) -> None:
        """Practices absent from 5pt/3pt SQL lists must be 1-point."""
        higher = self.sql_5pt | self.sql_3pt
        for pid, practice in self.practices.items():
            if pid not in higher:
                self.assertEqual(practice["sprs_weight"], 1,
                    f"{pid} is not in migration's 5pt or 3pt list but has weight={practice['sprs_weight']} in baseline.json")


if __name__ == "__main__":
    unittest.main()

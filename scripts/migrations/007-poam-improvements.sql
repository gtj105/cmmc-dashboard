-- 007-poam-improvements.sql
-- Structured POAM fields + soft-delete + change history

-- 1. Add new structured columns (nullable so existing rows are unaffected during migration)
ALTER TABLE poam_items
  ADD COLUMN IF NOT EXISTS gap_statement    TEXT,
  ADD COLUMN IF NOT EXISTS root_cause       TEXT,
  ADD COLUMN IF NOT EXISTS remediation_plan TEXT,
  ADD COLUMN IF NOT EXISTS closure_evidence TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at       TIMESTAMPTZ;

-- 2. Migrate existing finding content → gap_statement
UPDATE poam_items
SET gap_statement = finding
WHERE gap_statement IS NULL;

-- 3. Enforce NOT NULL on gap_statement now that all rows are populated
ALTER TABLE poam_items
  ALTER COLUMN gap_statement SET NOT NULL;

-- 4. Drop the old finding column
ALTER TABLE poam_items
  DROP COLUMN IF EXISTS finding;

-- 5. Create the change-history table
CREATE TABLE IF NOT EXISTS poam_history (
  id            SERIAL PRIMARY KEY,
  poam_id       INTEGER NOT NULL REFERENCES poam_items(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  changed_by    TEXT NOT NULL,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS poam_history_poam_id_idx ON poam_history (poam_id);

-- Remove the FK from overlay_mappings.practice_id → practices(practice_id).
-- This column is seeded from vault files and must survive TRUNCATE ... CASCADE
-- during backup/restore. Without this FK, importing user data no longer wipes
-- overlay mapping rows.
-- Run: psql -U cmmc_user -d cmmc_db -f this_file.sql
ALTER TABLE overlay_mappings
  DROP CONSTRAINT IF EXISTS overlay_mappings_practice_id_fkey;

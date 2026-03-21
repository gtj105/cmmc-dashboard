-- SPRS weight migration: NIST SP 800-171 DoD Assessment Methodology v1.2.1 (June 2020)
-- 44×5pt + 14×3pt + 52×1pt = 314 total → baseline score = 110 - 314 = -204
--
-- Run against your live database:
--   psql $DATABASE_URL -f scripts/migrate-sprs-weights.sql

-- Step 1: add column if it doesn't exist
ALTER TABLE practices ADD COLUMN IF NOT EXISTS sprs_weight SMALLINT NOT NULL DEFAULT 1;

-- Step 2: reset all CMMC practices to 1
UPDATE practices SET sprs_weight = 1 WHERE framework = 'CMMC';

-- Step 3: set 5-point practices (44 total)
UPDATE practices SET sprs_weight = 5 WHERE practice_id IN (
  'AC.L2-3.1.1',  'AC.L2-3.1.2',  'AC.L2-3.1.12', 'AC.L2-3.1.13',
  'AC.L2-3.1.16', 'AC.L2-3.1.17', 'AC.L2-3.1.18',
  'AT.L2-3.2.1',  'AT.L2-3.2.2',
  'AU.L2-3.3.1',  'AU.L2-3.3.5',
  'CA.L2-3.12.1', 'CA.L2-3.12.3',
  'CM.L2-3.4.1',  'CM.L2-3.4.2',  'CM.L2-3.4.5',  'CM.L2-3.4.6',
  'CM.L2-3.4.7',  'CM.L2-3.4.8',
  'IA.L2-3.5.1',  'IA.L2-3.5.2',  'IA.L2-3.5.3',  'IA.L2-3.5.10',
  'IR.L2-3.6.1',  'IR.L2-3.6.2',
  'MA.L2-3.7.2',  'MA.L2-3.7.5',
  'MP.L2-3.8.3',  'MP.L2-3.8.7',
  'PE.L2-3.10.1', 'PE.L2-3.10.2',
  'PS.L2-3.9.2',
  'RA.L2-3.11.2',
  'SC.L2-3.13.1', 'SC.L2-3.13.2', 'SC.L2-3.13.5', 'SC.L2-3.13.6',
  'SC.L2-3.13.11','SC.L2-3.13.15',
  'SI.L2-3.14.1', 'SI.L2-3.14.2', 'SI.L2-3.14.3', 'SI.L2-3.14.4',
  'SI.L2-3.14.6'
);

-- Step 4: set 3-point practices (14 total)
UPDATE practices SET sprs_weight = 3 WHERE practice_id IN (
  'AC.L2-3.1.5',  'AC.L2-3.1.19',
  'AU.L2-3.3.2',
  'CA.L2-3.12.2',
  'MA.L2-3.7.1',  'MA.L2-3.7.4',
  'MP.L2-3.8.1',  'MP.L2-3.8.2',  'MP.L2-3.8.8',
  'PS.L2-3.9.1',
  'RA.L2-3.11.1',
  'SC.L2-3.13.8',
  'SI.L2-3.14.5', 'SI.L2-3.14.7'
);

-- Verify: should return 314
SELECT
  SUM(sprs_weight) AS total_weight,
  COUNT(*) FILTER (WHERE sprs_weight = 5) AS count_5pt,
  COUNT(*) FILTER (WHERE sprs_weight = 3) AS count_3pt,
  COUNT(*) FILTER (WHERE sprs_weight = 1) AS count_1pt,
  110 - SUM(sprs_weight) AS baseline_sprs_score
FROM practices
WHERE framework = 'CMMC';
-- Expected: total_weight=314, count_5pt=44, count_3pt=14, count_1pt=52, baseline_sprs_score=-204

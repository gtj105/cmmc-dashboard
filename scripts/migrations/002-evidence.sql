CREATE TABLE IF NOT EXISTS practice_evidence (
  id            SERIAL PRIMARY KEY,
  practice_id   TEXT NOT NULL REFERENCES practices(practice_id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  file_path     TEXT,
  url           TEXT,
  uploaded_by   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT evidence_has_one_source CHECK (
    (file_path IS NULL) != (url IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS practice_evidence_practice_id_idx
  ON practice_evidence(practice_id);

-- Base schema — all core tables.
-- Uses CREATE TABLE IF NOT EXISTS throughout so this is safe to run on
-- existing installs (every statement becomes a no-op if the table exists).
-- Must run before all other numbered migrations.

CREATE TABLE IF NOT EXISTS domains (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  framework    TEXT NOT NULL DEFAULT 'CMMC',
  description  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS practices (
  id             SERIAL PRIMARY KEY,
  domain_id      INTEGER NOT NULL REFERENCES domains(id),
  framework      TEXT NOT NULL DEFAULT 'CMMC',
  practice_id    TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'Not Started',
  risk_level     TEXT NOT NULL DEFAULT 'Medium',
  sprs_weight    SMALLINT NOT NULL DEFAULT 1,
  owner          TEXT,
  due_date       DATE,
  evidence_exists BOOLEAN NOT NULL DEFAULT false,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id                   SERIAL PRIMARY KEY,
  email                TEXT NOT NULL UNIQUE,
  password_hash        TEXT NOT NULL,
  name                 TEXT NOT NULL,
  role                 TEXT NOT NULL DEFAULT 'viewer'
                         CHECK (role IN ('viewer', 'editor', 'admin')),
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        TEXT PRIMARY KEY,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS revoked_tokens_expires_idx ON revoked_tokens (expires_at);

CREATE TABLE IF NOT EXISTS overlay_packs (
  id          SERIAL PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  provider    TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('available', 'not_loaded')),
  enabled     BOOLEAN NOT NULL DEFAULT false,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS overlay_mappings (
  id               SERIAL PRIMARY KEY,
  overlay_pack_id  INTEGER NOT NULL REFERENCES overlay_packs(id) ON DELETE CASCADE,
  practice_id      TEXT NOT NULL,
  inheritance_type TEXT NOT NULL
                     CHECK (inheritance_type IN ('full', 'partial', 'none', 'validation_required')),
  source_title     TEXT NOT NULL,
  source_url       TEXT NOT NULL,
  rationale        TEXT NOT NULL,
  customer_actions TEXT NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT overlay_mappings_pack_practice_unique UNIQUE (overlay_pack_id, practice_id)
);

CREATE TABLE IF NOT EXISTS overlay_validations (
  id                       SERIAL PRIMARY KEY,
  overlay_mapping_id       INTEGER NOT NULL UNIQUE
                             REFERENCES overlay_mappings(id) ON DELETE CASCADE,
  validated                BOOLEAN NOT NULL DEFAULT false,
  resolved_inheritance_type TEXT
                             CHECK (resolved_inheritance_type IS NULL
                               OR resolved_inheritance_type IN ('full', 'partial', 'none')),
  validated_by             TEXT,
  validated_at             TIMESTAMPTZ,
  validation_notes         TEXT
);

CREATE TABLE IF NOT EXISTS poam_items (
  id                     SERIAL PRIMARY KEY,
  practice_id            TEXT REFERENCES practices(practice_id) ON DELETE SET NULL,
  finding                TEXT NOT NULL,
  responsible_individual TEXT,
  resources_required     TEXT,
  scheduled_completion   DATE,
  milestone_progress     INTEGER NOT NULL DEFAULT 0
                           CHECK (milestone_progress BETWEEN 0 AND 100),
  status                 TEXT NOT NULL DEFAULT 'Open',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_history (
  id           SERIAL PRIMARY KEY,
  practice_id  TEXT NOT NULL,
  field_changed TEXT NOT NULL,
  old_value    TEXT,
  new_value    TEXT,
  changed_by   TEXT NOT NULL,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- practice_evidence (also in 002-evidence.sql — IF NOT EXISTS makes that a no-op)
CREATE TABLE IF NOT EXISTS practice_evidence (
  id          SERIAL PRIMARY KEY,
  practice_id TEXT NOT NULL REFERENCES practices(practice_id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  file_path   TEXT,
  url         TEXT,
  uploaded_by TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT evidence_has_one_source CHECK (
    (file_path IS NULL) != (url IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS practice_evidence_practice_id_idx
  ON practice_evidence (practice_id);

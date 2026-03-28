-- App-level settings table (key/value store)
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default org name; existing rows are preserved on re-run
INSERT INTO settings (key, value)
VALUES ('org_name', 'My Organization')
ON CONFLICT (key) DO NOTHING;

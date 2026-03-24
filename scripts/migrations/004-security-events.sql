-- ─────────────────────────────────────────────────────────────────
-- Migration 004: Security Events Audit Table
-- Stores login attempts, admin actions, and security-relevant events
-- for forensic analysis and compliance evidence.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS security_events (
  id          SERIAL PRIMARY KEY,
  action      TEXT NOT NULL,                    -- e.g. 'login.success', 'user.created', 'backup.exported'
  actor       TEXT NOT NULL DEFAULT 'unknown',  -- email of the user who performed the action
  target      TEXT,                             -- what was acted on (user email, practice ID, etc.)
  ip_address  TEXT,                             -- client IP from X-Real-IP header
  details     TEXT,                             -- human-readable context
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by action type (e.g. all login failures)
CREATE INDEX IF NOT EXISTS idx_security_events_action ON security_events(action);

-- Index for querying by actor (e.g. all actions by a specific user)
CREATE INDEX IF NOT EXISTS idx_security_events_actor ON security_events(actor);

-- Index for time-based queries (e.g. last 24 hours of events)
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

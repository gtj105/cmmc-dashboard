-- scripts/migrations/005-auth-hardening.sql
-- ─────────────────────────────────────────────────────────────────
-- Migration 005: Auth Hardening
-- 1. login_attempts — persistent rate limiting (survives restarts)
-- 2. user_invalidations — revoke all tokens for a user on delete
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS login_attempts (
  email         TEXT PRIMARY KEY,
  count         INT NOT NULL DEFAULT 0,
  locked_until  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_invalidations (
  user_id       INT PRIMARY KEY,
  invalidated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

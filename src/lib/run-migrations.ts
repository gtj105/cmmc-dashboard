// src/lib/run-migrations.ts
//
// Runs pending SQL migrations on startup.
// Tracks applied migrations in schema_migrations table.
// Called from src/instrumentation.ts (Next.js lifecycle hook).

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type postgres from 'postgres'
import sql from '@/lib/db'

// In production the Dockerfile copies scripts/migrations → migrations/.
// In dev the full source is volume-mounted, so fall back to scripts/migrations/.
import { existsSync } from 'node:fs'
const _prod = path.resolve(process.cwd(), 'migrations')
const _dev  = path.resolve(process.cwd(), 'scripts/migrations')
const MIGRATIONS_DIR = existsSync(_prod) ? _prod : _dev

async function ensureMigrationsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const rows = await sql<{ filename: string }[]>`
    SELECT filename FROM schema_migrations ORDER BY filename
  `
  return new Set(rows.map(r => r.filename))
}

export async function runMigrations(): Promise<void> {
  try {
    await ensureMigrationsTable()

    let files: string[]
    try {
      const entries = await readdir(MIGRATIONS_DIR)
      files = entries.filter(f => f.endsWith('.sql')).sort()
    } catch {
      // migrations/ dir not present (e.g. test environment) — skip silently
      return
    }

    const applied = await getAppliedMigrations()
    const pending = files.filter(f => !applied.has(f))

    if (pending.length === 0) return

    console.log(`[migrations] Running ${pending.length} pending migration(s)...`) // eslint-disable-line no-console

    for (const filename of pending) {
      const filepath = path.join(MIGRATIONS_DIR, filename)
      const sqlText = await readFile(filepath, 'utf8')

      await sql.begin(async (tx: postgres.TransactionSql) => {
        await tx.unsafe(sqlText)
        await tx.unsafe(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [filename]
        )
      })

      console.log(`[migrations] ✓ ${filename}`) // eslint-disable-line no-console
    }

    console.log(`[migrations] Done.`) // eslint-disable-line no-console
  } catch (err) {
    console.error('[migrations] Failed:', err)
    throw err
  }
}

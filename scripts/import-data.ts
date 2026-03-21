import postgres from 'postgres'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error('DATABASE_URL environment variable is required')
const sql = postgres(dbUrl)

type ExportPayload = {
  users: Array<Record<string, unknown>>
  domains: Array<Record<string, unknown>>
  practices: Array<Record<string, unknown>>
  poam_items: Array<Record<string, unknown>>
  practice_history: Array<Record<string, unknown>>
}

function parseArgs(argv: string[]) {
  let wipe = false
  const args = new Map<string, string>()
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--wipe') {
      wipe = true
      continue
    }
    if (!arg.startsWith('--')) continue
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`)
    }
    args.set(arg.slice(2), value)
    i += 1
  }
  return {
    file: args.get('file')?.trim() ?? '',
    wipe,
  }
}

function validatePayload(payload: unknown): asserts payload is ExportPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid import file')
  }
  for (const key of ['users', 'domains', 'practices', 'poam_items', 'practice_history']) {
    if (!Array.isArray((payload as Record<string, unknown>)[key])) {
      throw new Error(`Import file missing array: ${key}`)
    }
  }
}

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS domains (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      framework TEXT NOT NULL DEFAULT 'CMMC',
      description TEXT NOT NULL DEFAULT ''
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS practices (
      id SERIAL PRIMARY KEY,
      domain_id INTEGER NOT NULL REFERENCES domains(id),
      framework TEXT NOT NULL DEFAULT 'CMMC',
      practice_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Not Started',
      risk_level TEXT NOT NULL DEFAULT 'Medium',
      owner TEXT,
      due_date DATE,
      evidence_exists BOOLEAN NOT NULL DEFAULT false,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT`
  await sql`UPDATE users SET role = 'viewer' WHERE role IS NULL`
  await sql`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'viewer'`
  await sql`ALTER TABLE users ALTER COLUMN role SET NOT NULL`
  await sql`
    CREATE TABLE IF NOT EXISTS poam_items (
      id SERIAL PRIMARY KEY,
      practice_id TEXT REFERENCES practices(practice_id) ON DELETE SET NULL,
      finding TEXT NOT NULL,
      responsible_individual TEXT,
      resources_required TEXT,
      scheduled_completion DATE,
      milestone_progress INTEGER NOT NULL DEFAULT 0 CHECK (milestone_progress BETWEEN 0 AND 100),
      status TEXT NOT NULL DEFAULT 'Open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS practice_history (
      id SERIAL PRIMARY KEY,
      practice_id TEXT NOT NULL,
      field_changed TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by TEXT NOT NULL,
      changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

async function main() {
  const { file, wipe } = parseArgs(process.argv.slice(2))
  if (!file) {
    throw new Error('Usage: npm run import-data -- --file exports/backup.json [--wipe]')
  }

  const absolutePath = path.resolve(file)
  const raw = await readFile(absolutePath, 'utf8')
  const parsed = JSON.parse(raw)
  validatePayload(parsed)

  await ensureTables()

  await sql.begin(async (tx) => {
    const q = tx as unknown as typeof sql
    if (wipe) {
      await q`TRUNCATE practice_history, poam_items, practices, domains, users RESTART IDENTITY CASCADE`
    }

    for (const user of parsed.users) {
      await q`
        INSERT INTO users (id, email, password_hash, name, role, created_at)
        VALUES (${user.id as number}, ${user.email as string}, ${user.password_hash as string}, ${user.name as string}, ${(user.role as string) ?? 'viewer'}, ${user.created_at as string})
      `
    }
    for (const domain of parsed.domains) {
      await q`
        INSERT INTO domains (id, name, abbreviation, framework, description)
        VALUES (${domain.id as number}, ${domain.name as string}, ${domain.abbreviation as string}, ${domain.framework as string}, ${domain.description as string})
      `
    }
    for (const practice of parsed.practices) {
      await q`
        INSERT INTO practices (id, domain_id, framework, practice_id, title, description, status, risk_level, owner, due_date, evidence_exists, notes, created_at, updated_at)
        VALUES (
          ${practice.id as number},
          ${practice.domain_id as number},
          ${practice.framework as string},
          ${practice.practice_id as string},
          ${practice.title as string},
          ${practice.description as string},
          ${practice.status as string},
          ${practice.risk_level as string},
          ${(practice.owner as string | null) ?? null},
          ${(practice.due_date as string | null) ?? null},
          ${Boolean(practice.evidence_exists)},
          ${(practice.notes as string | null) ?? null},
          ${practice.created_at as string},
          ${practice.updated_at as string}
        )
      `
    }
    for (const item of parsed.poam_items) {
      await q`
        INSERT INTO poam_items (id, practice_id, finding, responsible_individual, resources_required, scheduled_completion, milestone_progress, status, created_at, updated_at)
        VALUES (
          ${item.id as number},
          ${(item.practice_id as string | null) ?? null},
          ${item.finding as string},
          ${(item.responsible_individual as string | null) ?? null},
          ${(item.resources_required as string | null) ?? null},
          ${(item.scheduled_completion as string | null) ?? null},
          ${item.milestone_progress as number},
          ${item.status as string},
          ${item.created_at as string},
          ${item.updated_at as string}
        )
      `
    }
    for (const entry of parsed.practice_history) {
      await q`
        INSERT INTO practice_history (id, practice_id, field_changed, old_value, new_value, changed_by, changed_at)
        VALUES (
          ${entry.id as number},
          ${entry.practice_id as string},
          ${entry.field_changed as string},
          ${(entry.old_value as string | null) ?? null},
          ${(entry.new_value as string | null) ?? null},
          ${entry.changed_by as string},
          ${entry.changed_at as string}
        )
      `
    }
  })

  await sql.end()
  console.log(`Imported dashboard data from ${absolutePath}${wipe ? ' with wipe' : ''}`)
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error))
  try {
    await sql.end()
  } catch {
    // ignore close errors on failure path
  }
  process.exit(1)
})

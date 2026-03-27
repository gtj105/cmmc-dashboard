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

async function assertSchemaReady() {
  // Import assumes the schema is already prepared by seed.ts or a migration run.
  // This check fails loudly if the tables aren't present so operators know to run
  // bootstrap first rather than silently creating a partial schema here.
  const requiredTables = ['domains', 'practices', 'users', 'poam_items', 'practice_history']
  for (const table of requiredTables) {
    try {
      await sql`SELECT 1 FROM ${sql(table)} LIMIT 0`
    } catch {
      throw new Error(
        `Schema not ready: table "${table}" does not exist.\n` +
        `Run bootstrap first: bash ./scripts/bootstrap.sh\n` +
        `Or inside the container: docker compose exec app npm run seed`
      )
    }
  }
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

  await assertSchemaReady()

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

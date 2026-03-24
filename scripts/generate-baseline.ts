/**
 * generate-baseline.ts
 *
 * Run this against a CLEAN database (right after seed) to create a golden
 * baseline snapshot. The factory-reset feature restores from this file.
 *
 * Usage:
 *   docker compose exec app npx tsx scripts/generate-baseline.ts
 *
 * Output:
 *   scripts/data/baseline.json
 */

import postgres from 'postgres'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

// Support either a full DATABASE_URL or individual PG* env vars
const dbUrl = process.env.DATABASE_URL
const sql = dbUrl
  ? postgres(dbUrl)
  : postgres({
      host:     process.env.PGHOST     ?? 'localhost',
      port:     parseInt(process.env.PGPORT ?? '5432'),
      database: process.env.PGDATABASE ?? 'cmmc_db',
      user:     process.env.PGUSER     ?? 'cmmc_user',
      password: process.env.PGPASSWORD,
    })

async function main() {
  console.log('Querying current database state...')

  const [users, domains, practices, poamItems, practiceHistory, overlayPacks, overlayValidations] =
    await Promise.all([
      sql`SELECT * FROM users ORDER BY id`,
      sql`SELECT * FROM domains ORDER BY id`,
      sql`SELECT * FROM practices ORDER BY id`,
      sql`SELECT * FROM poam_items ORDER BY id`,
      sql`SELECT * FROM practice_history ORDER BY id`,
      sql`SELECT key, enabled FROM overlay_packs ORDER BY id`,
      sql`SELECT * FROM overlay_validations ORDER BY id`,
    ])

  const payload = {
    _baseline: true,
    _generated_at: new Date().toISOString(),
    _description:
      'Golden baseline snapshot. Factory reset restores the database to this state. Regenerate after schema or seed data changes.',
    users,
    domains,
    practices,
    poam_items: poamItems,
    practice_history: practiceHistory,
    overlay_pack_states: overlayPacks,
    overlay_validations: overlayValidations,
  }

  const outPath = process.env.OUTPUT_PATH ?? path.resolve(__dirname, 'data/baseline.json')
  await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8')

  console.log(`Baseline written to ${outPath}`)
  console.log(`  Users: ${users.length}`)
  console.log(`  Domains: ${domains.length}`)
  console.log(`  Practices: ${practices.length}`)
  console.log(`  POA&M items: ${poamItems.length}`)
  console.log(`  History entries: ${practiceHistory.length}`)
  console.log(`  Overlay validations: ${overlayValidations.length}`)

  await sql.end()
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : String(err))
  try { await sql.end() } catch { /* ignore */ }
  process.exit(1)
})

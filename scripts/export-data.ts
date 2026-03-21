import postgres from 'postgres'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error('DATABASE_URL environment variable is required')
const sql = postgres(dbUrl)

function parseArgs(argv: string[]) {
  const args = new Map<string, string>()
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
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
  }
}

async function main() {
  const { file } = parseArgs(process.argv.slice(2))
  const outputPath = file || `exports/dashboard-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const absolutePath = path.resolve(outputPath)

  const [users, domains, practices, poamItems, practiceHistory] = await Promise.all([
    sql`SELECT * FROM users ORDER BY id`,
    sql`SELECT * FROM domains ORDER BY id`,
    sql`SELECT * FROM practices ORDER BY id`,
    sql`SELECT * FROM poam_items ORDER BY id`,
    sql`SELECT * FROM practice_history ORDER BY id`,
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    users,
    domains,
    practices,
    poam_items: poamItems,
    practice_history: practiceHistory,
  }

  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, JSON.stringify(payload, null, 2))
  await sql.end()
  console.log(`Exported dashboard data to ${absolutePath}`)
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

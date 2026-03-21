import postgres from 'postgres'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error('DATABASE_URL environment variable is required')
const sql = postgres(dbUrl)

async function main() {
  const users = await sql`
    SELECT id, email, name, role, created_at FROM users ORDER BY id
  `
  console.table(users)
  await sql.end()
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

import postgres from 'postgres'
import type { UserRole } from '@/lib/types'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error('DATABASE_URL environment variable is required')
const sql = postgres(dbUrl)

const VALID_ROLES: UserRole[] = ['viewer', 'editor', 'admin']

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
    email: args.get('email')?.trim() ?? '',
    role: args.get('role')?.trim() ?? '',
  }
}

async function main() {
  const { email, role } = parseArgs(process.argv.slice(2))
  if (!email || !role) {
    throw new Error('Usage: npm run set-role -- --email user@example.com --role viewer')
  }
  if (!VALID_ROLES.includes(role as UserRole)) {
    throw new Error(`role must be one of: ${VALID_ROLES.join(', ')}`)
  }

  const [updated] = await sql`
    UPDATE users
    SET role = ${role as UserRole}
    WHERE email = ${email}
    RETURNING id, email, name, role
  `

  if (!updated) {
    throw new Error(`No user found for ${email}`)
  }

  console.log(`Role updated for ${updated.email}: ${updated.role}`)
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

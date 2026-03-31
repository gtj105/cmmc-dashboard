import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import readline from 'node:readline'
import { stdin as input, stdout as output } from 'node:process'
import type { UserRole } from '@/lib/types'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error('DATABASE_URL environment variable is required')
const sql = postgres(dbUrl)

const VALID_ROLES: UserRole[] = ['viewer', 'editor', 'admin']

function usage() {
  console.error('Usage: npm run create-user -- --email user@example.com --name "User Name" --role viewer')
}

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
    name: args.get('name')?.trim() ?? '',
    role: args.get('role')?.trim() ?? '',
  }
}

async function promptHidden(query: string): Promise<string> {
  return await new Promise((resolve) => {
    const rl = readline.createInterface({ input, output })
    const originalWrite = (rl as unknown as { _writeToOutput?: (_value: string) => void })._writeToOutput
    ;(rl as unknown as { _writeToOutput: (_value: string) => void })._writeToOutput = (_value: string) => {
      if (rl.getPrompt()) {
        output.write('*'.repeat(value.replace(/\r?\n/g, '').length))
      } else {
        output.write(value)
      }
    }

    rl.question(query, (answer) => {
      rl.close()
      if (originalWrite) {
        ;(rl as unknown as { _writeToOutput: (value: string) => void })._writeToOutput = originalWrite
      }
      output.write('\n')
      resolve(answer)
    })
  })
}

async function promptForPassword(): Promise<string> {
  const password = await promptHidden('Password: ')
  const confirmation = await promptHidden('Confirm password: ')
  if (password !== confirmation) {
    throw new Error('Passwords do not match')
  }
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters')
  }
  return password
}

async function ensureUsersTable() {
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
}

async function main() {
  const { email, name, role } = parseArgs(process.argv.slice(2))

  if (!email || !name || !role) {
    usage()
    throw new Error('email, name, and role are required')
  }
  if (!VALID_ROLES.includes(role as UserRole)) {
    throw new Error(`role must be one of: ${VALID_ROLES.join(', ')}`)
  }

  const password = await promptForPassword()
  const passwordHash = await bcrypt.hash(password, 10)

  await ensureUsersTable()

  try {
    const [created] = await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${email}, ${passwordHash}, ${name}, ${role as UserRole})
      RETURNING id, email, name, role, created_at
    `
    console.log(`Created user ${created.email} with role ${created.role}`)
  } catch (error) {
    const pgError = error as { code?: string }
    if (pgError.code === '23505') {
      throw new Error(`User with email ${email} already exists`)
    }
    throw error
  } finally {
    await sql.end()
  }
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

import sql from '@/lib/db'

export async function getOrgName(): Promise<string> {
  try {
    const [row] = await sql<{ value: string }[]>`
      SELECT value FROM settings WHERE key = 'org_name'
    `
    return row?.value ?? process.env.ORG_NAME ?? 'My Organization'
  } catch {
    return process.env.ORG_NAME ?? 'My Organization'
  }
}

export async function setOrgName(name: string): Promise<void> {
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('org_name', ${name}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `
}

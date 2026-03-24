import postgres from 'postgres'

declare global {
  // eslint-disable-next-line no-var
  var _sql: ReturnType<typeof postgres> | undefined
}

const sql = globalThis._sql ?? postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 30,           // Close idle connections after 30s
  max_lifetime: 60 * 30,      // Recycle connections every 30 minutes
  connect_timeout: 10,         // Fail fast if DB unreachable (10s)
  connection: {
    application_name: 'cmmc-dashboard',
  },
})

if (process.env.NODE_ENV !== 'production') globalThis._sql = sql
export default sql

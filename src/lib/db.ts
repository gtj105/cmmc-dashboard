import postgres from 'postgres'

declare global {
  // eslint-disable-next-line no-var
  var _sql: ReturnType<typeof postgres> | undefined
}

const sql = globalThis._sql ?? postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 30,
  max_lifetime: 60 * 30,
  connect_timeout: 10,
  connection: {
    application_name: 'cmmc-dashboard',
  },
  // Require TLS in production. Docker loopback (dev/local) skips SSL.
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false,
})

if (process.env.NODE_ENV !== 'production') globalThis._sql = sql
export default sql

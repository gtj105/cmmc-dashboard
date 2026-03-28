// src/instrumentation.ts
// Next.js lifecycle hook — runs once on server startup (dev and prod).

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./lib/run-migrations')
    await runMigrations()
  }
}

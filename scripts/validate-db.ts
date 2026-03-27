import sql from '../src/lib/db'

const ERRORS: string[] = []

function assert(condition: boolean, message: string) {
  if (!condition) ERRORS.push(message)
}

async function main() {
  console.log('Validating DB invariants...\n')

  const [{ count: practiceCount }] = await sql`SELECT COUNT(*)::int AS count FROM practices`
  assert(practiceCount === 130, `Practice count is ${practiceCount}, expected 130 (110 CMMC + 20 ITAR)`)

  const [{ count: cmmcCount }] = await sql`SELECT COUNT(*)::int AS count FROM practices WHERE framework = 'CMMC'`
  assert(cmmcCount === 110, `CMMC practice count is ${cmmcCount}, expected 110`)

  const [{ total }] = await sql`SELECT SUM(sprs_weight)::int AS total FROM practices WHERE framework = 'CMMC'`
  assert(total === 314,
    `SPRS weight sum is ${total}, expected 314. Run scripts/migrate-sprs-weights.sql first.`)

  const [{ five_pt, three_pt, one_pt }] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE sprs_weight = 5)::int AS five_pt,
      COUNT(*) FILTER (WHERE sprs_weight = 3)::int AS three_pt,
      COUNT(*) FILTER (WHERE sprs_weight = 1)::int AS one_pt
    FROM practices WHERE framework = 'CMMC'
  `
  assert(five_pt === 44, `5-point practice count is ${five_pt}, expected 44`)
  assert(three_pt === 14, `3-point practice count is ${three_pt}, expected 14`)
  assert(one_pt === 52, `1-point practice count is ${one_pt}, expected 52`)

  const [{ null_count }] = await sql`
    SELECT COUNT(*)::int AS null_count FROM practices
    WHERE framework = 'CMMC' AND sprs_weight IS NULL
  `
  assert(null_count === 0, `${null_count} CMMC practices have NULL sprs_weight`)

  const nextauthUrl = process.env.NEXTAUTH_URL ?? ''
  assert(!nextauthUrl.includes(':3000'),
    `NEXTAUTH_URL is "${nextauthUrl}" — contains :3000. Set to http://localhost (nginx port 80).`)
  assert(nextauthUrl.length > 0, 'NEXTAUTH_URL is not set')

  const [{ domain_count }] = await sql`SELECT COUNT(*)::int AS domain_count FROM domains`
  assert(domain_count === 15, `Domain count is ${domain_count}, expected 15 (14 CMMC domains + ITAR overlay domain)`)

  if (ERRORS.length === 0) {
    console.log('All invariants passed.\n')
    process.exit(0)
  } else {
    console.error(`${ERRORS.length} invariant(s) failed:\n`)
    ERRORS.forEach(e => console.error(`  ✗ ${e}`))
    console.error('')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Validation error:', err)
  process.exit(1)
})

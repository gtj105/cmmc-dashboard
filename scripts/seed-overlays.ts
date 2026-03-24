/**
 * Seed (or re-seed) overlay_mappings and overlay_validations without touching
 * any user data (practices, users, domains, poam_items, etc.).
 *
 * Safe to run against a live database.
 */
import sql from '../src/lib/db'
import { overlayPackSeeds } from './data/overlay-pack-index'

async function seedOverlays() {
  console.log('Clearing overlay_validations and overlay_mappings...')
  await sql`TRUNCATE overlay_validations, overlay_mappings RESTART IDENTITY CASCADE`

  const overlayPackRows = await sql`SELECT id, key FROM overlay_packs ORDER BY key`
  const packIdByKey = new Map(overlayPackRows.map((row) => [row.key as string, row.id as number]))

  for (const pack of overlayPackSeeds) {
    const overlayPackId = packIdByKey.get(pack.key)
    if (!overlayPackId) {
      throw new Error(`Missing overlay_packs row for key="${pack.key}" — run full seed first`)
    }

    console.log(`Inserting ${pack.mappings.length} mappings for ${pack.name}...`)
    for (const mapping of pack.mappings) {
      const [inserted] = await sql`
        INSERT INTO overlay_mappings (
          overlay_pack_id, practice_id, inheritance_type,
          source_title, source_url, rationale, customer_actions, notes
        )
        VALUES (
          ${overlayPackId}, ${mapping.practice_id}, ${mapping.inheritance_type},
          ${mapping.source_title}, ${mapping.source_url}, ${mapping.rationale},
          ${mapping.customer_actions}, ${mapping.notes}
        )
        RETURNING id
      `
      await sql`
        INSERT INTO overlay_validations (
          overlay_mapping_id, validated, resolved_inheritance_type,
          validated_by, validated_at, validation_notes
        )
        VALUES (${inserted.id}, false, NULL, NULL, NULL, 'Dataset pending organization validation')
      `
    }
  }

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM overlay_mappings`
  console.log(`Done. overlay_mappings rows: ${count}`)

  await sql.end()
}

seedOverlays().catch((err) => {
  console.error(err)
  process.exit(1)
})

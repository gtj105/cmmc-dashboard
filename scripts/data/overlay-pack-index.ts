import { OVERLAY_PACK_STATUSES, type OverlayPackKey } from '../../src/lib/types'
import { azureGovernmentMappings } from './azure-government-mappings'
import { microsoftDefenderMappings } from './microsoft-defender-mappings'
import { gccHighMappings } from './gcc-high-mappings'
import { microsoftPurviewMappings } from './microsoft-purview-mappings'
import type { SeedOverlayPack } from './overlay-pack-helpers'

export const overlayPackSeeds: SeedOverlayPack[] = [
  {
    key: 'm365_gcc_high',
    name: 'Microsoft 365 GCC High',
    provider: 'Microsoft',
    status: OVERLAY_PACK_STATUSES[0],
    enabled: false,
    description: 'Microsoft 365 GCC High overlay pack sourced from the local gcc high vault placemat notes.',
    mappings: gccHighMappings,
  },
  {
    key: 'azure_government',
    name: 'Azure Government',
    provider: 'Microsoft',
    status: OVERLAY_PACK_STATUSES[0],
    enabled: false,
    description: 'Azure Government overlay pack sourced from the local gcc high vault placemat notes.',
    mappings: azureGovernmentMappings,
  },
  {
    key: 'microsoft_defender',
    name: 'Microsoft Defender',
    provider: 'Microsoft',
    status: OVERLAY_PACK_STATUSES[0],
    enabled: false,
    description: 'Microsoft Defender overlay pack sourced from the local gcc high vault placemat notes.',
    mappings: microsoftDefenderMappings,
  },
  {
    key: 'microsoft_purview',
    name: 'Microsoft Purview',
    provider: 'Microsoft',
    status: OVERLAY_PACK_STATUSES[0],
    enabled: false,
    description: 'Microsoft Purview overlay pack sourced from the local gcc high vault placemat notes.',
    mappings: microsoftPurviewMappings,
  },
]

export function findOverlayPackSeed(key: OverlayPackKey) {
  return overlayPackSeeds.find((pack) => pack.key === key) ?? null
}

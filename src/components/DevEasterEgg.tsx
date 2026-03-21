'use client'
import { useEffect } from 'react'

export default function DevEasterEgg() {
  useEffect(() => {
    console.log(
      '%cCMMC L2 Dashboard',
      'font-size:16px;font-weight:700;color:#d97706;font-family:IBM Plex Mono,monospace'
    )
    console.log(
      '%cDefending the defense industrial base — one control at a time.',
      'font-size:12px;color:#888;font-family:IBM Plex Mono,monospace'
    )
    console.log(
      '%c110 CMMC practices · 20 ITAR controls · NIST SP 800-171',
      'font-size:11px;color:#555;font-family:IBM Plex Mono,monospace'
    )
  }, [])

  return null
}

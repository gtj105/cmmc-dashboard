'use client'

// ─────────────────────────────────────────────────────────────────
// CSRF-aware API client
// Drop-in replacement for fetch() that automatically includes
// the CSRF token header on mutating requests (POST, PATCH, DELETE).
//
// Usage:  import { apiFetch } from '@/lib/api-client'
//         const res = await apiFetch(`/api/practices/${id}`, { method: 'PATCH', ... })
// ─────────────────────────────────────────────────────────────────

const CSRF_COOKIE = 'cmmc-csrf-token'
const CSRF_HEADER = 'x-csrf-token'

function getCsrfToken(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Fetch wrapper that automatically attaches the CSRF token.
 * Same signature as window.fetch().
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const headers = new Headers(init?.headers)

  // Attach CSRF token on mutating requests
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = getCsrfToken()
    if (token) {
      headers.set(CSRF_HEADER, token)
    }
  }

  return fetch(input, { ...init, headers })
}

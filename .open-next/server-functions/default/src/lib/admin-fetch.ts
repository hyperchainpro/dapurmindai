/* ── Admin API Fetch Helper ─────────────────────────────────
   All admin components should use this instead of raw fetch()
   so the x-admin-key header is automatically included.
   ────────────────────────────────────────────────────────── */

const ADMIN_API_KEY = 'dapurmind-admin-key-2025';

const ADMIN_HEADERS: Record<string, string> = {
  'x-admin-key': ADMIN_API_KEY,
  'Content-Type': 'application/json',
};

/**
 * Wrapper around fetch() that injects the admin API key header.
 * Usage: adminFetch('/api/admin/stats')  — same API as native fetch.
 */
export async function adminFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  // Merge admin headers (don't overwrite existing ones)
  for (const [key, value] of Object.entries(ADMIN_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
/**
 * Tiny typed fetch helpers used by the frontend views.
 */

export async function api<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error((data as { error?: string }).error || `Request failed (${res.status})`) as Error & {
      status?: number
      body?: unknown
    }
    err.status = res.status
    err.body = data
    throw err
  }
  return data as T
}

export const apiGet = <T = unknown>(url: string) => api<T>(url, { method: 'GET' })
export const apiPost = <T = unknown>(url: string, body?: unknown) =>
  api<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined })

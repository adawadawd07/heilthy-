/**
 * Browser fetch wrapper for API calls.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, { credentials: 'same-origin', ...init });
}

export async function apiJson<T>(input: string, init?: RequestInit): Promise<T | null> {
  const res = await apiFetch(input, init);
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

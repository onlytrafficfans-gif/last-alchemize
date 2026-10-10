export interface RestoredSession {
  user: { id: string; email: string; name: string };
  token: string;
}

/** Legacy local tokens have no expiry; honor expiry only when explicitly stored. */
export function parseStoredSession(raw: string, now = Date.now()): RestoredSession | null {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !value.user ||
        typeof value.token !== 'string' || !value.token.trim()) return null;
    const { id, email, name } = value.user;
    if (![id, email, name].every((field) => typeof field === 'string' && field.trim())) return null;
    if (value.expiresAt !== undefined &&
        (typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt) || value.expiresAt <= now)) return null;
    return { user: { id, email, name }, token: value.token };
  } catch {
    return null;
  }
}

// Cache localStorage avec expiration à minuit local prochain.
// `storage` est injecté pour rester testable hors navigateur.

interface Envelope<T> {
  expiresAt: number;
  value: T;
}

export function nextMidnight(now: number): number {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0).getTime();
}

export function writeCache<T>(storage: Storage, key: string, value: T, expiresAt: number): void {
  try {
    storage.setItem(key, JSON.stringify({ expiresAt, value } satisfies Envelope<T>));
  } catch {
    // quota plein / mode privé : on ignore, le cache est best-effort
  }
}

export function readCache<T>(storage: Storage, key: string, now: number): T | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as Envelope<T>;
    if (typeof env?.expiresAt !== 'number' || env.expiresAt <= now) return null;
    return env.value;
  } catch {
    return null;
  }
}

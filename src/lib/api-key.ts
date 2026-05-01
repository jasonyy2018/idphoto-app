/**
 * Hash a raw API key using SHA-256 for secure storage.
 * We never store the raw key in the database.
 */
export async function hashApiKey(rawKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a new API key in the format: pk_live_<random32chars>
 */
export function generateApiKey(): string {
  const randomBuffer = new Uint8Array(24);
  crypto.getRandomValues(randomBuffer);
  // Base64url encode without Buffer
  const base64 = btoa(String.fromCharCode(...randomBuffer));
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `pk_live_${base64url}`;
}

/**
 * Verify a raw API key against its stored hash.
 */
export async function verifyApiKey(rawKey: string, storedHash: string): Promise<boolean> {
  const hash = await hashApiKey(rawKey);
  // Simple constant time comparison is not easily available in pure Web Crypto
  // For API keys, a simple string comparison is usually sufficient if the hash is used
  return hash === storedHash;
}

/**
 * Extract prefix (first 12 chars) for display in UI.
 */
export function getKeyPrefix(rawKey: string): string {
  return rawKey.substring(0, 12);
}

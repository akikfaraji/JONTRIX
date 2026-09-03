// Token minting + hashing — VOL-10 §2 registry shape, D-03/D-04 semantics.
// Secrets appear exactly once (the creation/rotation response); only the
// SHA-256 hash, a display prefix, and the last4 are ever stored.

import { createHash, randomBytes } from 'node:crypto';

export type TokenKind = 'pat' | 'aat' | 'sess';

export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Random 32-byte secret, hex-encoded (64 chars). */
export function randomSecret(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Mint a bearer secret for a token kind. Format: `jx_<kind>_<64 hex>`.
 * Returns the full secret (shown to the user exactly once) plus the stored
 * projection (hash, prefix, last4).
 */
export function mintSecret(kind: 'pat' | 'aat'): {
  secret: string;
  hash: string;
  prefix: string;
  last4: string;
} {
  const secret = `jx_${kind}_${randomSecret()}`;
  return {
    secret,
    hash: sha256(secret),
    prefix: secret.slice(0, 10), // jx_pat_xxxx
    last4: secret.slice(-4),
  };
}

/** Hash an incoming bearer for lookup — constant-time compare not needed
 *  because the hash is the lookup key and secrets are 256-bit random. */
export function bearerHash(bearer: string): string {
  return sha256(bearer);
}

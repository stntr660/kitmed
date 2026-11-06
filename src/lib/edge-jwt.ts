/**
 * Edge-compatible JWT (HS256) verification for the Next.js middleware.
 *
 * The middleware runs in the Edge runtime, where `jsonwebtoken` (Node crypto)
 * is not available. This uses only Web APIs (crypto.subtle, TextEncoder, atob),
 * which the Edge runtime provides, so no new dependency is needed.
 *
 * Tokens are signed by `jsonwebtoken` with HS256 (its default) in
 * src/lib/auth-utils.ts and src/lib/auth.ts. Route handlers still do their own
 * full verification with `withAuth`; this is the first gate.
 */

export interface EdgeJwtPayload {
  userId?: string;
  email?: string;
  role?: string;
  exp?: number;
  nbf?: number;
  [key: string]: unknown;
}

function base64UrlToBytes(input: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(input)) {
    throw new Error('invalid base64url');
  }
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJsonPart(part: string): any {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)));
}

/**
 * Returns the payload when the token has a valid HS256 signature for `secret`
 * and is not expired / not used before `nbf`. Returns null otherwise.
 * Never throws. Fails closed when `secret` is empty.
 */
export async function verifyJwtHS256(
  token: string | null | undefined,
  secret: string | null | undefined,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): Promise<EdgeJwtPayload | null> {
  try {
    if (!token || !secret) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerPart, payloadPart, signaturePart] = parts;

    const header = decodeJsonPart(headerPart);
    // Only accept HS256: blocks "alg: none" and algorithm-confusion tokens.
    if (!header || header.alg !== 'HS256') return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(signaturePart),
      encoder.encode(`${headerPart}.${payloadPart}`)
    );
    if (!valid) return null;

    const payload = decodeJsonPart(payloadPart);
    if (!payload || typeof payload !== 'object') return null;

    // jsonwebtoken always sets exp here (expiresIn: '24h'); a token without it is refused.
    if (typeof payload.exp !== 'number' || nowSeconds >= payload.exp) return null;
    if (typeof payload.nbf === 'number' && nowSeconds < payload.nbf) return null;

    return payload as EdgeJwtPayload;
  } catch {
    return null;
  }
}

/** Reads the admin token from `Authorization: Bearer` or the `admin-token` cookie. */
export function extractAdminToken(request: {
  headers: { get(name: string): string | null };
  cookies: { get(name: string): { value: string } | undefined };
}): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const value = authHeader.substring(7).trim();
    if (value) return value;
  }
  const cookie = request.cookies.get('admin-token')?.value;
  return cookie || null;
}

/**
 * True when the request carries a valid, unexpired admin JWT, in the
 * `Authorization: Bearer` header or in the `admin-token` cookie. Both are
 * tried, so a stale header (e.g. "Bearer null") does not hide a valid cookie.
 */
export async function hasValidAdminToken(request: Parameters<typeof extractAdminToken>[0]): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;
  const candidates: string[] = [];
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) candidates.push(authHeader.substring(7).trim());
  const cookie = request.cookies.get('admin-token')?.value;
  if (cookie) candidates.push(cookie);
  for (const token of candidates) {
    if (await verifyJwtHS256(token, secret)) return true;
  }
  return false;
}

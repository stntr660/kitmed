/**
 * Server-side logout for the stateless admin JWT (Node runtime only).
 *
 * Admin tokens are stateless JWTs (24h). To make "log out" end every session of
 * a user, logout records an `activity_logs` row (action "logout",
 * resource_type "admin_session", resource_id = user id). Any token whose `iat`
 * is at or before the latest logout of its user is refused.
 *
 * This uses the existing activity_logs table, so no schema change or migration
 * is needed. `user_id` stays null on purpose: the environment admin
 * (ADMIN_USER_ID) has no row in `users` and the foreign key would refuse it.
 *
 * The Edge middleware cannot run Prisma, so it still only checks the
 * signature/expiry; the per-user check runs in authenticate() (withAuth) and
 * in /api/admin/auth/me, i.e. before any admin data is read or written.
 */
import { prisma } from '@/lib/database';

export const LOGOUT_ACTION = 'logout';
export const ADMIN_SESSION_RESOURCE = 'admin_session';

/** Date of the latest logout of this user, or null when there is none. */
export async function getSessionsValidAfter(userId: string): Promise<Date | null> {
  const row = await prisma.activity_logs.findFirst({
    where: { action: LOGOUT_ACTION, resource_type: ADMIN_SESSION_RESOURCE, resource_id: userId },
    orderBy: { created_at: 'desc' },
    select: { created_at: true },
  });
  return row?.created_at ?? null;
}

/**
 * True when the token was issued at or before the user's latest logout.
 * `iat` has second precision, so a token issued in the same second as the
 * logout is refused too (safe side). Fails closed: if the lookup fails, the
 * token is treated as revoked.
 */
export async function isTokenRevoked(decoded: { userId?: string; id?: string; iat?: number }): Promise<boolean> {
  const userId = decoded?.userId || decoded?.id;
  if (!userId) return true;
  try {
    const validAfter = await getSessionsValidAfter(String(userId));
    if (!validAfter) return false;
    if (typeof decoded.iat !== 'number') return true;
    return decoded.iat * 1000 <= validAfter.getTime();
  } catch {
    return true;
  }
}

/** Ends every session of this user issued until now. */
export async function revokeUserSessions(userId: string): Promise<void> {
  const { randomUUID } = await import('crypto');
  await prisma.activity_logs.create({
    data: {
      id: randomUUID(),
      user_id: null,
      action: LOGOUT_ACTION,
      resource_type: ADMIN_SESSION_RESOURCE,
      resource_id: String(userId),
      created_at: new Date(),
    },
  });
}

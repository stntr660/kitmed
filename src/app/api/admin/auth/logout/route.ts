import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth-utils';
import { revokeUserSessions } from '@/lib/session-revocation';

/**
 * POST /api/admin/auth/logout
 *
 * 1. Ends every session of the user carried by the request (header or
 *    `admin-token` cookie): tokens issued until now are refused afterwards.
 *    Only a token with a valid signature can log its own user out.
 * 2. Always clears the `admin-token` cookie, with the same name, path and flags
 *    as the login route, and Max-Age=0, even when the token is already
 *    expired or invalid (the middleware lets this path through for that reason).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
  const cookieToken = request.cookies.get('admin-token')?.value || '';

  const userIds = new Set<string>();
  for (const token of [headerToken, cookieToken]) {
    if (!token) continue;
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as any;
      const userId = decoded?.userId || decoded?.id;
      if (userId) userIds.add(String(userId));
    } catch {
      // invalid or expired token: nothing to revoke
    }
  }

  let revoked = true;
  for (const userId of userIds) {
    try {
      await revokeUserSessions(userId);
    } catch {
      revoked = false;
    }
  }

  const response = NextResponse.json(
    revoked
      ? { success: true, data: { message: 'Logged out' } }
      : { success: false, error: { code: 'LOGOUT_INCOMPLETE', message: 'Cookie cleared, but the session could not be revoked' } },
    { status: revoked ? 200 : 500 }
  );

  response.cookies.set('admin-token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  response.headers.set('Cache-Control', 'no-store');

  return response;
}

import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const TEST_SECRET = 'test-secret-for-jest-only-0123456789abcdef';
process.env.JWT_SECRET = TEST_SECRET;

// In-memory activity_logs: enough for the logout rows written and read by
// src/lib/session-revocation.ts.
const mockLogs: Array<{ action: string; resource_type: string; resource_id: string; created_at: Date }> = [];
const mockState = { fail: false };

jest.mock('@/lib/database', () => ({
  prisma: {
    activity_logs: {
      create: jest.fn(async ({ data }: any) => {
        if (mockState.fail) throw new Error('db down');
        mockLogs.push(data);
        return data;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        if (mockState.fail) throw new Error('db down');
        const rows = mockLogs
          .filter(
            (l) => l.action === where.action && l.resource_type === where.resource_type && l.resource_id === where.resource_id
          )
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        return rows[0] ? { created_at: rows[0].created_at } : null;
      }),
    },
    notifications: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    users: { findUnique: jest.fn().mockResolvedValue(null) },
  },
}));

function req(url: string, init: { method?: string; token?: string; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  if (init.cookie) headers.cookie = `admin-token=${init.cookie}`;
  return new NextRequest(new URL(url, 'http://localhost'), { method: init.method || 'GET', headers });
}

// Token issued `secondsAgo` seconds ago (iat in the past, still unexpired).
function tokenFor(userId: string, secondsAgo = 5) {
  const iat = Math.floor(Date.now() / 1000) - secondsAgo;
  return jwt.sign({ userId, email: `${userId}@example.test`, role: 'ADMIN', iat }, TEST_SECRET, { expiresIn: '24h' });
}

const { POST: logout } = require('@/app/api/admin/auth/logout/route');
const { GET: me } = require('@/app/api/admin/auth/me/route');
const { GET: notifications } = require('@/app/api/admin/notifications/route');

beforeEach(() => {
  mockLogs.length = 0;
  mockState.fail = false;
});

describe('POST /api/admin/auth/logout clears the admin-token cookie', () => {
  it('sets admin-token to empty with Max-Age=0 and the same flags as login', async () => {
    const res = await logout(req('/api/admin/auth/logout', { method: 'POST', cookie: tokenFor('u1') }));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie') || '';
    expect(setCookie).toMatch(/^admin-token=;/);
    expect(setCookie).toMatch(/Max-Age=0/i);
    expect(setCookie).toMatch(/Path=\//i);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Secure/i);
    expect(setCookie).toMatch(/SameSite=strict/i);
  });

  it('clears the cookie even without a token or with an invalid one, and revokes nothing', async () => {
    for (const init of [{}, { cookie: 'garbage' }, { token: jwt.sign({ userId: 'u1' }, 'wrong-secret') }]) {
      const res = await logout(req('/api/admin/auth/logout', { method: 'POST', ...init }));
      expect(res.headers.get('set-cookie') || '').toMatch(/admin-token=;.*Max-Age=0/i);
    }
    expect(mockLogs).toHaveLength(0);
  });

  it('the middleware lets logout through even with an expired token', async () => {
    jest.doMock('next-intl/middleware', () => ({ __esModule: true, default: () => () => null }));
    const { middleware } = require('@/middleware');
    const expired = jwt.sign({ userId: 'u1', exp: Math.floor(Date.now() / 1000) - 10 }, TEST_SECRET);
    const res = await middleware(req('/api/admin/auth/logout', { method: 'POST', cookie: expired }));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});

describe('a token issued before logout is refused after logout', () => {
  it('cookie and copied header token: 200 before logout, 401 after (withAuth route and /me)', async () => {
    const token = tokenFor('u1');
    expect((await notifications(req('/api/admin/notifications', { token }))).status).toBe(200);
    expect((await me(req('/api/admin/auth/me', { token }))).status).toBe(200);

    expect((await logout(req('/api/admin/auth/logout', { method: 'POST', cookie: token }))).status).toBe(200);

    expect((await notifications(req('/api/admin/notifications', { token }))).status).toBe(401);
    expect((await notifications(req('/api/admin/notifications', { cookie: token }))).status).toBe(401);
    expect((await me(req('/api/admin/auth/me', { token }))).status).toBe(401);
  });

  it('a new login after logout works; other users are not affected', async () => {
    await logout(req('/api/admin/auth/logout', { method: 'POST', token: tokenFor('u1', 30) }));
    // simulate a login a few seconds later
    const later = jwt.sign(
      { userId: 'u1', role: 'ADMIN', iat: Math.floor(Date.now() / 1000) + 2 },
      TEST_SECRET,
      { expiresIn: '24h' }
    );
    expect((await notifications(req('/api/admin/notifications', { token: later }))).status).toBe(200);
    expect((await notifications(req('/api/admin/notifications', { token: tokenFor('u2') }))).status).toBe(200);
  });

  it('fails closed: if the logout lookup fails, the token is refused', async () => {
    mockState.fail = true;
    expect((await notifications(req('/api/admin/notifications', { token: tokenFor('u1') }))).status).toBe(401);
  });

  it('if the revocation cannot be saved, logout still clears the cookie but reports 500', async () => {
    mockState.fail = true;
    const res = await logout(req('/api/admin/auth/logout', { method: 'POST', cookie: tokenFor('u1') }));
    expect(res.status).toBe(500);
    expect(res.headers.get('set-cookie') || '').toMatch(/admin-token=;.*Max-Age=0/i);
  });
});

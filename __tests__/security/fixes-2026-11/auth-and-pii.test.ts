import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const TEST_SECRET = 'test-secret-for-jest-only-0123456789abcdef';

jest.mock('@/lib/database', () => ({
  prisma: {
    contact_submissions: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // no logout recorded: tokens are not revoked (see session-revocation)
    activity_logs: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
    rfp_requests: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const user = { id: 'u1', email: 'admin@example.test', firstName: 'A', lastName: 'B', role: 'ADMIN' };

function req(url: string, init: { method?: string; token?: string; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  if (init.cookie) headers.cookie = `admin-token=${init.cookie}`;
  return new NextRequest(new URL(url, 'http://localhost'), { method: init.method || 'GET', headers });
}

describe('JWT secret fails closed (auth-utils)', () => {
  const original = process.env.JWT_SECRET;
  afterEach(() => {
    if (original === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original;
  });

  it('refuses to sign a token without JWT_SECRET', () => {
    delete process.env.JWT_SECRET;
    const { generateToken, getJwtSecret } = require('@/lib/auth-utils');
    expect(() => getJwtSecret()).toThrow('JWT_SECRET');
    expect(() => generateToken(user)).toThrow('JWT_SECRET');
  });

  it('rejects a token signed with the old public fallback key', async () => {
    delete process.env.JWT_SECRET;
    const { verifyRequestAuth } = require('@/lib/auth-utils');
    const forged = jwt.sign({ userId: 'x', email: 'x@x', role: 'ADMIN' }, 'development-secret-key');
    expect(await verifyRequestAuth(req('/api/admin/auth/me', { token: forged }))).toBeNull();

    process.env.JWT_SECRET = TEST_SECRET;
    expect(await verifyRequestAuth(req('/api/admin/auth/me', { token: forged }))).toBeNull();
  });

  it('still signs and verifies with a configured secret', async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    const { generateToken, verifyRequestAuth } = require('@/lib/auth-utils');
    const token = generateToken(user);
    const auth = await verifyRequestAuth(req('/api/admin/auth/me', { token }));
    expect(auth).toEqual({ userId: 'u1', email: 'admin@example.test', role: 'ADMIN' });
  });
});

describe('contact / RFP personal data requires an admin', () => {
  let token: string;
  beforeAll(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    token = require('@/lib/auth-utils').generateToken(user);
  });

  const cases: Array<[string, string, string, any]> = [];
  beforeAll(() => {
    const contact = require('@/app/api/contact/route');
    const contactId = require('@/app/api/contact/[id]/route');
    const rfp = require('@/app/api/rfp-requests/route');
    const rfpId = require('@/app/api/rfp-requests/[id]/route');
    cases.push(
      ['GET', '/api/contact', 'list', contact.GET],
      ['GET', '/api/contact/1', 'one', contactId.GET],
      ['PATCH', '/api/contact/1', 'one', contactId.PATCH],
      ['DELETE', '/api/contact/1', 'one', contactId.DELETE],
      ['GET', '/api/rfp-requests', 'list', rfp.GET],
      ['GET', '/api/rfp-requests/1', 'one', rfpId.GET],
      ['PUT', '/api/rfp-requests/1', 'one', rfpId.PUT],
      ['DELETE', '/api/rfp-requests/1', 'one', rfpId.DELETE],
    );
  });

  it('returns 401 without a token, or with a forged token', async () => {
    const forged = jwt.sign({ userId: 'x', role: 'ADMIN' }, 'development-secret-key');
    for (const [method, url, , handler] of cases) {
      const ctx = { params: { id: '1' } };
      expect((await handler(req(url, { method }), ctx)).status).toBe(401);
      expect((await handler(req(url, { method, token: forged }), ctx)).status).toBe(401);
    }
  });

  it('lets an authenticated admin list submissions (header or cookie)', async () => {
    const contact = require('@/app/api/contact/route');
    expect((await contact.GET(req('/api/contact', { token }), {})).status).toBe(200);
    expect((await contact.GET(req('/api/contact', { cookie: token }), {})).status).toBe(200);
  });

  it('keeps the public form submission endpoints open', () => {
    expect(typeof require('@/app/api/contact/route').POST).toBe('function');
    expect(typeof require('@/app/api/rfp-requests/route').POST).toBe('function');
  });
});

describe('logSafeError', () => {
  it('drops Prisma validation messages that embed submitted data', () => {
    const { logSafeError } = require('@/lib/safe-log');
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const err = Object.assign(new Error('Invalid `create()`: { email: "jane@example.test", phone: "+212600000000" }'), {
      name: 'PrismaClientValidationError',
    });
    logSafeError('Error creating contact submission', err);
    const logged = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(logged).toContain('PrismaClientValidationError');
    expect(logged).not.toContain('jane@example.test');
    expect(logged).not.toContain('+212600000000');
    spy.mockRestore();
  });
});

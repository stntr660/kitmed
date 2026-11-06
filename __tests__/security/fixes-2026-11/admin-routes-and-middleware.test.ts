import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const TEST_SECRET = 'test-secret-for-jest-only-0123456789abcdef';
process.env.JWT_SECRET = TEST_SECRET;

jest.mock('@/lib/database', () => {
  const model = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  });
  return {
    prisma: {
      categories: model(),
      partners: model(),
      products: model(),
      product_media: model(),
      banners: model(),
    },
  };
});

jest.mock('@prisma/client', () => {
  const model = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
  });
  return { PrismaClient: jest.fn(() => ({ categories: model(), disciplines: model() })) };
});

jest.mock('@/lib/file-deduplication', () => ({
  cleanupOrphanedFiles: jest.fn().mockResolvedValue({ deleted: 0 }),
  markOrphanedFiles: jest.fn().mockResolvedValue({ marked: 0 }),
  getFileRegistryStats: jest.fn().mockResolvedValue({ total: 0 }),
}));

const admin = { id: 'u1', email: 'admin@example.test', firstName: 'A', lastName: 'B', role: 'ADMIN' };
const editor = { ...admin, id: 'u2', role: 'EDITOR' };

function req(url: string, init: { method?: string; token?: string; cookie?: string; body?: any } = {}) {
  const headers: Record<string, string> = {};
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  if (init.cookie) headers.cookie = `admin-token=${init.cookie}`;
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  return new NextRequest(new URL(url, 'http://localhost'), {
    method: init.method || 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

const paramsCtx = (p: Record<string, string>) => ({ params: Promise.resolve(p) });

let adminToken: string;
let editorToken: string;
const forgedToken = jwt.sign({ userId: 'x', email: 'x@x', role: 'ADMIN' }, 'development-secret-key', { expiresIn: '1h' });
const garbageToken = 'not-a-jwt';
const noneAlgToken =
  Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url') +
  '.' +
  Buffer.from(JSON.stringify({ userId: 'x', role: 'ADMIN', exp: 9999999999 })).toString('base64url') +
  '.';

beforeAll(() => {
  const { generateToken } = require('@/lib/auth-utils');
  adminToken = generateToken(admin);
  editorToken = generateToken(editor);
});

// [label, module path, method, url, context, body]
const ROUTES: Array<[string, string, string, string, any, any]> = [
  ['POST /api/upload', '@/app/api/upload/route', 'POST', '/api/upload', undefined, undefined],
  ['PUT /api/partners/[slug]', '@/app/api/partners/[slug]/route', 'PUT', '/api/partners/x', paramsCtx({ slug: 'x' }), {}],
  ['DELETE /api/partners/[slug]', '@/app/api/partners/[slug]/route', 'DELETE', '/api/partners/x', paramsCtx({ slug: 'x' }), undefined],
  ['POST /api/disciplines', '@/app/api/disciplines/route', 'POST', '/api/disciplines', undefined, {}],
  ['POST /api/categories/enhanced', '@/app/api/categories/enhanced/route', 'POST', '/api/categories/enhanced', undefined, {}],
  ['GET /api/admin/categories', '@/app/api/admin/categories/route', 'GET', '/api/admin/categories', undefined, undefined],
  ['POST /api/admin/categories', '@/app/api/admin/categories/route', 'POST', '/api/admin/categories', undefined, {}],
  ['DELETE /api/admin/categories/[id]', '@/app/api/admin/categories/[id]/route', 'DELETE', '/api/admin/categories/c1', paramsCtx({ id: 'c1' }), undefined],
  ['POST /api/admin/categories/bulk', '@/app/api/admin/categories/bulk/route', 'POST', '/api/admin/categories/bulk', undefined, {}],
  ['GET /api/admin/notifications', '@/app/api/admin/notifications/route', 'GET', '/api/admin/notifications', undefined, undefined],
  ['POST /api/admin/notifications/mark-all-read', '@/app/api/admin/notifications/mark-all-read/route', 'POST', '/api/admin/notifications/mark-all-read', undefined, undefined],
  ['DELETE /api/admin/media/[mediaId]', '@/app/api/admin/media/[mediaId]/route', 'DELETE', '/api/admin/media/m1', paramsCtx({ mediaId: 'm1' }), undefined],
  ['POST /api/admin/files/cleanup', '@/app/api/admin/files/cleanup/route', 'POST', '/api/admin/files/cleanup', undefined, {}],
  ['POST /api/admin/products/bulk-import', '@/app/api/admin/products/bulk-import/route', 'POST', '/api/admin/products/bulk-import', undefined, undefined],
  ['DELETE /api/admin/products/bulk-import-progress', '@/app/api/admin/products/bulk-import-progress/route', 'DELETE', '/api/admin/products/bulk-import-progress', undefined, undefined],
  ['GET /api/admin/products/csv-template', '@/app/api/admin/products/csv-template/route', 'GET', '/api/admin/products/csv-template', undefined, undefined],
  ['POST /api/admin/products/bulk', '@/app/api/admin/products/bulk/route', 'POST', '/api/admin/products/bulk', undefined, {}],
  ['POST /api/admin/partners/bulk', '@/app/api/admin/partners/bulk/route', 'POST', '/api/admin/partners/bulk', undefined, {}],
  ['POST /api/admin/partners/bulk-import', '@/app/api/admin/partners/bulk-import/route', 'POST', '/api/admin/partners/bulk-import', undefined, undefined],
  ['POST /api/admin/partners/bulk-import-enhanced', '@/app/api/admin/partners/bulk-import-enhanced/route', 'POST', '/api/admin/partners/bulk-import-enhanced', undefined, undefined],
  ['POST /api/admin/banners/no-auth', '@/app/api/admin/banners/no-auth/route', 'POST', '/api/admin/banners/no-auth', undefined, {}],
  ['DELETE /api/admin/banners/no-auth/[id]', '@/app/api/admin/banners/no-auth/[id]/route', 'DELETE', '/api/admin/banners/no-auth/b1', { params: { id: 'b1' } }, undefined],
  ['POST /api/admin/settings/test-email', '@/app/api/admin/settings/test-email/route', 'POST', '/api/admin/settings/test-email', undefined, {}],
];

describe('route handlers refuse requests without a valid admin token', () => {
  it.each(ROUTES)('%s: 401 without token, with garbage, forged and alg=none tokens', async (_l, mod, method, url, ctx, body) => {
    const handler = require(mod)[method];
    expect(typeof handler).toBe('function');
    for (const token of [undefined, garbageToken, forgedToken, noneAlgToken]) {
      const res = await handler(req(url, { method, token, body }), ctx);
      expect(res.status).toBe(401);
    }
    // a forged cookie is refused too
    const res = await handler(req(url, { method, cookie: forgedToken, body }), ctx);
    expect(res.status).toBe(401);
  });
});

describe('valid admin tokens are accepted', () => {
  it('GET /api/admin/notifications: 200 with a header token and with the cookie', async () => {
    const { GET } = require('@/app/api/admin/notifications/route');
    expect((await GET(req('/api/admin/notifications', { token: adminToken }))).status).toBe(200);
    expect((await GET(req('/api/admin/notifications', { cookie: adminToken }))).status).toBe(200);
  });

  it('a stale "Bearer null" header does not hide a valid cookie', async () => {
    const { GET } = require('@/app/api/admin/notifications/route');
    const r = new NextRequest(new URL('/api/admin/notifications', 'http://localhost'), {
      headers: { authorization: 'Bearer null', cookie: `admin-token=${adminToken}` },
    });
    expect((await GET(r)).status).toBe(200);
  });

  it('GET /api/admin/files/cleanup: 200 for an admin', async () => {
    const { GET } = require('@/app/api/admin/files/cleanup/route');
    expect((await GET(req('/api/admin/files/cleanup', { token: adminToken }))).status).toBe(200);
  });

  it('GET /api/admin/categories: 200 for an admin', async () => {
    const { GET } = require('@/app/api/admin/categories/route');
    expect((await GET(req('/api/admin/categories', { token: adminToken }))).status).toBe(200);
  });

  it('POST /api/admin/settings/test-email: 200 for an admin', async () => {
    const { POST } = require('@/app/api/admin/settings/test-email/route');
    const res = await POST(
      req('/api/admin/settings/test-email', { method: 'POST', token: adminToken, body: { fromEmail: 'a@example.test', fromName: 'A' } })
    );
    expect(res.status).toBe(200);
  });

  it('admin-only routes return 403 for an editor, panel routes stay open to editors', async () => {
    const cleanup = require('@/app/api/admin/files/cleanup/route');
    expect((await cleanup.GET(req('/api/admin/files/cleanup', { token: editorToken }))).status).toBe(403);
    const notif = require('@/app/api/admin/notifications/route');
    expect((await notif.GET(req('/api/admin/notifications', { token: editorToken }))).status).toBe(200);
  });
});

describe('public endpoints stay public', () => {
  it('visitor GET handlers are not wrapped (no auth import in their modules)', () => {
    const fs = require('fs');
    const path = require('path');
    const base = path.join(__dirname, '../../../src/app/api');
    for (const rel of [
      'products/route.ts',
      'products/[slug]/route.ts',
      'categories/route.ts',
      'categories/[slug]/route.ts',
      'partners/route.ts',
      'banners/route.ts',
      'disciplines/[slug]/route.ts',
      'health/route.ts',
    ]) {
      const src = fs.readFileSync(path.join(base, rel), 'utf8');
      expect(src).not.toMatch(/withAuth/);
    }
    // GET handlers of mixed modules stay unwrapped
    for (const rel of ['partners/[slug]/route.ts', 'disciplines/route.ts', 'categories/enhanced/route.ts']) {
      const src = fs.readFileSync(path.join(base, rel), 'utf8');
      expect(src).toMatch(/export async function GET\(/);
    }
  });
});

describe('edge JWT verification (middleware helper)', () => {
  const { verifyJwtHS256 } = require('@/lib/edge-jwt');

  it('accepts a token signed by jsonwebtoken with the right secret', async () => {
    const payload = await verifyJwtHS256(adminToken, TEST_SECRET);
    expect(payload).toMatchObject({ userId: 'u1', role: 'ADMIN' });
  });

  it('rejects forged, garbage, alg=none, tampered and expired tokens, and a missing secret', async () => {
    expect(await verifyJwtHS256(forgedToken, TEST_SECRET)).toBeNull();
    expect(await verifyJwtHS256(garbageToken, TEST_SECRET)).toBeNull();
    expect(await verifyJwtHS256(noneAlgToken, TEST_SECRET)).toBeNull();
    const [h, p, s] = adminToken.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'u1', role: 'ADMIN', exp: 9999999999 })).toString('base64url');
    expect(await verifyJwtHS256(`${h}.${tamperedPayload}.${s}`, TEST_SECRET)).toBeNull();
    const expired = jwt.sign({ userId: 'u1', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) - 10 }, TEST_SECRET);
    expect(await verifyJwtHS256(expired, TEST_SECRET)).toBeNull();
    const noExp = jwt.sign({ userId: 'u1', role: 'ADMIN' }, TEST_SECRET);
    expect(await verifyJwtHS256(noExp, TEST_SECRET)).toBeNull();
    expect(await verifyJwtHS256(adminToken, '')).toBeNull();
    expect(await verifyJwtHS256(adminToken, undefined)).toBeNull();
  });
});

describe('src/middleware.ts', () => {
  jest.doMock('next-intl/middleware', () => ({
    __esModule: true,
    default: () => () => {
      const { NextResponse } = require('next/server');
      return NextResponse.next();
    },
  }));
  const { middleware } = require('@/middleware');

  it('/api/admin/*: 401 without token, with garbage and with forged tokens', async () => {
    for (const token of [undefined, garbageToken, forgedToken, noneAlgToken]) {
      const res = await middleware(req('/api/admin/products', { token }));
      expect(res.status).toBe(401);
    }
    expect((await middleware(req('/api/admin/products', { cookie: forgedToken }))).status).toBe(401);
  });

  it('/api/admin/*: passes with a valid token (header or cookie)', async () => {
    const viaHeader = await middleware(req('/api/admin/products', { token: adminToken }));
    expect(viaHeader.status).toBe(200);
    expect(viaHeader.headers.get('x-middleware-next')).toBe('1');
    const viaCookie = await middleware(req('/api/admin/products', { cookie: adminToken }));
    expect(viaCookie.headers.get('x-middleware-next')).toBe('1');
  });

  it('login endpoint stays reachable without token', async () => {
    const res = await middleware(req('/api/admin/auth/login', { method: 'POST' }));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('admin pages redirect to the login page without a valid token', async () => {
    for (const [path, locale] of [['/fr/admin', 'fr'], ['/en/admin/products', 'en'], ['/admin/settings', 'en']]) {
      const res = await middleware(req(path, { cookie: forgedToken }));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get('location')!).pathname).toBe(`/${locale}/admin/login`);
    }
  });

  it('admin login page and public pages are not redirected; admin pages pass with a valid cookie', async () => {
    const login = await middleware(req('/fr/admin/login'));
    expect(login.headers.get('location')).toBeNull();
    const admin = await middleware(req('/fr/admin', { cookie: adminToken }));
    expect(admin.headers.get('location')).toBeNull();
    const publicApi = await middleware(req('/api/products'));
    expect(publicApi.headers.get('x-middleware-next')).toBe('1');
  });
});

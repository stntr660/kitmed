/**
 * Anti-scraping layer for the public site (2026-11-18 audit: the whole
 * catalogue could be dumped through /api/products in seconds).
 *
 * What it does, in order:
 *   1. Known search / AI-answer crawlers and link-preview bots (ALLOWED_BOTS)
 *      are never blocked; they get a higher rate allowance.
 *   2. Obvious scraping tools and SEO data harvesters (BLOCKED_AGENTS), and
 *      requests without a User-Agent, get 403.
 *   3. Everyone is rate limited per client IP with a sliding window (429 +
 *      Retry-After). Limits per path group are in RATE_RULES.
 *
 * Runtime: Next.js middleware runs in the Edge runtime sandbox, but with
 * `next start` / the standalone `server.js` (our single Docker container) that
 * sandbox lives inside the one Node process and its module scope is kept
 * between requests, so a module-level Map is a working in-memory store. It is
 * per process: counters reset on deploy/restart and would NOT be shared if the
 * app were ever scaled to several containers (then use Redis or Cloudflare
 * rate limiting, see docs/CLOUDFLARE-ANTI-BOT.md). In `next dev` the
 * middleware can be recompiled, which also resets the counters.
 *
 * Limits of a User-Agent check: the UA is chosen by the client, so a scraper
 * can pretend to be Googlebot. That only buys it the crawler allowance (still
 * capped below), never unlimited access. Real verification (reverse DNS or the
 * published IP ranges of Google/Bing/OpenAI...) is out of scope here; the
 * Cloudflare "Verified Bots" setting does it for free.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Editable lists (case-insensitive substrings of the User-Agent)
// ---------------------------------------------------------------------------

/** Search engines, AI-answer crawlers and link previews: never blocked. */
export const ALLOWED_BOTS: readonly string[] = [
  // Google
  'googlebot', 'google-inspectiontool', 'googleother', 'storebot-google',
  'adsbot-google', 'mediapartners-google', 'apis-google', 'feedfetcher-google',
  'google-site-verification', 'google-read-aloud',
  // Microsoft / Bing
  'bingbot', 'bingpreview', 'msnbot', 'adidxbot',
  // Other search engines
  'duckduckbot', 'duckassistbot', 'applebot', 'yandex', 'qwantbot', 'qwant',
  'ecosia', 'baiduspider', 'petalbot', 'seznambot', 'naverbot', 'yeti/',
  // OpenAI
  'oai-searchbot', 'chatgpt-user', 'gptbot',
  // Perplexity
  'perplexitybot', 'perplexity-user',
  // Anthropic
  'claudebot', 'claude-user', 'claude-searchbot', 'claude-web', 'anthropic-ai',
  // Other AI assistants
  'amazonbot', 'mistralai-user', 'youbot', 'meta-externalagent', 'meta-externalfetcher',
  'cohere-ai', 'phindbot',
  // Link previews / social
  'facebookexternalhit', 'facebot', 'twitterbot', 'linkedinbot', 'whatsapp',
  'slackbot', 'telegrambot', 'discordbot', 'pinterestbot', 'skypeuripreview',
  'redditbot', 'embedly', 'iframely',
  // Uptime monitors (our checks with plain curl should use /api/health, which is exempt)
  'uptimerobot', 'pingdom', 'statuscake', 'betteruptime', 'uptime-kuma', 'site24x7',
  // Performance audits (PageSpeed Insights / Lighthouse)
  'chrome-lighthouse', 'google-pagespeed',
];

/** Scraping libraries, offline copiers, headless browsers, SEO data harvesters. */
export const BLOCKED_AGENTS: readonly string[] = [
  // HTTP libraries / CLIs (default UAs)
  'python-requests', 'python-urllib', 'python-httpx', 'aiohttp', 'httpx',
  'curl/', 'wget', 'libwww-perl', 'lwp::', 'go-http-client', 'node-fetch',
  'axios/', 'undici', 'got (', 'okhttp', 'java/', 'apache-httpclient',
  'restsharp', 'guzzlehttp', 'ruby', 'php/', 'http_request2', 'colly',
  'postmanruntime', 'insomnia',
  // Crawling frameworks and site copiers
  'scrapy', 'httrack', 'sitesucker', 'webcopier', 'offline explorer',
  'teleport', 'webzip', 'webstripper', 'website extractor', 'grab-site',
  'nutch', 'crawler4j', 'heritrix', 'mechanize', 'beautifulsoup',
  // Headless / automated browsers
  'headlesschrome', 'phantomjs', 'puppeteer', 'playwright', 'selenium',
  'slimerjs',
  // SEO / marketing data scrapers
  'ahrefsbot', 'ahrefssiteaudit', 'semrushbot', 'siteauditbot', 'mj12bot',
  'dotbot', 'blexbot', 'dataforseobot', 'serpstatbot', 'megaindex',
  'screaming frog', 'seokicks', 'linkpadbot', 'barkrowler', 'mauibot',
  'zoominfobot', 'sistrix', 'rogerbot', 'spbot', 'awario',
  // Vulnerability scanners
  'zgrab', 'masscan', 'nikto', 'sqlmap', 'nmap', 'nuclei',
];

// ---------------------------------------------------------------------------
// Rate limits
// ---------------------------------------------------------------------------

interface RateRule {
  /** Bucket name (counters are per bucket + client IP). */
  name: string;
  /** Which requests this rule covers. */
  match: (pathname: string, method: string) => boolean;
  /** Max requests per minute and per hour for a normal visitor. */
  perMinute: number;
  perHour: number;
  /** Allowance for ALLOWED_BOTS (UA-based, see note at the top). */
  botPerMinute: number;
  botPerHour: number;
}

const isPage = (p: string) => !p.startsWith('/api/');

export const RATE_RULES: readonly RateRule[] = [
  // Catalogue data: list + single product. A person never opens 60 products a
  // minute or 400 an hour; dumping 1 333 products one by one now takes hours.
  {
    name: 'products',
    match: (p) => p === '/api/products' || p.startsWith('/api/products/'),
    perMinute: 60, perHour: 400,
    botPerMinute: 180, botPerHour: 3000,
  },
  {
    name: 'categories',
    match: (p) => p.startsWith('/api/categories') || p.startsWith('/api/disciplines'),
    perMinute: 60, perHour: 600,
    botPerMinute: 180, botPerHour: 3000,
  },
  {
    name: 'partners',
    match: (p) => p.startsWith('/api/partners'),
    perMinute: 60, perHour: 600,
    botPerMinute: 180, botPerHour: 3000,
  },
  {
    name: 'catalogues',
    match: (p) => p.startsWith('/api/catalogues'),
    perMinute: 30, perHour: 300,
    botPerMinute: 90, botPerHour: 1500,
  },
  // Public forms (contact, quote requests): spam guard.
  {
    name: 'forms',
    match: (p, m) => m !== 'GET' && (p.startsWith('/api/contact') || p.startsWith('/api/rfp-requests')),
    perMinute: 10, perHour: 60,
    botPerMinute: 10, botPerHour: 60,
  },
  // Any other public API call (banners, ...).
  {
    name: 'api',
    match: (p) => p.startsWith('/api/'),
    perMinute: 120, perHour: 2000,
    botPerMinute: 360, botPerHour: 6000,
  },
];

/** Paths the protection never touches (health checks, admin, image proxy). */
function isExempt(pathname: string): boolean {
  return (
    pathname === '/api/health' ||
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/images/') ||
    /^\/(?:(?:en|fr)\/)?admin(?:\/|$)/.test(pathname) ||
    pathname.startsWith('/maintenance')
  );
}

// ---------------------------------------------------------------------------
// Client identification
// ---------------------------------------------------------------------------

/**
 * Client IP as seen behind Traefik (Dokploy).
 * Traefik appends the address of the TCP peer it received the connection from
 * to X-Forwarded-For, so the LAST entry is the real client and cannot be
 * forged (a client can only prepend fake entries). This holds whether or not
 * Traefik is told to trust incoming forwarded headers. Next.js only fills
 * X-Forwarded-For when it is missing (direct access, local dev).
 * X-Real-Ip is a fallback only: Traefik keeps a client-supplied X-Real-Ip when
 * its entrypoint trusts forwarded headers.
 * When the site is put behind Cloudflare, set TRUST_CLOUDFLARE=true so the
 * real visitor IP (CF-Connecting-IP) is used instead of the Cloudflare edge IP.
 */
export function getClientIp(request: NextRequest): string {
  const h = request.headers;
  if (process.env.TRUST_CLOUDFLARE === 'true') {
    const cf = h.get('cf-connecting-ip');
    if (cf) return cf.trim();
  }
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  const realIp = h.get('x-real-ip');
  if (realIp) return realIp.trim();
  return request.ip || 'unknown';
}

export function isAllowedBot(ua: string): boolean {
  const s = ua.toLowerCase();
  return ALLOWED_BOTS.some((t) => s.includes(t));
}

export function isBlockedAgent(ua: string): boolean {
  const s = ua.toLowerCase().trim();
  if (!s) return true; // no User-Agent at all
  return BLOCKED_AGENTS.some((t) => s.includes(t));
}

// ---------------------------------------------------------------------------
// In-memory sliding-window counter (weighted previous + current window)
// ---------------------------------------------------------------------------

interface Counter {
  windowStart: number;
  current: number;
  previous: number;
}

const store = new Map<string, Counter>();
const MAX_KEYS = 50_000;
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000 && store.size < MAX_KEYS) return;
  lastSweep = now;
  for (const [key, c] of store) {
    const windowMs = key.endsWith('|h') ? 3_600_000 : 60_000;
    if (now - c.windowStart >= 2 * windowMs) store.delete(key);
  }
  // Still too big (attack with many IPs): drop the oldest entries.
  if (store.size >= MAX_KEYS) {
    let toDrop = store.size - MAX_KEYS / 2;
    for (const key of store.keys()) {
      if (toDrop-- <= 0) break;
      store.delete(key);
    }
  }
}

/** Counts the hit and returns seconds to wait, or 0 if under the limit. */
function hit(key: string, limit: number, windowMs: number, now: number): number {
  let c = store.get(key);
  if (!c) {
    c = { windowStart: now - (now % windowMs), current: 0, previous: 0 };
    store.set(key, c);
  }
  const elapsedWindows = Math.floor((now - c.windowStart) / windowMs);
  if (elapsedWindows >= 1) {
    c.previous = elapsedWindows === 1 ? c.current : 0;
    c.current = 0;
    c.windowStart += elapsedWindows * windowMs;
  }
  const intoWindow = (now - c.windowStart) / windowMs;
  const estimated = c.previous * (1 - intoWindow) + c.current;
  if (estimated >= limit) {
    // Time until the weighted count drops below the limit.
    let wait: number;
    if (c.current >= limit || c.previous === 0) {
      wait = c.windowStart + windowMs - now;
    } else {
      const neededFraction = 1 - (limit - c.current) / c.previous;
      wait = Math.max(0, (neededFraction - intoWindow) * windowMs);
    }
    return Math.max(1, Math.ceil(wait / 1000));
  }
  c.current += 1;
  return 0;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

function forbidden(isApi: boolean) {
  const res = isApi
    ? NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Automated access is not allowed.' } },
        { status: 403 }
      )
    : new NextResponse('Forbidden', { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

function tooMany(isApi: boolean, retryAfter: number, limit: number) {
  const res = isApi
    ? NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down.', retryAfter } },
        { status: 429 }
      )
    : new NextResponse('Too many requests, please try again in a moment.', {
        status: 429,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
  res.headers.set('Retry-After', String(retryAfter));
  res.headers.set('X-RateLimit-Limit', String(limit));
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Returns a 403/429 response when the request must be refused, or null to let
 * it through. Call it from src/middleware.ts before any other handling.
 */
export function botProtection(request: NextRequest): NextResponse | null {
  if (process.env.BOT_PROTECTION === 'off') return null;

  const { pathname } = request.nextUrl;
  if (isExempt(pathname)) return null;

  const isApi = pathname.startsWith('/api/');
  const ua = request.headers.get('user-agent') || '';
  const bot = isAllowedBot(ua);

  // Minimal mode (owner 2026-11-18): never block by user-agent (AI agents often use plain HTTP
  // libraries), never limit pages, never limit known search/AI crawlers. Only the public API is
  // rate-limited for ordinary clients, plus a spam guard on the public forms.
  if (!isApi) return null;

  // Router prefetches (<Link> in view) are not navigations: don't count them.
  const h = request.headers;
  if (!isApi && (h.get('next-router-prefetch') || h.get('purpose') === 'prefetch' || h.get('x-middleware-prefetch'))) {
    return null;
  }

  const method = request.method.toUpperCase();
  if (method === 'OPTIONS' || method === 'HEAD') return null;

  const rule = RATE_RULES.find((r) => r.match(pathname, method));
  if (!rule) return null;
  if (bot && rule.name !== 'forms') return null;

  const now = Date.now();
  sweep(now);
  const ip = getClientIp(request);
  const perMinute = bot ? rule.botPerMinute : rule.perMinute;
  const perHour = bot ? rule.botPerHour : rule.perHour;
  const base = `${rule.name}|${bot ? 'b' : 'u'}|${ip}`;

  const waitMinute = hit(`${base}|m`, perMinute, 60_000, now);
  if (waitMinute) return tooMany(isApi, waitMinute, perMinute);
  const waitHour = hit(`${base}|h`, perHour, 3_600_000, now);
  if (waitHour) return tooMany(isApi, waitHour, perHour);

  return null;
}

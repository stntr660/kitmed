import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAllowedBot } from './bot-protection';

/*
 * Hot-link protection (anti-scraping, 2026-11-18): product photos and
 * brochures may not be embedded by other websites. Allowed:
 *  - no Referer (direct visit, apps, e-mail clients, Next/Image internal fetch);
 *  - our own sites (kitmed.ma, *.zonemation.cloud, localhost, this host);
 *  - search engines and AI answer sites (they show our images with a link back);
 *  - search/AI crawlers and link-preview bots (Googlebot-Image, bingbot,
 *    facebookexternalhit, Twitterbot, LinkedInBot, WhatsApp...) by User-Agent;
 *  - a normal click on a link to the file (Sec-Fetch-Dest: document): that is
 *    linking, not embedding.
 * Extra hosts can be added with HOTLINK_ALLOWED_HOSTS (comma separated).
 */
const OWN_HOST_SUFFIXES = ['kitmed.ma', 'zonemation.cloud', 'localhost', '127.0.0.1'];
const SEARCH_AND_AI_REFERER_SUFFIXES = [
  'google.com', 'google.co.ma', 'google.fr', 'googleusercontent.com', 'bing.com',
  'duckduckgo.com', 'yandex.com', 'yandex.ru', 'qwant.com', 'ecosia.org',
  'yahoo.com', 'baidu.com', 'chatgpt.com', 'openai.com', 'perplexity.ai',
  'claude.ai', 'copilot.microsoft.com', 'gemini.google.com', 'you.com',
];

function hostMatches(host: string, suffixes: string[]): boolean {
  return suffixes.some((s) => host === s || host.endsWith(`.${s}`));
}

export function isHotlink(request: NextRequest): boolean {
  const referer = request.headers.get('referer');
  if (!referer) return false;

  let refHost: string;
  try {
    refHost = new URL(referer).hostname.toLowerCase();
  } catch {
    return false; // unparsable referer: treat like no referer
  }

  const ownHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '')
    .split(':')[0]
    .toLowerCase();
  const extra = (process.env.HOTLINK_ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  if (refHost === ownHost) return false;
  if (hostMatches(refHost, [...OWN_HOST_SUFFIXES, ...extra])) return false;
  if (hostMatches(refHost, SEARCH_AND_AI_REFERER_SUFFIXES)) return false;
  if (isAllowedBot(request.headers.get('user-agent') || '')) return false;
  if (request.headers.get('sec-fetch-dest') === 'document') return false;
  return true;
}

/** 403 for embedded use of /uploads/* from another website. */
export function hotlinkForbidden(): NextResponse {
  return new NextResponse('Hotlinking not allowed', {
    status: 403,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Referer' },
  });
}

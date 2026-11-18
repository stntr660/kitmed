import type { MetadataRoute } from 'next';
import { isStaging, siteUrl } from '@/lib/seo/site';

// Host-dependent (staging vs production), so computed per request
export const dynamic = 'force-dynamic';

// Search engines and AI answer engines (ChatGPT search, Perplexity, Claude,
// Gemini...) are welcome on the public pages.
const CRAWLERS = [
  'Googlebot',
  'Bingbot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'Applebot',
];

const ALLOW = ['/', '/_next/'];
const DISALLOW = ['/admin', '/fr/admin', '/en/admin', '/api/', '/fr/search', '/en/search', '/*?*'];

export default function robots(): MetadataRoute.Robots {
  // Staging is never indexed
  if (isStaging()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      { userAgent: CRAWLERS, allow: ALLOW, disallow: DISALLOW },
      { userAgent: '*', allow: ALLOW, disallow: DISALLOW },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}

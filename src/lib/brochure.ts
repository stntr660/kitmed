/**
 * Brochure viewer (/{locale}/brochure): same-site PDFs open in the page-flip
 * viewer instead of the browser's PDF viewer (which always offers a download).
 * Only paths under /uploads/ ending in .pdf are accepted: no external URL,
 * no open redirect, no server-side fetch of an arbitrary address.
 */

const MAX_PATH_LENGTH = 512;
const MAX_TITLE_LENGTH = 200;

/** True for a same-site uploaded PDF path such as /uploads/pdfs/foo.pdf. */
export function isViewerPdfPath(value: string | null | undefined): value is string {
  if (!value || value.length > MAX_PATH_LENGTH) return false;
  if (!value.startsWith('/uploads/')) return false;
  if (!/\.pdf$/i.test(value)) return false;
  // No traversal, protocol-relative, backslash, query/fragment or control characters.
  if (value.includes('..') || value.includes('//') || value.includes('\\')) return false;
  if (/[?#]/.test(value) || /[\u0000-\u001f\u007f]/.test(value)) return false;
  return true;
}

/** Return path back to the page that opened the viewer (same-site, same locale only). */
export function safeReturnPath(value: string | null | undefined, locale: string): string | null {
  if (!value || value.length > MAX_PATH_LENGTH) return null;
  if (!value.startsWith(`/${locale}/`)) return null;
  if (value.includes('//') || value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return null;
  return value;
}

export function cleanBrochureTitle(value: string | null | undefined): string {
  return (value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, MAX_TITLE_LENGTH);
}

/**
 * Link for a brochure button: same-site uploaded PDFs go to the page-flip viewer;
 * anything else (external pages or PDFs on other sites) is returned unchanged.
 */
export function brochureHref(url: string, locale: string, title?: string | null, returnPath?: string | null): string {
  if (!isViewerPdfPath(url)) return url;
  const params = new URLSearchParams({ f: url });
  const t = cleanBrochureTitle(title);
  if (t) params.set('t', t);
  const r = safeReturnPath(returnPath, locale);
  if (r) params.set('r', r);
  return `/${locale}/brochure?${params.toString()}`;
}

'use client';

/**
 * Page-flip brochure viewer: pdf.js renders the PDF pages to images, page-flip
 * (StPageFlip) turns them like a printed brochure. Loaded with next/dynamic
 * (ssr: false) from the /brochure page only, so no other page pays for it.
 *
 * Pages are rendered lazily (current spread ± 2) at a resolution adapted to the
 * screen (devicePixelRatio, max 1600 px wide, more when zoomed); pages far from
 * the current one are released so big catalogues stay fluid. pdf.js fetches the
 * file with HTTP range requests, so only the bytes needed are downloaded.
 *
 * No download or print button; right-click, drag and selection are disabled on
 * the pages. This deters casual copying; it cannot stop a determined user.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Loader2, Mail, Minus, Plus } from 'lucide-react';
import type { PageFlip as PageFlipType } from 'page-flip';

type PdfDocument = {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
};
type PdfPage = {
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
  cleanup: () => void;
};

const MOBILE_MAX = 767; // < 768 px: one page at a time
const MAX_RENDER_WIDTH = 1600; // px, at zoom 1
const MAX_RENDER_WIDTH_ZOOMED = 2400;
const AHEAD = 2; // pages rendered around the current spread
const KEEP = 6; // pages kept in memory around the current spread
const ZOOM_LEVELS = [1, 1.5, 2];

interface Props {
  file: string;
  locale: string;
}

interface RenderedPage {
  url: string;
  width: number;
}

/** Touch-first device (phones, tablets): no hover and a coarse pointer. */
function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX;
}

/** Height of the site header that stays visible once scrolled (it is sticky with a negative top). */
function stickyHeaderHeight() {
  const header = document.querySelector('header');
  if (!header) return 0;
  const top = parseFloat(getComputedStyle(header).top) || 0;
  return Math.max(0, header.getBoundingClientRect().height + Math.min(0, top));
}

export default function BrochureFlipbook({ file, locale }: Props) {
  const t = useTranslations('brochureViewer');

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(0);
  const [landscape, setLandscape] = useState(true);
  const [mobile, setMobile] = useState(isMobileViewport);
  const [zoomIndex, setZoomIndex] = useState(0);
  const zoom = ZOOM_LEVELS[zoomIndex];

  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null); // React renders no children here: page-flip owns it
  const pdfRef = useRef<PdfDocument | null>(null);
  const ratioRef = useRef(1 / Math.SQRT2); // page width / height (A4 until the PDF says otherwise)
  const flipRef = useRef<PageFlipType | null>(null);
  const pagesRef = useRef<HTMLElement[]>([]);
  const renderedRef = useRef(new Map<number, RenderedPage>());
  const queueRef = useRef<number[]>([]);
  const busyRef = useRef(false);
  const currentRef = useRef(0);
  const scrolledRef = useRef(false);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;

  // ---- 1. Load pdf.js and open the document (metadata + first page size only) ----
  useEffect(() => {
    let cancelled = false;
    let doc: PdfDocument | null = null;

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.min.mjs');
        // Worker served as a static file: public/pdfjs/pdf.worker-<version>.min.mjs, a copy of
        // node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs (the Next minifier cannot
        // process it as a bundled asset). After upgrading pdfjs-dist, copy the new worker
        // with the new version in its name, or the viewer shows its error message.
        pdfjs.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker-${pdfjs.version}.min.mjs`;

        const task = pdfjs.getDocument({
          url: encodeURI(file),
          disableAutoFetch: true, // range requests: fetch only what the visible pages need
          isEvalSupported: false,
          enableXfa: false,
        });
        doc = (await task.promise) as unknown as PdfDocument;
        if (cancelled) {
          doc.destroy();
          return;
        }
        const first = await doc.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        if (vp.width > 0 && vp.height > 0) ratioRef.current = vp.width / vp.height;
        pdfRef.current = doc;
        setNumPages(doc.numPages);
        setStatus('ready');
      } catch (error) {
        if (!cancelled) {
          console.error('Brochure viewer: cannot open the PDF', error);
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      pdfRef.current = null;
      doc?.destroy();
    };
  }, [file]);

  // ---- 2. Lazy page rendering (one page at a time, nearest first) ----
  const targetWidth = useCallback(() => {
    const flip = flipRef.current;
    const cssWidth = flip ? flip.getBoundsRect().pageWidth : 600;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cap = zoomRef.current > 1 ? MAX_RENDER_WIDTH_ZOOMED : MAX_RENDER_WIDTH;
    return Math.max(300, Math.min(cap, Math.round(cssWidth * dpr)));
  }, []);

  const releaseFarPages = useCallback((center: number) => {
    renderedRef.current.forEach((_page, index) => {
      if (index < center - KEEP || index > center + KEEP + 1) {
        renderedRef.current.delete(index);
        const img = pagesRef.current[index]?.querySelector('img');
        if (img) img.removeAttribute('src');
        pagesRef.current[index]?.classList.remove('is-rendered');
      }
    });
  }, []);

  const pump = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      while (queueRef.current.length) {
        const index = queueRef.current.shift()!;
        const doc = pdfRef.current;
        const el = pagesRef.current[index];
        if (!doc || !el) continue;
        const width = targetWidth();
        const done = renderedRef.current.get(index);
        if (done && done.width >= width * 0.9) continue;

        try {
          const page = await doc.getPage(index + 1);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: width / base.width });
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D not available');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          // JPEG data URL (the site CSP allows data: images, not blob:).
          const url = canvas.toDataURL('image/jpeg', 0.88);
          canvas.width = 0;
          canvas.height = 0;
          page.cleanup();
          if (pdfRef.current !== doc || pagesRef.current[index] !== el) continue;

          const img = el.querySelector('img');
          if (img) img.src = url;
          el.classList.add('is-rendered');
          renderedRef.current.set(index, { url, width });
        } catch (error) {
          // One broken page must not stop the others.
          console.error('Brochure viewer: page render failed', index + 1, error);
        }
      }
    } finally {
      busyRef.current = false;
    }
  }, [targetWidth]);

  const scheduleAround = useCallback(
    (center: number) => {
      const total = pagesRef.current.length;
      if (!total) return;
      // Visible pages first (spread = center, center + 1), then outwards.
      const order = [center, center + 1];
      for (let d = 1; d <= AHEAD; d++) order.push(center + 1 + d, center - d);
      queueRef.current = order.filter((i, k) => i >= 0 && i < total && order.indexOf(i) === k);
      releaseFarPages(center);
      void pump();
    },
    [pump, releaseFarPages]
  );

  // ---- 3. Book size: fits the stage width and the window height ----
  const applySize = useCallback(() => {
    const stage = stageRef.current;
    const host = hostRef.current;
    if (!stage || !host) return;
    const style = getComputedStyle(stage);
    const available = stage.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
    // Book + controls fit under the sticky header once the viewer is scrolled into view.
    const chrome = stickyHeaderHeight() + (isMobileViewport() ? 112 : 128);
    const maxHeight = Math.max(320, window.innerHeight - chrome);
    const spread = isMobileViewport() ? 1 : 2;
    const base = Math.min(available, maxHeight * ratioRef.current * spread);
    host.style.width = `${Math.floor(base * zoomRef.current)}px`;
    flipRef.current?.update();
  }, []);

  // ---- 4. Build the book (rebuilt when switching between phone and desktop) ----
  useEffect(() => {
    if (status !== 'ready' || !hostRef.current || !numPages) return;
    let destroyed = false;
    let flip: PageFlipType | null = null;
    const host = hostRef.current;

    (async () => {
      const { PageFlip } = await import('page-flip');
      if (destroyed) return;

      const book = document.createElement('div');
      book.className = 'kf-book';
      host.appendChild(book);

      const pages: HTMLElement[] = [];
      for (let i = 0; i < numPages; i++) {
        const page = document.createElement('div');
        page.className = 'kf-page';
        const img = document.createElement('img');
        img.alt = '';
        img.draggable = false;
        img.decoding = 'async';
        page.appendChild(img);
        const spinner = document.createElement('span');
        spinner.className = 'kf-spinner';
        spinner.setAttribute('aria-hidden', 'true');
        page.appendChild(spinner);
        pages.push(page);
      }
      pagesRef.current = pages;
      renderedRef.current.clear();

      applySize();
      const isPhone = isMobileViewport();
      const pageHeight = 1000;
      flip = new PageFlip(book, {
        width: Math.round(pageHeight * ratioRef.current),
        height: pageHeight,
        size: 'stretch',
        // Phone: always one page; desktop: always the two-page spread.
        minWidth: isPhone ? 100000 : 50,
        maxWidth: 5000,
        minHeight: 50,
        maxHeight: 20000,
        autoSize: true,
        usePortrait: true,
        showCover: true,
        drawShadow: true,
        maxShadowOpacity: 0.45,
        flippingTime: 750,
        mobileScrollSupport: true,
        // Touch screens: page-flip's own drag handling fights the page scroll (owner 2026-11-18),
        // so on touch devices we handle gestures ourselves below (axis lock: vertical = scroll,
        // horizontal swipe = flip). Mouse users keep the drag-the-corner effect.
        useMouseEvents: !isTouchDevice(),
        showPageCorners: !isTouchDevice(),
        startPage: Math.min(currentRef.current, numPages - 1),
      });
      flip.loadFromHTML(pages);
      // page-flip puts a min-width on its root (set in loadFromHTML); the stage handles sizing instead.
      book.style.minWidth = '0';
      book.style.minHeight = '0';
      flipRef.current = flip;
      flip.update();

      // Touch gestures with an axis lock: the browser keeps vertical scrolling (touch-action: pan-y),
      // a clear horizontal swipe turns the page, a quick tap on the left/right half turns it too.
      if (isTouchDevice()) {
        book.style.touchAction = 'pan-y pinch-zoom';
        let sx = 0, sy = 0, st = 0, axis: 'x' | 'y' | null = null, multi = false;
        const onStart = (e: TouchEvent) => {
          multi = e.touches.length > 1;
          const t = e.touches[0];
          sx = t.clientX; sy = t.clientY; st = Date.now(); axis = null;
        };
        const onMove = (e: TouchEvent) => {
          if (multi || e.touches.length > 1) { multi = true; return; }
          const t = e.touches[0];
          const dx = t.clientX - sx, dy = t.clientY - sy;
          if (!axis && Math.abs(dx) + Math.abs(dy) > 10) axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
          if (axis === 'x' && e.cancelable) e.preventDefault();
        };
        const onEnd = (e: TouchEvent) => {
          if (multi) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - sx, dy = t.clientY - sy;
          const f = flipRef.current;
          if (!f) return;
          if (axis === 'x' && Math.abs(dx) > 40) {
            if (dx < 0) f.flipNext('bottom'); else f.flipPrev('bottom');
          } else if (!axis && Math.abs(dx) < 10 && Math.abs(dy) < 10 && Date.now() - st < 300) {
            const r = book.getBoundingClientRect();
            if (t.clientX > r.left + r.width / 2) f.flipNext('bottom'); else f.flipPrev('bottom');
          }
          axis = null;
        };
        book.addEventListener('touchstart', onStart, { passive: true });
        book.addEventListener('touchmove', onMove, { passive: false });
        book.addEventListener('touchend', onEnd, { passive: true });
      }

      const sync = (index: number) => {
        currentRef.current = index;
        setCurrent(index);
        scheduleAround(index);
      };
      flip.on<number>('flip', (e) => sync(e.data));
      flip.on<string>('changeOrientation', (e) => setLandscape(e.data === 'landscape'));
      flip.on<string>('changeState', (e) => {
        // Start rendering the next pages as soon as the user begins a flip.
        if (e.data === 'flipping' || e.data === 'user_fold') {
          const i = flip?.getCurrentPageIndex() ?? currentRef.current;
          scheduleAround(i);
        }
      });
      setLandscape(flip.getOrientation() === 'landscape');
      sync(flip.getCurrentPageIndex());
      // Once the layout has settled, re-render the visible pages if they got wider.
      requestAnimationFrame(() => {
        if (destroyed) return;
        applySize();
        scheduleAround(currentRef.current);
        // First opening: bring the whole book into view (once, and only if the user has not scrolled).
        const stage = stageRef.current;
        if (!scrolledRef.current && stage && window.scrollY < 40) {
          scrolledRef.current = true;
          const top = stage.getBoundingClientRect().top + window.scrollY - stickyHeaderHeight() - 8;
          if (top > 0) window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    })().catch((error) => {
      console.error('Brochure viewer: page-flip failed', error);
      setStatus('error');
    });

    return () => {
      destroyed = true;
      queueRef.current = [];
      try {
        flip?.destroy();
      } catch {
        /* already detached */
      }
      flipRef.current = null;
      host.innerHTML = '';
      renderedRef.current.clear();
      pagesRef.current = [];
    };
  }, [status, numPages, mobile, applySize, scheduleAround]);

  // ---- 5. Resize, zoom, keyboard ----
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const nowMobile = isMobileViewport();
        setMobile((was) => (was === nowMobile ? was : nowMobile));
        applySize();
        scheduleAround(currentRef.current);
      }, 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [applySize, scheduleAround]);

  useEffect(() => {
    applySize();
    if (flipRef.current) scheduleAround(currentRef.current); // sharper pages when zoomed
  }, [zoom, applySize, scheduleAround]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault(); // no "save page" / "print" of the brochure
        return;
      }
      if (e.key === 'ArrowRight') flipRef.current?.flipNext();
      else if (e.key === 'ArrowLeft') flipRef.current?.flipPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const blockContextMenu = (e: React.SyntheticEvent) => e.preventDefault();

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#10146B]/10 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-[#10146B]">{t('errorTitle')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{t('errorText')}</p>
        <Link
          href={`/${locale}/contact`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#10146B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A0EA4]"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {t('contactUs')}
        </Link>
      </div>
    );
  }

  const last = numPages - 1;
  const spreadEnd = landscape && current > 0 && current < last ? current + 1 : current;
  const counter =
    spreadEnd > current
      ? t('pageCounter', { current: `${current + 1}–${spreadEnd + 1}`, total: numPages })
      : t('pageCounter', { current: current + 1, total: numPages });
  const atStart = current <= 0;
  const atEnd = spreadEnd >= last;

  return (
    <div
      className="kf-viewer select-none"
      onContextMenu={blockContextMenu}
      onDragStart={blockContextMenu}
      onCopy={blockContextMenu}
    >
      <style>{VIEWER_CSS}</style>

      <div className="relative">
        <div ref={stageRef} className="kf-stage relative overflow-auto rounded-2xl bg-[#E9EDF7] px-0 py-4 sm:px-14 sm:py-6">
          {status === 'loading' && (
            <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-600" role="status">
              <Loader2 className="h-5 w-5 animate-spin text-[#0B5CAD]" aria-hidden="true" />
              {t('loading')}
            </div>
          )}
          <div ref={hostRef} className="kf-host mx-auto" />
        </div>

        {status === 'ready' && (
          <>
            <button
              type="button"
              onClick={() => flipRef.current?.flipPrev()}
              disabled={atStart}
              aria-label={t('prev')}
              className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#10146B] shadow-md transition hover:bg-[#10146B] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#10146B] sm:flex"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => flipRef.current?.flipNext()}
              disabled={atEnd}
              aria-label={t('next')}
              className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#10146B] shadow-md transition hover:bg-[#10146B] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#10146B] sm:flex"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {status === 'ready' && (
        <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => flipRef.current?.flipPrev()}
            disabled={atStart}
            aria-label={t('prev')}
            className="kf-ctrl"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="min-w-[6.5rem] rounded-full bg-[#10146B] px-4 py-2 text-center text-sm font-semibold tabular-nums text-white" aria-live="polite">
            {counter}
          </span>
          <button
            type="button"
            onClick={() => flipRef.current?.flipNext()}
            disabled={atEnd}
            aria-label={t('next')}
            className="kf-ctrl"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="mx-1 h-6 w-px bg-slate-300 sm:mx-2" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setZoomIndex((z) => Math.max(0, z - 1))}
            disabled={zoomIndex === 0}
            aria-label={t('zoomOut')}
            className="kf-ctrl"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-12 text-center text-sm font-medium tabular-nums text-slate-600">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoomIndex((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1))}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            aria-label={t('zoomIn')}
            className="kf-ctrl"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <p className="mt-3 text-center text-xs text-slate-500 md:hidden">{t('hint')}</p>
    </div>
  );
}

const VIEWER_CSS = `
.kf-viewer, .kf-viewer * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
.kf-host { max-width: none; }
.kf-page { background: #fff; overflow: hidden; }
.kf-page img { display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; -webkit-user-drag: none; opacity: 0; transition: opacity .25s ease; }
.kf-page.is-rendered img { opacity: 1; }
.kf-page .kf-spinner { position: absolute; left: 50%; top: 50%; width: 28px; height: 28px; margin: -14px 0 0 -14px; border-radius: 9999px; border: 3px solid rgba(11,92,173,.18); border-top-color: #0B5CAD; animation: kf-spin .8s linear infinite; }
.kf-page.is-rendered .kf-spinner { display: none; }
.kf-book .stf__item { box-shadow: 0 1px 2px rgba(16,20,107,.08); }
.kf-ctrl { display: inline-flex; height: 2.5rem; width: 2.5rem; align-items: center; justify-content: center; border-radius: 9999px; border: 1px solid rgba(16,20,107,.15); background: #fff; color: #10146B; transition: background-color .15s, color .15s; }
.kf-ctrl:hover:not(:disabled) { background: #10146B; color: #fff; }
.kf-ctrl:disabled { opacity: .35; cursor: default; }
@keyframes kf-spin { to { transform: rotate(360deg); } }
@media print { .kf-viewer { display: none !important; } }
`;

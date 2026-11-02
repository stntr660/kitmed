'use client';

import { useEffect } from 'react';

/**
 * Catalogue scroll: a link click starts at the top, browser Back/Forward puts
 * the user back on the card they clicked (client, 2026-10-16: « quand on
 * revient en arrière, garder la même section, pas renvoyer en haut »).
 *
 * Catalogue pages fetch on the client and render a one-screen spinner first.
 * The browser would restore the old offset against that short page and get
 * clamped to the footer, so restoration is manual: scrollY is recorded per URL
 * while real content is on screen, and put back once `ready` turns true after
 * a popstate. `ready` must flip only when the listing is committed, otherwise
 * the target offset is clamped against the spinner.
 */

const STORAGE_PREFIX = 'kitmed:scroll:';
// A popstate this old no longer describes the page being rendered.
const POP_WINDOW_MS = 15000;

let lastPop: { path: string; at: number } | null = null;

const currentPath = () => window.location.pathname + window.location.search;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    lastPop = { path: currentPath(), at: Date.now() };
  });
}

export function useScrollRestore(ready: boolean) {
  useEffect(() => {
    if (!ready) return;

    try {
      window.history.scrollRestoration = 'manual';
    } catch {
      // read-only in some embedded browsers; the scrollTo below still wins
    }

    const path = currentPath();
    const key = STORAGE_PREFIX + path;

    const cameBack = !!lastPop && lastPop.path === path && Date.now() - lastPop.at < POP_WINDOW_MS;
    if (cameBack) lastPop = null;

    let target = 0;
    if (cameBack) {
      try {
        target = Number(sessionStorage.getItem(key)) || 0;
      } catch {
        // storage unavailable (private mode): fall back to the top
      }
    }
    // 'instant' overrides the site's smooth scrolling, so arrival does not
    // animate from the previous page's offset. No requestAnimationFrame: it
    // never fires while the tab is in the background.
    window.scrollTo({ top: target, left: 0, behavior: 'instant' });

    const save = () => {
      // The URL changes before this page unmounts; never record the next
      // page's offset under this page's key.
      if (currentPath() !== path) return;
      try {
        sessionStorage.setItem(key, String(Math.round(window.scrollY)));
      } catch {
        // storage unavailable: restoration simply won't happen
      }
    };
    window.addEventListener('scroll', save, { passive: true });

    return () => window.removeEventListener('scroll', save);
  }, [ready]);
}

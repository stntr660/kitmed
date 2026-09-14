'use client';

import { useEffect } from 'react';

/**
 * Put the user back where they were when they return to a catalogue page with
 * the browser's Back/Forward button.
 *
 * Catalogue pages fetch their data on the client and render a one-screen
 * loading spinner first. The browser restores the old scroll offset against
 * that short page, gets clamped to its bottom (the footer), and stays there
 * once the real content arrives -- "going back jumps to the bottom of the page".
 *
 * So: record scrollY per URL while real content is on screen, and once `ready`
 * turns true after a popstate, scroll to the recorded offset. Any other arrival
 * (a link click) starts at the top.
 */

const STORAGE_PREFIX = 'kitmed:scroll:';
// A popstate this old no longer describes the page being rendered.
const POP_WINDOW_MS = 15000;

let lastPop: { path: string; at: number } | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    lastPop = { path: window.location.pathname + window.location.search, at: Date.now() };
  });
}

export function useScrollRestore(ready: boolean) {
  useEffect(() => {
    if (!ready) return;

    const path = window.location.pathname + window.location.search;
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
    // Effects run after the listing has been committed, so the page already
    // has its full height; scrollTo forces layout synchronously. No
    // requestAnimationFrame: it never fires while the tab is in the background.
    window.scrollTo(0, target);

    const save = () => {
      // The URL changes before this page unmounts; never record the next
      // page's offset under this page's key.
      if (window.location.pathname + window.location.search !== path) return;
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

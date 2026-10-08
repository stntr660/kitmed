'use client';

import { useEffect } from 'react';

/**
 * Start catalogue arrivals at the top, including browser Back/Forward.
 * Wait until client-loaded content is committed: resetting against the shorter
 * loading screen can leave the user at its footer after the listing appears.
 */
export function useScrollRestore(ready: boolean) {
  useEffect(() => {
    if (!ready) return;

    // Override the site's smooth scrolling so arrival does not animate from
    // an old position. This also runs when the tab is in the background.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [ready]);
}

import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const scrollToHash = (hash, behavior) => {
  const id = decodeURIComponent((hash || '').replace(/^#/, ''));
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: 'start' });
  return true;
};

/**
 * Scrolls to the URL hash after client-side navigations (e.g. /menu → /#about).
 * The browser cannot do this itself because the target is rendered by React
 * after the route change.
 */
export default function useHashScroll() {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const didMountRef = useRef(false);

  useLayoutEffect(() => {
    const { hash, pathname } = location;
    const isFirstPaint = !didMountRef.current;
    didMountRef.current = true;
    const pathChanged = prevPathRef.current !== pathname;
    prevPathRef.current = pathname;

    if (!hash) return undefined;

    const behavior = isFirstPaint || pathChanged ? 'auto' : 'smooth';
    if (scrollToHash(hash, behavior)) return undefined;

    let cancelled = false;
    const retry = () => {
      if (!cancelled) scrollToHash(hash, 'auto');
    };
    const timers = [80, 250, 600].map((ms) => setTimeout(retry, ms));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [location.pathname, location.hash]);
}

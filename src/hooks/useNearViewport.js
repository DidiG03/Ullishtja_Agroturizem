import { useEffect, useState } from 'react';

/**
 * True once the element has come within `rootMargin` of the viewport, and stays
 * true. Used to hold back decorative videos until the visitor scrolls near them,
 * so they don't compete with the first paint for bandwidth.
 */
export default function useNearViewport(ref, rootMargin = '300px 0px') {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (near || !el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, near]);

  return near;
}

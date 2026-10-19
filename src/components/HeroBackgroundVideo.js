import React, { useEffect, useRef, useState } from 'react';
import './HeroBackgroundVideo.css';

const MOBILE_MEDIA = '(max-width: 768px)';

function shouldLoadVideo() {
  if (typeof window === 'undefined') return false;

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  // Decorative only — not worth the bytes on metered or slow connections.
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData) return false;
  if (connection && /^(slow-)?2g$/.test(connection.effectiveType || '')) return false;

  return window.matchMedia?.(MOBILE_MEDIA).matches ?? window.innerWidth <= 768;
}

export default function HeroBackgroundVideo({ poster, src }) {
  const [enabled, setEnabled] = useState(false);
  const [afterFirstPaint, setAfterFirstPaint] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_MEDIA);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluate = () => setEnabled(shouldLoadVideo());

    evaluate();
    mobileQuery.addEventListener('change', evaluate);
    motionQuery.addEventListener('change', evaluate);

    return () => {
      mobileQuery.removeEventListener('change', evaluate);
      motionQuery.removeEventListener('change', evaluate);
    };
  }, []);

  // The video is a ~1MB download. Starting it while the page is still loading
  // takes bandwidth from the fonts, poster and scripts on slow mobile networks,
  // so wait for the load event and then for the main thread to go idle — the
  // poster is already painted as a CSS background underneath.
  useEffect(() => {
    if (!enabled) return undefined;

    let idleId;
    let timeoutId;

    const scheduleVideo = () => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => setAfterFirstPaint(true), {
          timeout: 2500,
        });
      } else {
        timeoutId = window.setTimeout(() => setAfterFirstPaint(true), 1200);
      }
    };

    if (document.readyState === 'complete') scheduleVideo();
    else window.addEventListener('load', scheduleVideo, { once: true });

    return () => {
      window.removeEventListener('load', scheduleVideo);
      if (idleId && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !afterFirstPaint) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    tryPlay();
  }, [enabled, afterFirstPaint, canPlay]);

  if (!enabled || !afterFirstPaint) return null;

  return (
    <video
      ref={videoRef}
      className={`hero-bg-video${canPlay ? ' is-ready' : ''}`}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={poster}
      onCanPlay={() => setCanPlay(true)}
      aria-hidden="true"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

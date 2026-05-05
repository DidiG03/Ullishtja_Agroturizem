import React, { useEffect, useRef, useState } from 'react';
import './HeroBackgroundVideo.css';

const MOBILE_BREAKPOINT = 768;
const FAST_TYPES = new Set(['4g', '5g']);

function shouldLoadVideo() {
  if (typeof window === 'undefined') return false;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  if (window.innerWidth > MOBILE_BREAKPOINT) return false;

  const conn =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!conn) {
    return true;
  }

  if (conn.saveData) return false;

  if (conn.effectiveType && !FAST_TYPES.has(conn.effectiveType)) {
    return false;
  }

  if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 2) {
    return false;
  }

  return true;
}

export default function HeroBackgroundVideo({ poster, src }) {
  const [enabled, setEnabled] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const evaluate = () => setEnabled(shouldLoadVideo());
    evaluate();

    const conn =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && typeof conn.addEventListener === 'function') {
      conn.addEventListener('change', evaluate);
    }
    window.addEventListener('resize', evaluate);
    return () => {
      if (conn && typeof conn.removeEventListener === 'function') {
        conn.removeEventListener('change', evaluate);
      }
      window.removeEventListener('resize', evaluate);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    tryPlay();
  }, [enabled, canPlay]);

  if (!enabled) return null;

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

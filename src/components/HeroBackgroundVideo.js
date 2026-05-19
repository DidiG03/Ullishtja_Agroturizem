import React, { useEffect, useRef, useState } from 'react';
import './HeroBackgroundVideo.css';

const MOBILE_MEDIA = '(max-width: 768px)';

function shouldLoadVideo() {
  if (typeof window === 'undefined') return false;

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  return window.matchMedia?.(MOBILE_MEDIA).matches ?? window.innerWidth <= 768;
}

export default function HeroBackgroundVideo({ poster, src }) {
  const [enabled, setEnabled] = useState(false);
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

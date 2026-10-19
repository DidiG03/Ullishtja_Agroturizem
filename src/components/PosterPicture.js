import React from 'react';

/**
 * Responsive AVIF + WebP + compressed JPEG for /images/posters/* assets.
 * Requires `npm run optimize-posters` outputs (e.g. alacarte-poster-640.avif).
 */
export default function PosterPicture({
  base,
  alt,
  className = 'section-img',
  variant = 'section',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 42vw',
  loading = 'lazy',
  fetchPriority,
  width,
  height,
}) {
  const basePath = `/images/posters/${base}`;
  const widths = variant === 'hero' ? [800, 1200, 1600] : [640, 960, 1280];
  const srcSet = (ext) => widths.map((w) => `${basePath}-${w}.${ext} ${w}w`).join(', ');
  const fallbackJpeg =
    variant === 'hero' ? `${basePath}-1400.jpg` : `${basePath}-1280.jpg`;

  return (
    <picture>
      {/* Section posters also ship as AVIF; the hero is WebP only. */}
      {variant !== 'hero' && <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />}
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      <img
        src={fallbackJpeg}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
        width={width}
        height={height}
      />
    </picture>
  );
}

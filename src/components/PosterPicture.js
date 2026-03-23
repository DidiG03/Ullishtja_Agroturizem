import React from 'react';

/**
 * Responsive WebP + compressed JPEG for /images/posters/* assets.
 * Requires `npm run optimize-posters` outputs (e.g. alacarte-poster-640.webp).
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
  const srcSetWebp = widths.map((w) => `${basePath}-${w}.webp ${w}w`).join(', ');
  const fallbackJpeg =
    variant === 'hero' ? `${basePath}-1400.jpg` : `${basePath}-1280.jpg`;

  return (
    <picture>
      <source type="image/webp" srcSet={srcSetWebp} sizes={sizes} />
      <img
        src={fallbackJpeg}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        width={width}
        height={height}
      />
    </picture>
  );
}

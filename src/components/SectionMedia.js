import React from 'react';
import PosterPicture from './PosterPicture';

/**
 * Responsive image for the Events / A-la-carte section blocks.
 *
 * This used to branch to a <video> on mobile, but the per-section video files it
 * pointed at were never generated. Because the SPA rewrite answers unknown paths
 * with index.html, every mobile visitor fetched HTML as a video, hit the error
 * handler, and then downloaded the full-width JPEG fallback on top of the WebP
 * poster it had already loaded. Serving the responsive picture directly lets
 * mobile take the 640w WebP instead.
 */
export default function SectionMedia({
  posterBase,
  alt,
  className = 'section-img',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw',
  loading = 'lazy',
  fetchPriority = 'low',
  width = 1200,
  height = 874,
}) {
  return (
    <div className="section-media">
      <PosterPicture
        base={posterBase}
        alt={alt}
        className={className}
        sizes={sizes}
        loading={loading}
        fetchPriority={fetchPriority}
        width={width}
        height={height}
      />
    </div>
  );
}

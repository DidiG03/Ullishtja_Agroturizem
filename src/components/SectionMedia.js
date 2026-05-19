import React, { Suspense, useEffect, useState } from 'react';
import PosterPicture from './PosterPicture';

const AdaptiveVideo = React.lazy(() => import('./AdaptiveVideo'));

const MOBILE_MEDIA = '(max-width: 768px)';

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MEDIA).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

/**
 * Desktop: poster image. Mobile (≤768px): autoplaying video with poster fallback.
 */
export default function SectionMedia({
  posterBase,
  videoId,
  alt,
  className = 'section-img',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw',
  loading = 'lazy',
  fetchPriority = 'low',
  width = 1200,
  height = 874,
}) {
  const isMobile = useIsMobileViewport();
  const posterWebp = `/images/posters/${posterBase}-1280.webp`;
  const posterJpeg = `/images/posters/${posterBase}-1280.jpg`;

  return (
    <>
      {!isMobile && (
        <div className="section-media section-media--desktop">
          <Suspense fallback={null}>
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
          </Suspense>
        </div>
      )}

      {isMobile && (
        <Suspense fallback={null}>
          <div className="section-media section-media--mobile">
            <AdaptiveVideo
              videoId={videoId}
              poster={posterWebp}
              fallbackImage={posterJpeg}
              alt={alt}
              className={className}
              lazy
            />
          </div>
        </Suspense>
      )}
    </>
  );
}

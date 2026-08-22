import React, { useEffect, useRef, useState } from 'react';
import PosterPicture from './PosterPicture';
import './AboutStoryVideo.css';

const MOBILE_MEDIA = '(max-width: 768px)';
const POSTER_BASE = 'story-poster';
// The <video> poster attribute takes a single URL, so it gets the mid-size variant.
const POSTER = '/images/posters/story-poster-960.webp';
const VIDEO_DESKTOP = '/videos/story/story.mp4';
const VIDEO_MOBILE = '/videos/story/story-mobile.mp4';

function AboutStoryVideo({ alt }) {
  const [videoSrc, setVideoSrc] = useState(null);
  const [canPlay, setCanPlay] = useState(false);
  const sectionRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia(MOBILE_MEDIA);

    const chooseSource = () => {
      if (motionQuery.matches) {
        setVideoSrc(null);
        return;
      }
      setVideoSrc(mobileQuery.matches ? VIDEO_MOBILE : VIDEO_DESKTOP);
    };

    chooseSource();
    motionQuery.addEventListener('change', chooseSource);
    mobileQuery.addEventListener('change', chooseSource);
    return () => {
      motionQuery.removeEventListener('change', chooseSource);
      mobileQuery.removeEventListener('change', chooseSource);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video || !videoSrc) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const play = video.play();
          if (play && typeof play.catch === 'function') play.catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [videoSrc, canPlay]);

  return (
    <div className="about-story-video" ref={sectionRef} aria-hidden={!alt}>
      <PosterPicture
        base={POSTER_BASE}
        alt={alt || ''}
        className="about-story-video-poster"
        sizes="100vw"
        loading="lazy"
      />
      {videoSrc && (
        <video
          ref={videoRef}
          className={`about-story-video-el${canPlay ? ' is-ready' : ''}`}
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER}
          onCanPlay={() => setCanPlay(true)}
          aria-hidden="true"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

export default AboutStoryVideo;

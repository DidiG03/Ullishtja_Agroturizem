import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import creatorVideoService from '../services/creatorVideoService';
import './CreatorVideos.css';

const formatHandle = (handle) => {
  if (!handle) return '';
  return handle.startsWith('@') ? handle : `@${handle}`;
};

const isVideoFullscreen = (el) => {
  if (!el) return false;
  return (
    document.fullscreenElement === el ||
    document.webkitFullscreenElement === el ||
    el.webkitDisplayingFullscreen === true
  );
};

function prefersLiteVideo() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return Boolean(
    connection?.saveData ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g'
  );
}

const formatClock = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
};

const VideoCard = ({ video, cardKey, isActive, onRequestPlay, onInteract }) => {
  const videoRef = useRef(null);
  const frameRef = useRef(null);
  const userPausedRef = useRef(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);
  const [rawTime, setRawTime] = useState(0);
  const [rawDuration, setRawDuration] = useState(0);
  const startAt = Number(video.startSeconds) > 0 ? Number(video.startSeconds) : 0;
  const mediaSrc = startAt > 0 ? `${video.videoUrl}#t=${startAt}` : video.videoUrl;
  const clipDuration = Math.max(0, rawDuration - startAt);
  const clipTime = Math.min(clipDuration, Math.max(0, rawTime - startAt));

  const snapToStart = (el) => {
    if (!el || startAt <= 0) return;
    if (el.currentTime < startAt - 0.08) {
      el.currentTime = startAt;
    }
  };

  const syncTime = (el) => {
    if (!el) return;
    snapToStart(el);
    setRawTime(el.currentTime || 0);
    if (Number.isFinite(el.duration) && el.duration > 0) {
      setRawDuration(el.duration);
    }
  };

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;

    if (!isActive) {
      el.pause();
      setPaused(true);
      return undefined;
    }

    const playIfAllowed = () => {
      if (isVideoFullscreen(el) || !userPausedRef.current) {
        snapToStart(el);
        el.play().catch(() => {});
      }
    };

    playIfAllowed();
    el.addEventListener('webkitbeginfullscreen', onInteract);
    el.addEventListener('webkitendfullscreen', playIfAllowed);
    document.addEventListener('fullscreenchange', playIfAllowed);

    return () => {
      el.pause();
      el.removeEventListener('webkitbeginfullscreen', onInteract);
      el.removeEventListener('webkitendfullscreen', playIfAllowed);
      document.removeEventListener('fullscreenchange', playIfAllowed);
    };
  }, [isActive, onInteract, startAt]);

  const handleVolumeChange = (event) => {
    const el = event.currentTarget;
    const isMuted = el.muted || el.volume === 0;
    setMuted(isMuted);
    if (!isMuted) {
      onInteract?.();
      document.querySelectorAll('.creator-video-media').forEach((other) => {
        if (other !== el) other.muted = true;
      });
    }
  };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    onInteract?.();
    if (el.paused) {
      userPausedRef.current = false;
      snapToStart(el);
      el.play().catch(() => {});
    } else {
      userPausedRef.current = true;
      el.pause();
    }
  };

  const seekClip = (virtualTime) => {
    const el = videoRef.current;
    if (!el) return;
    onInteract?.();
    el.currentTime = startAt + Math.min(clipDuration, Math.max(0, Number(virtualTime) || 0));
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    onInteract?.();
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  const toggleFullscreen = () => {
    const frame = frameRef.current;
    const el = videoRef.current;
    onInteract?.();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    if (frame?.requestFullscreen) {
      frame.requestFullscreen().catch(() => {
        el?.webkitEnterFullscreen?.();
      });
      return;
    }
    el?.webkitEnterFullscreen?.();
  };

  return (
    <article className={`creator-video-card${isActive ? ' is-active' : ''}`}>
      <div className="creator-video-frame" ref={frameRef}>
        {video.posterUrl ? (
          <img
            className="creator-video-poster"
            src={video.posterUrl}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : null}
        {isActive ? (
          <>
            <video
              ref={videoRef}
              className="creator-video-media"
              src={mediaSrc}
              poster={video.posterUrl || undefined}
              muted={muted}
              loop={startAt <= 0}
              playsInline
              preload="none"
              aria-label={`${video.creatorName} video`}
              {...{ 'webkit-playsinline': 'true' }}
              onLoadedMetadata={(event) => syncTime(event.currentTarget)}
              onDurationChange={(event) => syncTime(event.currentTarget)}
              onTimeUpdate={(event) => {
                const el = event.currentTarget;
                snapToStart(el);
                const duration = Number.isFinite(el.duration) ? el.duration : 0;
                if (startAt > 0 && duration > 0 && el.currentTime >= duration - 0.12) {
                  el.currentTime = startAt;
                }
                setRawTime(el.currentTime || 0);
                if (duration > 0) setRawDuration(duration);
              }}
              onEnded={(event) => {
                const el = event.currentTarget;
                el.currentTime = startAt;
                el.play().catch(() => {});
              }}
              onVolumeChange={handleVolumeChange}
              onPlay={(event) => {
                userPausedRef.current = false;
                setPaused(false);
                snapToStart(event.currentTarget);
                onInteract?.();
              }}
              onPause={() => {
                setPaused(true);
                if (isActive && !isVideoFullscreen(videoRef.current)) {
                  userPausedRef.current = true;
                }
              }}
            />
            <div className="creator-video-bar">
              <button type="button" className="creator-video-bar-btn" onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
                {paused ? '▶' : '❚❚'}
              </button>
              <span className="creator-video-bar-time">
                {formatClock(clipTime)} / {formatClock(clipDuration)}
              </span>
              <input
                className="creator-video-bar-seek"
                type="range"
                min={0}
                max={clipDuration || 0}
                step={0.1}
                value={clipTime}
                aria-label="Video progress"
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => seekClip(event.target.value)}
              />
              <button type="button" className="creator-video-bar-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted ? '🔇' : '🔊'}
              </button>
              <button type="button" className="creator-video-bar-btn" onClick={toggleFullscreen} aria-label="Full screen">
                ⛶
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="creator-video-play"
            aria-label={`Play ${video.creatorName}'s video`}
            onClick={() => {
              onInteract?.();
              onRequestPlay(cardKey);
            }}
          >
            <span className="creator-video-play-icon" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="creator-video-meta">
        <h3 className="creator-video-name">{video.creatorName}</h3>
        {video.handle ? <p className="creator-video-handle">{formatHandle(video.handle)}</p> : null}
        {video.caption ? <p className="creator-video-caption">{video.caption}</p> : null}
      </div>
    </article>
  );
};

function CreatorVideos({ translations }) {
  const [videos, setVideos] = useState([]);
  const [readyToFetch, setReadyToFetch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [liteMode, setLiteMode] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [sectionInView, setSectionInView] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const copy = translations?.creatorVideos;

  useEffect(() => {
    setLiteMode(prefersLiteVideo());
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    const pointerQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    const syncPointer = () => setCoarsePointer(pointerQuery.matches);
    syncPointer();
    if (pointerQuery.addEventListener) {
      pointerQuery.addEventListener('change', syncPointer);
    } else {
      pointerQuery.addListener(syncPointer);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (pointerQuery.removeEventListener) {
        pointerQuery.removeEventListener('change', syncPointer);
      } else {
        pointerQuery.removeListener(syncPointer);
      }
    };
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReadyToFetch(true);
          observer.disconnect();
        }
      },
      { rootMargin: '720px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!readyToFetch) return undefined;
    let cancelled = false;
    setLoading(true);
    creatorVideoService
      .list()
      .then((result) => {
        if (!cancelled) setVideos(result.data || []);
      })
      .catch((error) => {
        console.error('Error loading creator videos:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [readyToFetch]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || videos.length === 0) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setSectionInView(entry.isIntersecting),
      { threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [videos.length]);

  const useMarquee = shouldScroll && !coarsePointer;

  const displayVideos = useMemo(
    () => (useMarquee ? [...videos, ...videos] : videos),
    [videos, useMarquee]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || videos.length === 0) return undefined;

    const measure = () => {
      const cards = track.querySelectorAll('.creator-video-card');
      if (!cards.length) return;
      const style = window.getComputedStyle(track);
      const gap = Number.parseFloat(style.columnGap || style.gap) || 0;
      const padding =
        (Number.parseFloat(style.paddingLeft) || 0) +
        (Number.parseFloat(style.paddingRight) || 0);
      const uniqueCount = Math.min(videos.length, cards.length);
      let width = padding;
      for (let i = 0; i < uniqueCount; i += 1) {
        width += cards[i].offsetWidth;
        if (i < uniqueCount - 1) width += gap;
      }
      setShouldScroll(width > viewport.clientWidth + 8);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [videos]);

  useEffect(() => {
    if (liteMode || videos.length === 0 || pageHidden) {
      if (pageHidden) setActiveKey(null);
      return;
    }
    if (!useMarquee) {
      setActiveKey((current) => current || `${videos[0].id}-0`);
    }
  }, [liteMode, shouldScroll, useMarquee, videos, pageHidden]);

  const pauseCarousel = useCallback(() => setIsPaused(true), []);
  const scrollDuration = Math.max(videos.length * 8, 28);

  const playingKey =
    pageHidden || !sectionInView || (useMarquee && !isPaused) ? null : activeKey;

  return (
    <section
      ref={sectionRef}
      className={`creator-videos-section${videos.length ? '' : ' is-pending'}`}
      aria-labelledby="creator-videos-heading"
    >
      {loading || !copy || videos.length === 0 ? null : (
        <>
          <div className="container">
            <div className="creator-videos-header">
              <h2 id="creator-videos-heading">{copy.title}</h2>
              {copy.subtitle ? <p className="creator-videos-subtitle">{copy.subtitle}</p> : null}
            </div>
          </div>

          <div
            className={`creator-videos-carousel${useMarquee ? '' : ' is-static'}${shouldScroll && !useMarquee ? ' is-swipe' : ''}`}
            onMouseEnter={() => useMarquee && setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => useMarquee && setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            onTouchStart={() => useMarquee && setIsPaused(true)}
          >
            {useMarquee ? (
              <>
                <div className="creator-videos-fade creator-videos-fade-left" aria-hidden="true" />
                <div className="creator-videos-fade creator-videos-fade-right" aria-hidden="true" />
              </>
            ) : null}
            <div
              ref={viewportRef}
              className={`creator-videos-viewport${useMarquee ? '' : ' is-static'}${shouldScroll && !useMarquee ? ' is-swipe' : ''}`}
            >
              <div
                ref={trackRef}
                className={`creator-videos-track${useMarquee ? '' : ' is-static'}${isPaused ? ' paused' : ''}`}
                style={{ '--scroll-duration': `${scrollDuration}s` }}
              >
                {displayVideos.map((video, index) => {
                  const cardKey = `${video.id}-${index}`;
                  return (
                    <VideoCard
                      key={cardKey}
                      cardKey={cardKey}
                      video={video}
                      isActive={playingKey === cardKey}
                      onRequestPlay={setActiveKey}
                      onInteract={pauseCarousel}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default CreatorVideos;

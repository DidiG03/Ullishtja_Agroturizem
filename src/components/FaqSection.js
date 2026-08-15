import React, { useEffect, useRef, useState } from 'react';
import './FaqSection.css';

const MOBILE_MEDIA = '(max-width: 768px)';
const POSTER = '/images/Images_restorant/IMG_9622.png';
const VIDEO_DESKTOP = '/videos/faq/faq-bg.mp4';
const VIDEO_MOBILE = '/videos/faq/faq-bg-mobile.mp4';

function FaqSection({ t }) {
  const faq = t?.faq;
  const [openIndex, setOpenIndex] = useState(0);
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
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [videoSrc, canPlay]);

  if (!faq?.items?.length) return null;

  const toggle = (index) => {
    setOpenIndex((current) => (current === index ? -1 : index));
  };

  return (
    <section
      id="faq"
      className="faq-section"
      aria-labelledby="faq-heading"
      ref={sectionRef}
    >
      <div className="faq-section-bg" aria-hidden="true">
        <img
          className="faq-section-poster"
          src={POSTER}
          alt=""
          loading="lazy"
          decoding="async"
        />
        {videoSrc && (
          <video
            ref={videoRef}
            className={`faq-section-video${canPlay ? ' is-ready' : ''}`}
            muted
            loop
            playsInline
            preload="metadata"
            poster={POSTER}
            onCanPlay={() => setCanPlay(true)}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}
      </div>

      <div className="container">
        <div className="faq-card">
          <h2 id="faq-heading">{faq.title}</h2>
          <p className="faq-subtitle">{faq.subtitle}</p>

          <div className="faq-list">
            {faq.items.map((item, index) => {
              const isOpen = openIndex === index;
              const panelId = `faq-panel-${index}`;
              const buttonId = `faq-button-${index}`;

              return (
                <div key={item.q} className={`faq-item${isOpen ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    id={buttonId}
                    className="faq-question"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(index)}
                  >
                    <span>{item.q}</span>
                    <span className="faq-icon" aria-hidden="true">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="faq-answer"
                    hidden={!isOpen}
                  >
                    <p>{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FaqSection;

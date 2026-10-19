import React, { useState } from 'react';

const EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2995.456!2d19.4335694!3d41.3402778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDIwJzI1LjAiTiAxOcKwMjYnMDEuMCJF!5e0!3m2!1sen!2s!4v1699000000000!5m2!1sen!2s';

/**
 * The Google Maps embed pulls in ~450 KB of Maps JavaScript, and mobile browsers
 * start loading even a lazy iframe long before it is scrolled to. So the page
 * shows a static preview (public/images/map-preview.webp, built once from
 * OpenStreetMap tiles centred on the restaurant) and swaps in the live map only
 * when the visitor asks for it.
 */
function MapEmbed({ label, title }) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <iframe
        src={EMBED_URL}
        width="100%"
        height="340"
        style={{ border: 0 }}
        allowFullScreen=""
        referrerPolicy="no-referrer-when-downgrade"
        title={title}
      />
    );
  }

  return (
    <button type="button" className="map-preview" onClick={() => setActive(true)}>
      <img
        src="/images/map-preview.webp"
        alt=""
        className="map-preview-img"
        width="1200"
        height="500"
        loading="lazy"
        decoding="async"
      />
      <span className="map-preview-pin" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path
            d="M12 2C7.6 2 4 5.5 4 9.9 4 15.5 12 22 12 22s8-6.5 8-12.1C20 5.5 16.4 2 12 2z"
            fill="#a0522d"
            stroke="#fff"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="10" r="3" fill="#fff" />
        </svg>
      </span>
      <span className="map-preview-label">{label}</span>
      <span className="map-preview-credit">© OpenStreetMap contributors</span>
    </button>
  );
}

export default MapEmbed;

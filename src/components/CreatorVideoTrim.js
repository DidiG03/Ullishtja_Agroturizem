import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export function formatTimecode(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const CreatorVideoTrim = forwardRef(function CreatorVideoTrim({ file, startSeconds, onChange }, ref) {
  const videoRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      setDuration(0);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setDuration(0);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useImperativeHandle(ref, () => ({
    capturePoster: () =>
      new Promise((resolve, reject) => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          resolve(null);
          return;
        }

        const draw = () => {
          const width = Math.min(540, video.videoWidth || 540);
          const height = Math.round(
            width * ((video.videoHeight || 960) / (video.videoWidth || 540))
          );
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(video, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.72);
        };

        const target = Number(startSeconds) || 0;
        if (Math.abs(video.currentTime - target) < 0.12) {
          draw();
          return;
        }

        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          try {
            draw();
          } catch (error) {
            reject(error);
          }
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = target;
      }),
  }), [startSeconds]);

  const syncDuration = () => {
    const el = videoRef.current;
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    setDuration(el.duration);
  };

  const setStart = (value) => {
    const max = duration > 0.2 ? duration - 0.2 : 0;
    const next = Math.min(Math.max(0, Number(value) || 0), max);
    onChange(next);
    const el = videoRef.current;
    if (el) el.currentTime = next;
  };

  if (!file || !previewUrl) return null;

  return (
    <div className="cvm-trim">
      <video
        ref={videoRef}
        className="cvm-trim-preview"
        src={previewUrl}
        controls
        playsInline
        muted
        preload="metadata"
        {...{ 'webkit-playsinline': 'true' }}
        onLoadedMetadata={syncDuration}
        onDurationChange={syncDuration}
      />
      <div className="cvm-trim-controls">
        <label className="cvm-trim-field">
          <span>Start clip at {formatTimecode(startSeconds)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(startSeconds, duration || 0)}
            disabled={!duration}
            onChange={(event) => setStart(event.target.value)}
          />
          <span className="cvm-trim-hint">
            Drag to skip the intro. The homepage will play from this point
            {duration ? ` · ${formatTimecode(duration)} total` : ''}.
          </span>
        </label>
        <button
          type="button"
          className="cvm-trim-use"
          onClick={() => setStart(videoRef.current?.currentTime || 0)}
        >
          Use current playhead
        </button>
      </div>
    </div>
  );
});

export default CreatorVideoTrim;


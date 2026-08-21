import React, { useCallback, useEffect, useRef, useState } from 'react';
import creatorVideoService from '../services/creatorVideoService';
import CreatorVideoTrim, { blobToDataUrl } from './CreatorVideoTrim';
import './CreatorVideosManagement.css';

const emptyForm = {
  creatorName: '',
  handle: '',
  caption: '',
  displayOrder: 0,
  isActive: true,
};

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

function CreatorVideosManagement() {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const trimRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const result = await creatorVideoService.list(true);
      setVideos(result.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const resetForm = () => {
    setForm(emptyForm);
    setFile(null);
    setStartSeconds(0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.creatorName.trim()) {
      setError('Creator name is required.');
      return;
    }
    if (!file) {
      setError('Choose a video file from your laptop.');
      return;
    }

    setSaving(true);
    setProgress({ percent: 0, loaded: 0, total: file.size, stage: 'upload' });
    try {
      const uploaded = await creatorVideoService.uploadFile(file, (next) => {
        setProgress({ stage: 'upload', ...next });
      });
      let posterDataUrl = null;
      try {
        const posterBlob = await trimRef.current?.capturePoster();
        if (posterBlob) posterDataUrl = await blobToDataUrl(posterBlob);
      } catch {
        posterDataUrl = null;
      }
      setProgress((prev) => ({
        percent: 100,
        loaded: prev?.total || file.size,
        total: prev?.total || file.size,
        stage: 'save',
      }));
      await creatorVideoService.create({
        creatorName: form.creatorName.trim(),
        handle: form.handle.trim(),
        caption: form.caption.trim(),
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
        videoUrl: uploaded.url,
        startSeconds,
        posterDataUrl,
      });
      setSuccess('Video added to the homepage carousel.');
      resetForm();
      await loadVideos();
    } catch (err) {
      setError(err.message || 'Failed to upload video');
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  const handleToggle = async (video) => {
    try {
      await creatorVideoService.update(video.id, { isActive: !video.isActive });
      await loadVideos();
    } catch (err) {
      setError(err.message || 'Failed to update video');
    }
  };

  const handleDelete = async (video) => {
    if (!window.confirm(`Remove ${video.creatorName}'s video from the site?`)) return;
    try {
      await creatorVideoService.remove(video.id);
      await loadVideos();
    } catch (err) {
      setError(err.message || 'Failed to delete video');
    }
  };

  return (
    <div className="cvm">
      <header className="cvm-header">
        <div>
          <h2>Creator videos</h2>
          <p>Upload clips from your laptop. They appear in a carousel on the homepage, like Google reviews.</p>
        </div>
      </header>

      {error ? <div className="cvm-banner cvm-banner--error">{error}</div> : null}
      {success ? <div className="cvm-banner cvm-banner--success">{success}</div> : null}

      <form className="cvm-form" onSubmit={handleSubmit}>
        <label className="cvm-field">
          <span>Video file (MP4, MOV, or WebM, up to 1 GB)</span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setStartSeconds(0);
            }}
          />
        </label>
        {file ? (
          <div className="cvm-field cvm-field--wide">
            <span>Where should the clip start?</span>
            <CreatorVideoTrim
              ref={trimRef}
              file={file}
              startSeconds={startSeconds}
              onChange={setStartSeconds}
            />
          </div>
        ) : null}
        <label className="cvm-field">
          <span>Creator name</span>
          <input
            type="text"
            value={form.creatorName}
            onChange={(event) => setForm((prev) => ({ ...prev, creatorName: event.target.value }))}
            placeholder="e.g. Ana Kola"
            required
          />
        </label>
        <label className="cvm-field">
          <span>Handle (optional)</span>
          <input
            type="text"
            value={form.handle}
            onChange={(event) => setForm((prev) => ({ ...prev, handle: event.target.value }))}
            placeholder="@creator"
          />
        </label>
        <label className="cvm-field cvm-field--wide">
          <span>Caption (optional)</span>
          <input
            type="text"
            value={form.caption}
            onChange={(event) => setForm((prev) => ({ ...prev, caption: event.target.value }))}
            placeholder="Short line shown under the video"
          />
        </label>
        <button type="submit" className="cvm-submit" disabled={saving}>
          {saving
            ? progress?.stage === 'save'
              ? 'Saving…'
              : progress?.stage === 'processing'
                ? 'Processing…'
                : 'Uploading…'
            : 'Add video'}
        </button>
        {saving && progress ? (
          <div className="cvm-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}>
            <div className="cvm-progress-track">
              <div
                className={`cvm-progress-fill${progress.indeterminate || progress.stage === 'processing' ? ' is-indeterminate' : ''}`}
                style={{ width: `${Math.max(progress.percent, progress.indeterminate ? 30 : 0)}%` }}
              />
            </div>
            <p className="cvm-progress-label">
              {progress.stage === 'save'
                ? 'Saving video details…'
                : progress.stage === 'processing'
                  ? 'File received. Saving on the server…'
                  : `${progress.percent}% · ${formatBytes(progress.loaded)} of ${formatBytes(progress.total)}`}
            </p>
          </div>
        ) : null}
      </form>

      {loading ? (
        <p className="cvm-empty">Loading videos…</p>
      ) : videos.length === 0 ? (
        <p className="cvm-empty">No creator videos yet. Upload the first clip above.</p>
      ) : (
        <ul className="cvm-list">
          {videos.map((video) => (
            <li key={video.id} className={`cvm-item${video.isActive ? '' : ' is-hidden'}`}>
              <video
                className="cvm-thumb"
                src={video.videoUrl}
                muted
                playsInline
                preload="metadata"
                onLoadedMetadata={(event) => {
                  const start = Number(video.startSeconds) || 0;
                  if (start > 0) event.currentTarget.currentTime = start;
                }}
              />
              <div className="cvm-item-info">
                <strong>{video.creatorName}</strong>
                {video.handle ? <span>{video.handle}</span> : null}
                <span className="cvm-status">{video.isActive ? 'Visible on site' : 'Hidden'}</span>
              </div>
              <div className="cvm-item-actions">
                <button type="button" onClick={() => handleToggle(video)}>
                  {video.isActive ? 'Hide' : 'Show'}
                </button>
                <button type="button" className="is-danger" onClick={() => handleDelete(video)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CreatorVideosManagement;

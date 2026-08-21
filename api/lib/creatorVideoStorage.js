import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

const ALLOWED_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;
export const LOCAL_VIDEO_DIR = path.join(process.cwd(), 'uploads', 'creator-videos');

export function isAllowedVideoType(mime, filename = '') {
  if (mime && ALLOWED_TYPES.has(mime)) return true;
  return /\.(mp4|webm|mov)$/i.test(filename);
}

function extensionFor(mime, originalName = '') {
  const fromName = path.extname(originalName).toLowerCase();
  if (['.mp4', '.webm', '.mov'].includes(fromName)) return fromName;
  if (mime === 'video/webm') return '.webm';
  if (mime === 'video/quicktime') return '.mov';
  return '.mp4';
}

function makeFilename(mime, originalName) {
  return `creator-${Date.now()}-${randomBytes(4).toString('hex')}${extensionFor(mime, originalName)}`;
}

export async function storeCreatorVideoFromPath(tempPath, { mime, originalName, size } = {}) {
  if (size > MAX_VIDEO_BYTES) {
    throw new Error('Video is too large. Maximum size is 1 GB.');
  }

  const filename = makeFilename(mime, originalName);
  const useBlob =
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) && process.env.NODE_ENV === 'production';

  if (useBlob) {
    const buffer = await fs.promises.readFile(tempPath);
    const { put } = await import('@vercel/blob');
    const blob = await put(`creators/${filename}`, buffer, {
      access: 'public',
      contentType: mime || 'video/mp4',
    });
    return { url: blob.url, filename, size: buffer.length };
  }

  if (process.env.NODE_ENV !== 'production') {
    await fs.promises.mkdir(LOCAL_VIDEO_DIR, { recursive: true });
    await fs.promises.copyFile(tempPath, path.join(LOCAL_VIDEO_DIR, filename));
    return { url: `/videos/creators/${filename}`, filename, size: size || 0 };
  }

  throw new Error(
    'Video storage is not configured. Connect Vercel Blob to this project to upload creator videos.'
  );
}

export async function storeCreatorPosterFromDataUrl(dataUrl) {
  const match = /^data:(image\/jpeg|image\/webp|image\/png);base64,([A-Za-z0-9+/=]+)$/i.exec(
    String(dataUrl || '')
  );
  if (!match) {
    throw new Error('Invalid poster image');
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 500_000) {
    throw new Error('Poster image is too large');
  }

  const ext = match[1].includes('png') ? '.png' : match[1].includes('webp') ? '.webp' : '.jpg';
  const filename = `creator-poster-${Date.now()}-${randomBytes(4).toString('hex')}${ext}`;
  const useBlob =
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) && process.env.NODE_ENV === 'production';

  if (useBlob) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`creators/${filename}`, buffer, {
      access: 'public',
      contentType: match[1],
    });
    return { url: blob.url, filename };
  }

  if (process.env.NODE_ENV !== 'production') {
    await fs.promises.mkdir(LOCAL_VIDEO_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(LOCAL_VIDEO_DIR, filename), buffer);
    return { url: `/videos/creators/${filename}`, filename };
  }

  throw new Error(
    'Video storage is not configured. Connect Vercel Blob to this project to upload creator videos.'
  );
}

export async function deleteCreatorVideoFile(url) {
  if (!url) return;

  if (/blob\.vercel-storage\.com/i.test(url) && process.env.BLOB_READ_WRITE_TOKEN) {
    const { del } = await import('@vercel/blob');
    await del(url);
    return;
  }

  if (!url.startsWith('/videos/creators/')) return;
  const filename = path.basename(url);
  if (!filename) return;
  try {
    await fs.promises.unlink(path.join(LOCAL_VIDEO_DIR, filename));
  } catch {
    /* already gone */
  }
}


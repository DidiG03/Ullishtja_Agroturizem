import fs from 'fs';
import formidable from 'formidable';
import prisma, { withPrismaRetry } from '../src/lib/prisma.js';
import {
  storeCreatorVideoFromPath,
  storeCreatorPosterFromDataUrl,
  deleteCreatorVideoFile,
  isAllowedVideoType,
  MAX_VIDEO_BYTES,
} from './lib/creatorVideoStorage.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function parseJsonBody(req, raw) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (!raw || !raw.length) return {};
  return JSON.parse(raw.toString('utf8'));
}

async function getJsonBody(req) {
  if (
    req.body &&
    typeof req.body === 'object' &&
    !Buffer.isBuffer(req.body) &&
    Object.keys(req.body).length
  ) {
    return req.body;
  }
  const raw = await readRawBody(req);
  return parseJsonBody(req, raw);
}

function parseStartSeconds(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100) / 100;
}

function publicSelect() {
  return {
    id: true,
    creatorName: true,
    handle: true,
    caption: true,
    videoUrl: true,
    posterUrl: true,
    startSeconds: true,
    displayOrder: true,
    isActive: true,
    createdAt: true,
  };
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const contentType = req.headers['content-type'] || '';
  const { id, all, resource } = req.query || {};

  try {
    if (req.method === 'POST' && (resource === 'blob' || resource === 'upload-token')) {
      const body = await getJsonBody(req);
      const { handleUpload } = await import('@vercel/blob/client');
      const json = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
        }),
        onUploadCompleted: async () => {},
      });
      return res.status(200).json(json);
    }

    if (req.method === 'POST' && (resource === 'upload' || contentType.includes('multipart/form-data'))) {
      req.setTimeout(15 * 60 * 1000);
      res.setTimeout(15 * 60 * 1000);
      const form = formidable({
        maxFileSize: MAX_VIDEO_BYTES,
        maxTotalFileSize: MAX_VIDEO_BYTES,
        keepExtensions: true,
        filter: ({ mimetype, originalFilename }) =>
          isAllowedVideoType(mimetype, originalFilename),
      });
      const [, files] = await form.parse(req);
      const uploaded = files.video?.[0] || files.file?.[0];
      if (!uploaded) {
        return res.status(400).json({ success: false, error: 'No video file provided' });
      }
      if (!isAllowedVideoType(uploaded.mimetype, uploaded.originalFilename)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Use MP4, WebM, or MOV.',
        });
      }
      console.log(
        `[creator-videos] received ${uploaded.originalFilename} (${uploaded.size} bytes), saving…`
      );
      const stored = await storeCreatorVideoFromPath(uploaded.filepath, {
        mime: uploaded.mimetype,
        originalName: uploaded.originalFilename,
        size: uploaded.size,
      });
      console.log(`[creator-videos] saved ${stored.filename}`);
      try {
        await fs.promises.unlink(uploaded.filepath);
      } catch {
        /* ignore */
      }
      return res.status(200).json({ success: true, data: stored });
    }

    if (req.method === 'GET') {
      const includeHidden = String(all) === '1' || String(all) === 'true';
      const videos = await withPrismaRetry(() =>
        prisma.creatorVideo.findMany({
          where: includeHidden ? {} : { isActive: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
          select: publicSelect(),
        })
      );
      return res.status(200).json({ success: true, data: videos });
    }

    const body = await getJsonBody(req);

    if (req.method === 'POST') {
      const creatorName = String(body.creatorName || '').trim();
      const videoUrl = String(body.videoUrl || '').trim();
      if (!creatorName || !videoUrl) {
        return res.status(400).json({
          success: false,
          error: 'creatorName and videoUrl are required',
        });
      }
      let posterUrl = body.posterUrl ? String(body.posterUrl).trim() : null;
      if (body.posterDataUrl) {
        const poster = await storeCreatorPosterFromDataUrl(body.posterDataUrl);
        posterUrl = poster.url;
      }
      const created = await withPrismaRetry(() =>
        prisma.creatorVideo.create({
          data: {
            creatorName,
            handle: body.handle ? String(body.handle).trim() : null,
            caption: body.caption ? String(body.caption).trim() : null,
            videoUrl,
            posterUrl,
            startSeconds: parseStartSeconds(body.startSeconds),
            displayOrder: Number.isFinite(Number(body.displayOrder)) ? Number(body.displayOrder) : 0,
            isActive: body.isActive !== false,
          },
          select: publicSelect(),
        })
      );
      return res.status(201).json({ success: true, data: created });
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ success: false, error: 'id is required' });
      const updateData = {};
      if (body.creatorName !== undefined) updateData.creatorName = String(body.creatorName).trim();
      if (body.handle !== undefined) updateData.handle = body.handle ? String(body.handle).trim() : null;
      if (body.caption !== undefined) updateData.caption = body.caption ? String(body.caption).trim() : null;
      if (body.videoUrl !== undefined) updateData.videoUrl = String(body.videoUrl).trim();
      if (body.posterUrl !== undefined) updateData.posterUrl = body.posterUrl ? String(body.posterUrl).trim() : null;
      if (body.startSeconds !== undefined) updateData.startSeconds = parseStartSeconds(body.startSeconds);
      if (body.displayOrder !== undefined) updateData.displayOrder = Number(body.displayOrder) || 0;
      if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
      const updated = await withPrismaRetry(() =>
        prisma.creatorVideo.update({
          where: { id },
          data: updateData,
          select: publicSelect(),
        })
      );
      return res.status(200).json({ success: true, data: updated });
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ success: false, error: 'id is required' });
      const existing = await withPrismaRetry(() =>
        prisma.creatorVideo.findUnique({ where: { id } })
      );
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Video not found' });
      }
      await withPrismaRetry(() => prisma.creatorVideo.delete({ where: { id } }));
      await deleteCreatorVideoFile(existing.videoUrl);
      await deleteCreatorVideoFile(existing.posterUrl);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Creator videos API error:', error);
    if (error?.code === 'P2024' || /connection pool/i.test(error?.message || '')) {
      return res.status(503).json({
        success: false,
        error: 'The database is waking up or busy. Wait a few seconds and refresh the page.',
      });
    }
    if (error?.code === 'P2021' || /does not exist/i.test(error?.message || '')) {
      return res.status(503).json({
        success: false,
        error: 'The creator videos table is missing. Run npx prisma migrate deploy and try again.',
      });
    }
    const message = error.message || 'Failed to process creator videos request';
    const status = message.includes('not configured') ? 503 : 500;
    return res.status(status).json({ success: false, error: message });
  }
}

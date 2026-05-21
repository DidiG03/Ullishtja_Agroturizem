// Blog image upload — multipart file or JSON { dataUrl }
import formidable from 'formidable';
import fs from 'fs';
import { storeBlogImage, parseDataUrl } from '../lib/blogImageStorage.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'] || '';
    let buffer;

    if (contentType.includes('application/json')) {
      const raw = await readRawBody(req);
      const body = JSON.parse(raw.toString('utf8'));
      const parsed = parseDataUrl(body.dataUrl);
      if (!parsed) {
        return res.status(400).json({ success: false, error: 'Invalid dataUrl' });
      }
      if (parsed.buffer.length > 6 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Image is too large. Use a smaller file or paste a hosted Image URL.',
        });
      }
      buffer = parsed.buffer;
    } else {
      const form = formidable({
        maxFileSize: 6 * 1024 * 1024,
        keepExtensions: true,
        filter: ({ mimetype }) => mimetype && mimetype.includes('image'),
      });

      const [, files] = await form.parse(req);
      const uploadedFile = files.image?.[0];
      if (!uploadedFile) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(uploadedFile.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
        });
      }

      buffer = await fs.promises.readFile(uploadedFile.filepath);
      try {
        await fs.promises.unlink(uploadedFile.filepath);
      } catch {
        /* ignore temp cleanup */
      }
    }

    const { url, filename, size } = await storeBlogImage(buffer);

    return res.status(200).json({
      success: true,
      data: {
        filename,
        url,
        size,
      },
    });
  } catch (error) {
    console.error('Blog upload API error:', error);
    const message = error.message || 'Failed to upload image';
    const status = message.includes('not configured') ? 503 : 500;
    return res.status(status).json({ success: false, error: message });
  }
}

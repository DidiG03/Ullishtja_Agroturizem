import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Compress and store a blog image. Uses Vercel Blob in production when configured,
 * otherwise writes to public/images/blog for local development.
 */
export async function storeBlogImage(inputBuffer) {
  const compressed = await sharp(inputBuffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const filename = `blog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`blog/${filename}`, compressed, {
      access: 'public',
      contentType: 'image/jpeg',
    });
    return { url: blob.url, filename, size: compressed.length };
  }

  if (process.env.NODE_ENV !== 'production') {
    const publicDir = path.join(process.cwd(), 'public', 'images', 'blog');
    await fs.promises.mkdir(publicDir, { recursive: true });
    await fs.promises.writeFile(path.join(publicDir, filename), compressed);
    return { url: `/images/blog/${filename}`, filename, size: compressed.length };
  }

  throw new Error(
    'Blog image storage is not configured. Connect Vercel Blob to this project, or use “Image URL” with a hosted link (e.g. https://ucarecdn.com/…).'
  );
}

export function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/[\w+.-]+);base64,(.+)$/s);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
}

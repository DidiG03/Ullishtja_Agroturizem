// Copy every file from Vercel Blob to Cloudflare R2, then point the database at the new URLs.
//
// Setup (run once, inside the Ullishtja_Agroturizem repo):
//   npm i -D @aws-sdk/client-s3 dotenv
//   put this file in scripts/migrate-blob-to-r2.mjs
//   create .env.migrate (and add it to .gitignore):
//     BLOB_READ_WRITE_TOKEN=...
//     R2_ACCESS_KEY_ID=...
//     R2_SECRET_ACCESS_KEY=...
//     R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
//     R2_BUCKET=ullishtja-media
//     MEDIA_BASE_URL=https://media.ullishtja-agroturizem.com
//     DATABASE_URL=<the current Neon connection string>
//
// Run:
//   node scripts/migrate-blob-to-r2.mjs            -> copy files only (safe, repeatable)
//   node scripts/migrate-blob-to-r2.mjs --rewrite  -> copy, then update URLs in the database

import dotenv from 'dotenv';
dotenv.config({ path: '.env.migrate' });

import { list } from '@vercel/blob';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

const need = ['BLOB_READ_WRITE_TOKEN', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT', 'R2_BUCKET', 'MEDIA_BASE_URL'];
for (const k of need) if (!process.env[k]) { console.error(`Missing ${k} in .env.migrate`); process.exit(1); }

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const BUCKET = process.env.R2_BUCKET;
const MEDIA = process.env.MEDIA_BASE_URL.replace(/\/$/, '');

async function existsInR2(key, size) {
  try {
    const h = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return Number(h.ContentLength) === Number(size);
  } catch { return false; }
}

// 1. List everything in Vercel Blob
const blobs = [];
let cursor;
do {
  const page = await list({ cursor, limit: 1000, token: process.env.BLOB_READ_WRITE_TOKEN });
  blobs.push(...page.blobs);
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

const totalMb = blobs.reduce((s, b) => s + b.size, 0) / 1e6;
console.log(`Found ${blobs.length} files (${totalMb.toFixed(1)} MB) in Vercel Blob`);

// 2. Copy each file (same path) into R2
const hosts = new Set();
let copied = 0, skipped = 0, failed = 0;
for (const b of blobs) {
  hosts.add(new URL(b.url).origin);
  const key = b.pathname;
  if (await existsInR2(key, b.size)) { skipped++; continue; }
  try {
    const res = await fetch(b.downloadUrl || b.url, {
      headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) throw new Error(`download ${res.status}`);
    const body = Buffer.from(await res.arrayBuffer());
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: res.headers.get('content-type') || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    copied++;
    console.log(`  ✓ ${key} (${(b.size / 1e6).toFixed(1)} MB)`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${key}: ${e.message}`);
  }
}
console.log(`\nCopied ${copied}, already there ${skipped}, failed ${failed}`);
console.log(`Blob host(s): ${[...hosts].join(', ')}`);

if (failed) { console.error('Some files failed. Fix and re-run before using --rewrite.'); process.exit(1); }
if (!process.argv.includes('--rewrite')) {
  console.log(`\nCheck a file loads, e.g. ${MEDIA}/${blobs[0]?.pathname || ''}`);
  console.log('Then run again with --rewrite to update the database.');
  process.exit(0);
}

// 3. Rewrite stored URLs in the database (Blob host -> media domain)
if (!process.env.DATABASE_URL) { console.error('Missing DATABASE_URL in .env.migrate'); process.exit(1); }
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const columns = [
  ['gallery_images', 'imageUrl'],
  ['events', 'imageUrl'],
  ['menu_items', 'imageUrl'],
  ['blog_images', 'imageUrl'],
  ['creator_videos', 'videoUrl'],
  ['creator_videos', 'posterUrl'],
  ['blog_posts', 'featuredImageUrl'],
  ['blog_posts', 'contentAL'],
  ['blog_posts', 'contentEN'],
  ['blog_posts', 'contentIT'],
];

for (const host of hosts) {
  for (const [table, col] of columns) {
    const n = await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "${col}" = REPLACE("${col}", $1, $2) WHERE "${col}" LIKE '%' || $1 || '%'`,
      host, MEDIA,
    );
    if (n) console.log(`  ${table}.${col}: ${n} row(s) updated`);
  }
}
await prisma.$disconnect();
console.log('\nDatabase now points to', MEDIA);

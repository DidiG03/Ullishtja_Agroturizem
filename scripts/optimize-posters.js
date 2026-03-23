/**
 * Generate responsive WebP (and compressed JPEG fallbacks) for landing-page posters.
 * Run: npm run optimize-posters
 * Safe to run on every build — skips missing inputs.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const POSTERS_DIR = path.join(__dirname, '../public/images/posters');

const jobs = [
  {
    input: 'alacarte-poster.jpg',
    base: 'alacarte-poster',
    widths: [640, 960, 1280],
    jpegMax: 1280,
  },
  {
    input: 'events-poster.jpg',
    base: 'events-poster',
    widths: [640, 960, 1280],
    jpegMax: 1280,
  },
  {
    input: 'hero-poster.jpg',
    base: 'hero-poster',
    widths: [800, 1200, 1600],
    jpegMax: 1400,
  },
  {
    input: 'hero-poster-mobile.png',
    base: 'hero-poster-mobile',
    widths: [600, 900, 1200],
    jpegMax: null, // keep PNG-derived webp only for mobile hero bg
  },
];

async function processJob(job) {
  const inputPath = path.join(POSTERS_DIR, job.input);
  if (!fs.existsSync(inputPath)) {
    console.warn(`[optimize-posters] skip (missing): ${job.input}`);
    return;
  }

  for (const w of job.widths) {
    const outWebp = path.join(POSTERS_DIR, `${job.base}-${w}.webp`);
    await sharp(inputPath)
      .resize(w, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toFile(outWebp);
    console.log(`[optimize-posters] ${path.basename(outWebp)}`);
  }

  if (job.jpegMax) {
    const outJpg = path.join(POSTERS_DIR, `${job.base}-${job.jpegMax}.jpg`);
    await sharp(inputPath)
      .resize(job.jpegMax, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(outJpg);
    console.log(`[optimize-posters] ${path.basename(outJpg)} (jpeg fallback)`);
  }
}

async function main() {
  if (!fs.existsSync(POSTERS_DIR)) {
    console.error('[optimize-posters] directory missing:', POSTERS_DIR);
    process.exit(0);
  }
  for (const job of jobs) {
    await processJob(job);
  }
  console.log('[optimize-posters] done.');
}

main().catch((err) => {
  console.error('[optimize-posters]', err);
  process.exit(1);
});

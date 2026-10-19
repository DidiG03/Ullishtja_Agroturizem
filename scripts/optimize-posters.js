/**
 * Generate responsive WebP (and compressed JPEG fallbacks) for landing-page posters.
 * Run: npm run optimize-posters
 * Safe to run on every build — skips missing inputs.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Originals live outside public/ so they are not deployed; outputs go to public/.
const SOURCE_DIR = path.join(__dirname, '../assets-src/posters');
const RESTAURANT_DIR = path.join(__dirname, '../assets-src/restaurant');
const POSTERS_DIR = path.join(__dirname, '../public/images/posters');

const jobs = [
  {
    input: 'alacarte-poster.jpg',
    base: 'alacarte-poster',
    widths: [640, 960, 1280],
    jpegMax: 1280,
    webpQuality: 70,
    avifQuality: 45,
  },
  {
    input: 'events-poster.jpg',
    base: 'events-poster',
    widths: [640, 960, 1280],
    jpegMax: 1280,
    webpQuality: 70,
    avifQuality: 45,
  },
  {
    input: 'hero-poster.jpg',
    base: 'hero-poster',
    widths: [800, 1200, 1600],
    jpegMax: 1400,
    // Painted as a CSS background under a dark gradient and preloaded as WebP in
    // index.html, so it stays WebP-only with a lower quality target.
    webpQuality: 70,
  },
  {
    input: 'hero-poster-mobile.png',
    base: 'hero-poster-mobile',
    widths: [600, 900, 1200],
    jpegMax: null, // keep PNG-derived webp only for mobile hero bg
    webpQuality: 70,
  },
  // Decorative full-bleed backdrops behind the story and FAQ sections. The
  // originals are camera exports (a 1.6MB PNG and a 496KB JPEG) that were being
  // served as-is at every viewport size.
  // Both sit under a dark gradient and are replaced by a video once it can play,
  // so they carry a lower quality target than the hero and section posters.
  {
    inputDir: RESTAURANT_DIR,
    input: 'IMG_9624.jpg',
    base: 'story-poster',
    widths: [640, 960, 1280],
    jpegMax: 1280,
    webpQuality: 62,
    avifQuality: 40,
    jpegQuality: 70,
  },
  {
    inputDir: RESTAURANT_DIR,
    input: 'IMG_9622.png',
    base: 'faq-poster',
    widths: [640, 960, 1280],
    jpegMax: 1280,
    webpQuality: 62,
    avifQuality: 40,
    jpegQuality: 70,
  },
];

// Open Graph / Twitter share image. Social cards are 1.91:1, and every poster is
// portrait, so this crops the band of the hero photo around the entrance sign.
const shareImage = {
  input: 'hero-poster.jpg',
  output: path.join(__dirname, '../public/images/og-image.jpg'),
  extract: { left: 0, top: 1800, width: 2160, height: 1134 },
};

async function processShareImage() {
  const inputPath = path.join(SOURCE_DIR, shareImage.input);
  if (!fs.existsSync(inputPath)) {
    console.warn(`[optimize-posters] skip (missing): ${shareImage.input}`);
    return;
  }
  await sharp(inputPath)
    .extract(shareImage.extract)
    .resize(1200, 630)
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(shareImage.output);
  console.log(`[optimize-posters] ${path.basename(shareImage.output)} (share image)`);
}

// The logo shows at 50–92 CSS px wide, but the only file was a 254px JPEG.
const logo = {
  input: path.join(__dirname, '../public/images/ullishtja_logo.jpeg'),
  widths: [140, 254],
};

async function processLogo() {
  if (!fs.existsSync(logo.input)) return;
  for (const w of logo.widths) {
    const out = path.join(path.dirname(logo.input), `ullishtja-logo-${w}.webp`);
    await sharp(logo.input).resize(w).webp({ quality: 85 }).toFile(out);
    console.log(`[optimize-posters] ${path.basename(out)} (logo)`);
  }
}

async function processJob(job) {
  const inputPath = path.join(job.inputDir || SOURCE_DIR, job.input);
  if (!fs.existsSync(inputPath)) {
    console.warn(`[optimize-posters] skip (missing): ${job.input}`);
    return;
  }

  for (const w of job.widths) {
    const outWebp = path.join(POSTERS_DIR, `${job.base}-${w}.webp`);
    await sharp(inputPath)
      .resize(w, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: job.webpQuality ?? 80, effort: 6 })
      .toFile(outWebp);
    console.log(`[optimize-posters] ${path.basename(outWebp)}`);

    // AVIF is ~40% smaller than WebP at the same visual quality on these photos;
    // PosterPicture lists it first and browsers without AVIF fall back to WebP.
    if (job.avifQuality) {
      const outAvif = path.join(POSTERS_DIR, `${job.base}-${w}.avif`);
      await sharp(inputPath)
        .resize(w, null, { fit: 'inside', withoutEnlargement: true })
        .avif({ quality: job.avifQuality, effort: 4 })
        .toFile(outAvif);
      console.log(`[optimize-posters] ${path.basename(outAvif)}`);
    }
  }

  if (job.jpegMax) {
    const outJpg = path.join(POSTERS_DIR, `${job.base}-${job.jpegMax}.jpg`);
    await sharp(inputPath)
      .resize(job.jpegMax, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: job.jpegQuality ?? 82, mozjpeg: true })
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
  await processShareImage();
  await processLogo();
  console.log('[optimize-posters] done.');
}

main().catch((err) => {
  console.error('[optimize-posters]', err);
  process.exit(1);
});

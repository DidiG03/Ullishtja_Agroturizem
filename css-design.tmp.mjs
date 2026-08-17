import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (p.endsWith('.css')) out.push(p);
  }
  return out;
}

// Only files that actually ship (Gallery.css is orphaned)
const files = walk(path.join(ROOT, 'src')).filter((f) => !f.endsWith('Gallery.css'));

const tally = (map, key, file) => {
  if (!map.has(key)) map.set(key, new Map());
  const m = map.get(key);
  m.set(file, (m.get(file) || 0) + 1);
};

const radii = new Map();
const shadows = new Map();
const colors = new Map();
const fontFamilies = new Map();
const fontSizes = new Map();
const transitions = new Map();
const zIndex = new Map();

// token values from :root
const tokens = new Map();
for (const f of files) {
  const css = fs.readFileSync(f, 'utf8');
  for (const m of css.matchAll(/--([a-z-]+):\s*([^;]+);/g)) {
    if (!tokens.has(m[1])) tokens.set(m[1], m[2].trim().split('/*')[0].trim());
  }
}

for (const f of files) {
  const rel = path.relative(ROOT, f);
  const css = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/border-radius:\s*([^;]+);/g)) tally(radii, m[1].trim(), rel);
  for (const m of css.matchAll(/box-shadow:\s*([^;]+);/g)) tally(shadows, m[1].trim(), rel);
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) tally(colors, m[0].toLowerCase(), rel);
  for (const m of css.matchAll(/font-family:\s*([^;]+);/g)) tally(fontFamilies, m[1].trim(), rel);
  for (const m of css.matchAll(/font-size:\s*([^;]+);/g)) tally(fontSizes, m[1].trim(), rel);
  for (const m of css.matchAll(/transition:\s*([^;]+);/g)) tally(transitions, m[1].trim(), rel);
  for (const m of css.matchAll(/z-index:\s*([^;]+);/g)) tally(zIndex, m[1].trim(), rel);
}

function report(title, map, { limit = 60, sortByCount = true } = {}) {
  const rows = [...map.entries()].map(([k, files]) => ({
    k,
    n: [...files.values()].reduce((a, b) => a + b, 0),
    files: [...files.keys()].map((f) => f.replace('src/components/', '').replace('src/', '')),
  }));
  rows.sort(sortByCount ? (a, b) => b.n - a.n : (a, b) => a.k.localeCompare(b.k));
  console.log(`\n===== ${title} (${rows.length} distinct) =====`);
  for (const r of rows.slice(0, limit)) {
    console.log(`  ${String(r.n).padStart(3)}x  ${r.k}`);
    if (r.n <= 2) console.log(`         ${r.files.join(', ')}`);
  }
}

console.log('===== DESIGN TOKENS (:root) =====');
for (const [k, v] of tokens) console.log(`  --${k}: ${v}`);

report('BORDER RADIUS VALUES', radii, { sortByCount: false });
report('FONT FAMILIES', fontFamilies);
report('BOX SHADOWS', shadows, { limit: 100 });
report('FONT SIZES', fontSizes, { sortByCount: false, limit: 200 });
report('TRANSITIONS', transitions, { limit: 40 });
report('Z-INDEX', zIndex, { sortByCount: false });

// hardcoded hexes that duplicate a token value
const tokenHex = new Map();
for (const [k, v] of tokens) {
  const m = v.match(/^#[0-9a-fA-F]{3,8}$/);
  if (m) tokenHex.set(v.toLowerCase(), k);
}
console.log('\n===== HARDCODED HEX THAT MATCHES A TOKEN =====');
let found = false;
for (const [hex, files] of colors) {
  if (tokenHex.has(hex)) {
    found = true;
    const n = [...files.values()].reduce((a, b) => a + b, 0);
    console.log(`  ${hex} == var(--${tokenHex.get(hex)})  ${n}x in ${[...files.keys()].map((f) => f.replace('src/components/', '')).join(', ')}`);
  }
}
if (!found) console.log('  none');

report('ALL HEX COLORS', colors, { limit: 120 });

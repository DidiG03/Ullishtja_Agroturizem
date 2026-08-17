// Temporary helper: deletes verified dead line ranges from a CSS file (deleted after cleanup).
import fs from 'fs';

const [, , file, mode] = process.argv;
const RANGES = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));

const lines = fs.readFileSync(file, 'utf8').split('\n');

if (mode === 'dry') {
  for (const [a, b] of RANGES) {
    console.log(`--- ${a}-${b} ---`);
    console.log(
      lines
        .slice(a - 1, b)
        .map((l, i) => `${a + i}| ${l}`)
        .join('\n')
    );
  }
  process.exit(0);
}

const sorted = [...RANGES].sort((x, y) => y[0] - x[0]);
let out = lines.slice();
for (const [a, b] of sorted) out.splice(a - 1, b - a + 1);
let text = out.join('\n').replace(/\n{3,}/g, '\n\n');
fs.writeFileSync(file, text);
console.log(`${file}: ${lines.length} -> ${text.split('\n').length} lines`);

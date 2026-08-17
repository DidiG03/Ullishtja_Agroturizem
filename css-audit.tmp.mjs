// Temporary read-only CSS audit helper (deleted once the cleanup is done).
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const all = walk(SRC);
const cssFiles = all.filter((f) => /\.css$/.test(f));
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

// reachable modules from src/index.js
function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  const cands = [base, base + '.js', base + '.jsx', base + '.css', path.join(base, 'index.js')];
  return cands.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}
const resolved = new Set();
const queue = [path.join(SRC, 'index.js')];
while (queue.length) {
  const f = queue.pop();
  if (!f || resolved.has(f)) continue;
  resolved.add(f);
  if (!/\.jsx?$/.test(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  for (const m of [
    ...src.matchAll(/from\s+['"]([^'"]+)['"]/g),
    ...src.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
    ...src.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm),
  ]) {
    const r = resolveImport(f, m[1]);
    if (r) queue.push(r);
  }
}

const usedTokens = new Set();
const usageFiles = [...resolved].filter((f) => /\.jsx?$/.test(f)).concat([path.join(ROOT, 'public/index.html')]);
for (const f of usageFiles) {
  if (!fs.existsSync(f)) continue;
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/[\w-]{2,}/g)) usedTokens.add(m[0]);
}

function parse(file) {
  const text = stripComments(fs.readFileSync(file, 'utf8'));
  const rules = [];
  const stack = [];
  let buf = '';
  let line = 1;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '\n') line++;
    if (c === '{') {
      const head = buf.trim().replace(/\s+/g, ' ');
      buf = '';
      if (head.startsWith('@')) {
        stack.push(head);
        i++;
        continue;
      }
      const start = line;
      let body = '';
      let inner = 0;
      i++;
      while (i < text.length) {
        const ch = text[i];
        if (ch === '\n') line++;
        if (ch === '{') inner++;
        if (ch === '}') {
          if (inner === 0) break;
          inner--;
        }
        body += ch;
        i++;
      }
      rules.push({ selector: head, context: stack.join(' | '), start, end: line, body });
      i++;
      continue;
    }
    if (c === '}') {
      stack.pop();
      buf = '';
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  return rules;
}

const target = process.argv[2];
const file = path.join(ROOT, target);
const rules = parse(file);
const declared = new Set();
for (const m of stripComments(fs.readFileSync(file, 'utf8')).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) declared.add(m[1]);
const dead = new Set([...declared].filter((c) => !usedTokens.has(c)));

console.log(`=== ${target}: dead classes (${dead.size}) ===`);
console.log('  ' + [...dead].sort().join(', '));
console.log(`\n=== rule blocks where EVERY class is dead ===`);
let total = 0;
for (const r of rules) {
  const classes = [...r.selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
  if (!classes.length) continue;
  if (classes.every((c) => dead.has(c))) {
    total += r.end - r.start + 1;
    console.log(`  ${r.start}-${r.end}  ${r.context ? '[' + r.context + '] ' : ''}${r.selector}`);
  }
}
console.log(`  --> ~${total} lines`);
console.log(`\n=== mixed selectors (some dead classes) ===`);
for (const r of rules) {
  const classes = [...r.selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
  if (!classes.length) continue;
  const d = classes.filter((c) => dead.has(c));
  if (d.length && d.length !== classes.length) console.log(`  ${r.start}-${r.end}  ${r.selector}   [dead: ${d.join(', ')}]`);
}

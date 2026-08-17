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

const files = walk(SRC);
const cssFiles = files.filter((f) => f.endsWith('.css'));
const codeFiles = files.filter((f) => /\.(js|jsx)$/.test(f));
codeFiles.push(path.join(ROOT, 'public/index.html'));

// ---- gather all class tokens referenced by code ----
const usedTokens = new Set();
for (const f of codeFiles) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/[A-Za-z0-9_-]+/g)) usedTokens.add(m[0]);
}

// ---- parse css: top level rules with media context ----
function parseRules(css) {
  const rules = [];
  const stack = [];
  let i = 0;
  let buf = '';
  while (i < css.length) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    if (ch === '{') {
      const sel = buf.trim();
      buf = '';
      if (sel.startsWith('@')) {
        stack.push(sel);
        i++;
        continue;
      }
      // find matching close
      let depth = 1;
      let j = i + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      const body = css.slice(i + 1, j - 1);
      rules.push({ sel, body, media: stack.join(' && '), start: i });
      i = j;
      continue;
    }
    if (ch === '}') {
      stack.pop();
      buf = '';
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  return rules;
}

const perFile = new Map();
const classOwners = new Map(); // class -> Set(file)
const importantCount = new Map();

for (const f of cssFiles) {
  const css = fs.readFileSync(f, 'utf8');
  const rules = parseRules(css);
  const rel = path.relative(ROOT, f);
  perFile.set(rel, rules);

  // Only classes in the leftmost compound of a selector are "globally exposed":
  // anything deeper is already scoped by an ancestor.
  const exposed = new Set();
  for (const r of rules) {
    for (const part of r.sel.split(',')) {
      const first = part.trim().split(/[\s>+~]+/)[0];
      for (const m of first.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)) exposed.add(m[1]);
    }
  }
  for (const c of exposed) {
    if (!classOwners.has(c)) classOwners.set(c, new Set());
    classOwners.get(c).add(rel);
  }
  const imp = (css.match(/!important/g) || []).length;
  if (imp) importantCount.set(rel, imp);
}

// ---- dead classes ----
console.log('===== DEAD CLASSES =====');
let anyDead = false;
for (const [rel, rules] of perFile) {
  const classes = new Set();
  for (const r of rules) for (const m of r.sel.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)) classes.add(m[1]);
  const dead = [...classes].filter((c) => !usedTokens.has(c));
  if (dead.length) {
    anyDead = true;
    console.log(`  ${rel}: ${dead.join(', ')}`);
  }
}
if (!anyDead) console.log('  none');

// ---- duplicate selectors in same media context ----
console.log('\n===== DUPLICATE SELECTORS (same file + media) =====');
let anyDup = false;
for (const [rel, rules] of perFile) {
  const seen = new Map();
  for (const r of rules) {
    const key = r.media + '||' + r.sel.replace(/\s+/g, ' ');
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(r);
  }
  for (const [key, list] of seen) {
    if (list.length > 1) {
      anyDup = true;
      console.log(`  ${rel}: ${key.split('||')[1]}  (${list.length}x)${key.split('||')[0] ? ' in ' + key.split('||')[0] : ''}`);
    }
  }
}
if (!anyDup) console.log('  none');

// ---- cross-file class collisions ----
console.log('\n===== CROSS-FILE COLLISIONS ON UNSCOPED (LEFTMOST) CLASSES =====');
const collisions = [...classOwners.entries()].filter(([, s]) => s.size > 1);
if (!collisions.length) console.log('  none');
for (const [c, s] of collisions.sort()) {
  console.log(`  .${c} -> ${[...s].join(', ')}`);
}

// ---- empty rules ----
console.log('\n===== EMPTY RULES =====');
let anyEmpty = false;
for (const [rel, rules] of perFile) {
  for (const r of rules) {
    if (!r.body.replace(/\s|\/\*[\s\S]*?\*\//g, '')) {
      anyEmpty = true;
      console.log(`  ${rel}: ${r.sel}`);
    }
  }
}
if (!anyEmpty) console.log('  none');

// ---- !important tally ----
console.log('\n===== !important COUNT =====');
for (const [rel, n] of [...importantCount.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${rel}`);
}

// ---- orphan keyframes / vars ----
console.log('\n===== KEYFRAMES =====');
const kfDef = new Map();
const kfUse = new Set();
for (const f of cssFiles) {
  const css = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);
  for (const m of css.matchAll(/@(?:-webkit-)?keyframes\s+([A-Za-z0-9_-]+)/g)) {
    if (!kfDef.has(m[1])) kfDef.set(m[1], []);
    kfDef.get(m[1]).push(rel);
  }
  for (const m of css.matchAll(/animation(?:-name)?\s*:\s*([^;]+);/g)) {
    for (const t of m[1].split(/[,\s]+/)) kfUse.add(t.trim());
  }
}
for (const [name, where] of kfDef) {
  const used = kfUse.has(name);
  if (!used) console.log(`  ORPHAN @keyframes ${name} (${where.join(', ')})`);
  else if (where.length > 1) console.log(`  DUP @keyframes ${name} defined in ${where.join(', ')}`);
}

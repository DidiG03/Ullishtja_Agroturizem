import fs from 'fs';

// usage: node css-scope.tmp.mjs <file> <rootClass> <namespacePrefix>
const [file, root, prefix] = process.argv.slice(2);
const css = fs.readFileSync(file, 'utf8');

const out = [];
let i = 0;
let buf = '';
const stack = []; // at-rule names

function scopeSelector(sel) {
  return sel
    .split(',')
    .map((part) => {
      const s = part.trim();
      if (!s) return part;
      if (/^(html|body|:root|from|to|\d+%)/.test(s)) return s;
      if (s.startsWith(`.${prefix}`)) return s;
      return `${root} ${s}`;
    })
    .join(',\n');
}

while (i < css.length) {
  const ch = css[i];
  if (ch === '/' && css[i + 1] === '*') {
    const end = css.indexOf('*/', i + 2);
    const seg = css.slice(i, end === -1 ? css.length : end + 2);
    out.push(buf, seg);
    buf = '';
    i = end === -1 ? css.length : end + 2;
    continue;
  }
  if (ch === '{') {
    const sel = buf.trim();
    const lead = buf.slice(0, buf.length - buf.trimStart().length);
    buf = '';
    if (sel.startsWith('@')) {
      stack.push(sel.split(/\s|\(/)[0]);
      out.push(lead + sel + ' {');
      i++;
      continue;
    }
    const inKeyframes = stack.some((a) => a.includes('keyframes'));
    out.push(lead + (inKeyframes ? sel : scopeSelector(sel)) + ' {');
    // copy declarations verbatim until matching close
    let depth = 1;
    let j = i + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      if (depth > 0) j++;
    }
    out.push(css.slice(i + 1, j));
    out.push('}');
    i = j + 1;
    continue;
  }
  if (ch === '}') {
    stack.pop();
    out.push(buf);
    buf = '';
    out.push('}');
    i++;
    continue;
  }
  buf += ch;
  i++;
}
out.push(buf);

fs.writeFileSync(file, out.join(''));
console.log(`scoped ${file} under ${root}`);

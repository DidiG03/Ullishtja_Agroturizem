export const IMAGE_ALIGNMENTS = [
  { id: 'full', label: 'Full width' },
  { id: 'center', label: 'Center' },
  { id: 'left', label: 'Float left' },
  { id: 'right', label: 'Float right' },
];

export function escapeAttr(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function buildImageBlock(src, alt = '', align = 'center') {
  const safeAlign = IMAGE_ALIGNMENTS.some((a) => a.id === align) ? align : 'center';
  return `<figure class="blog-figure blog-figure--${safeAlign}" data-blog-figure="true"><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy" /></figure>`;
}

export function setFigureAlignment(figureEl, align) {
  if (!figureEl) return;
  IMAGE_ALIGNMENTS.forEach((a) => figureEl.classList.remove(`blog-figure--${a.id}`));
  figureEl.classList.add(`blog-figure--${align}`);
  figureEl.setAttribute('data-align', align);
}

export function getFigureAlignment(figureEl) {
  if (!figureEl) return 'center';
  const fromData = figureEl.getAttribute('data-align');
  if (fromData) return fromData;
  for (const a of IMAGE_ALIGNMENTS) {
    if (figureEl.classList.contains(`blog-figure--${a.id}`)) return a.id;
  }
  return 'center';
}

export function findFigureFromNode(node, root) {
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (el && el !== root) {
    if (el.getAttribute?.('data-blog-figure') === 'true' || el.classList?.contains('blog-figure')) {
      return el;
    }
    if (el.tagName === 'IMG') {
      return el.closest('[data-blog-figure], .blog-figure') || el;
    }
    el = el.parentElement;
  }
  return null;
}

const BACKGROUND_STYLE_PROPS = ['background', 'background-color', 'background-image'];

function stripBackgroundFromStyleAttr(style = '') {
  const kept = style
    .split(';')
    .map((decl) => decl.trim())
    .filter((decl) => {
      if (!decl) return false;
      const prop = decl.split(':')[0]?.trim().toLowerCase();
      return !BACKGROUND_STYLE_PROPS.some((p) => prop === p || prop.startsWith(`${p}-`));
    });
  return kept.join('; ');
}

/** Wrap bare <img> tags and normalize legacy inline styles into figure blocks. */
export function normalizeContentHtml(html = '') {
  if (!html?.trim()) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');

  doc.body.querySelectorAll('*').forEach((el) => {
    if (el.hasAttribute('bgcolor')) el.removeAttribute('bgcolor');
    if (!el.hasAttribute('style')) return;
    const cleaned = stripBackgroundFromStyleAttr(el.getAttribute('style') || '');
    if (cleaned) el.setAttribute('style', cleaned);
    else el.removeAttribute('style');
  });

  doc.body.querySelectorAll('img').forEach((img) => {
    const parent = img.parentElement;
    if (parent?.getAttribute('data-blog-figure') === 'true' || parent?.classList?.contains('blog-figure')) {
      img.removeAttribute('style');
      img.setAttribute('loading', 'lazy');
      return;
    }

    const figure = doc.createElement('figure');
    figure.className = 'blog-figure blog-figure--center';
    figure.setAttribute('data-blog-figure', 'true');
    figure.setAttribute('data-align', 'center');

    if (parent?.tagName === 'P' && parent.childNodes.length === 1) {
      parent.replaceWith(figure);
    } else {
      img.parentNode?.insertBefore(figure, img);
    }
    figure.appendChild(img);
    img.removeAttribute('style');
    img.setAttribute('loading', 'lazy');
  });

  return doc.body.innerHTML;
}

export async function readFileAsDataUrl(file, maxBytes = 4 * 1024 * 1024) {
  if (file.size > maxBytes) {
    throw new Error(`Image must be under ${Math.round(maxBytes / 1024 / 1024)}MB. Use a hosted URL for larger files.`);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

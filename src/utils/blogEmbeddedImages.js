const DATA_IMG_SRC_RE = /src=(["'])(data:image\/[^"']+)\1/gi;

/** Unique data:image URLs in HTML content */
export function findEmbeddedDataUrls(html = '') {
  if (!html || !html.includes('data:image')) return [];
  const found = new Set();
  let match;
  const re = new RegExp(DATA_IMG_SRC_RE.source, 'gi');
  while ((match = re.exec(html)) !== null) {
    found.add(match[2]);
  }
  return [...found];
}

export function dataUrlToFile(dataUrl, index = 0) {
  const comma = dataUrl.indexOf(',');
  const header = dataUrl.slice(0, comma);
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const b64 = dataUrl.slice(comma + 1);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  return new File([bytes], `embedded-${Date.now()}-${index}.${ext}`, { type: mime });
}

/**
 * Replace data:image src values with hosted URLs via uploadFn(dataUrl) -> url
 */
export async function replaceEmbeddedImagesInHtml(html, uploadFn) {
  if (!html || !html.includes('data:image')) return html;
  const dataUrls = findEmbeddedDataUrls(html);
  let result = html;
  for (let i = 0; i < dataUrls.length; i += 1) {
    const dataUrl = dataUrls[i];
    const hostedUrl = await uploadFn(dataUrl, i);
    if (hostedUrl && hostedUrl !== dataUrl) {
      result = result.split(dataUrl).join(hostedUrl);
    }
  }
  return result;
}

export function estimateJsonBytes(obj) {
  try {
    return new Blob([JSON.stringify(obj)]).size;
  } catch {
    return JSON.stringify(obj).length;
  }
}

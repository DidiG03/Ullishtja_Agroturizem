import { normalizeContentHtml } from './blogImageUtils';

export const BLOG_DRAFT_STORAGE_KEY = 'ullishtja-blog-post-draft';

export const EMPTY_POST_FORM = {
  categoryId: '',
  slug: '',
  titleAL: '',
  titleEN: '',
  titleIT: '',
  excerptAL: '',
  excerptEN: '',
  excerptIT: '',
  contentAL: '',
  contentEN: '',
  contentIT: '',
  metaDescriptionAL: '',
  metaDescriptionEN: '',
  metaDescriptionIT: '',
  metaKeywordsAL: '',
  metaKeywordsEN: '',
  metaKeywordsIT: '',
  featuredImageUrl: '',
  featuredImageAlt: '',
  isPublished: false,
  isFeatured: false,
  displayOrder: 0,
};

export function stripHtml(html = '') {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

export function generateExcerpt(html = '', maxLength = 160) {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function postFormFromRecord(post) {
  if (!post) return { ...EMPTY_POST_FORM };
  return {
    categoryId: post.categoryId || post.category?.id || '',
    slug: post.slug || '',
    titleAL: post.titleAL || '',
    titleEN: post.titleEN || '',
    titleIT: post.titleIT || '',
    excerptAL: post.excerptAL || '',
    excerptEN: post.excerptEN || '',
    excerptIT: post.excerptIT || '',
    contentAL: post.contentAL || '',
    contentEN: post.contentEN || '',
    contentIT: post.contentIT || '',
    metaDescriptionAL: post.metaDescriptionAL || '',
    metaDescriptionEN: post.metaDescriptionEN || '',
    metaDescriptionIT: post.metaDescriptionIT || '',
    metaKeywordsAL: post.metaKeywordsAL || '',
    metaKeywordsEN: post.metaKeywordsEN || '',
    metaKeywordsIT: post.metaKeywordsIT || '',
    featuredImageUrl: post.featuredImageUrl || '',
    featuredImageAlt: post.featuredImageAlt || '',
    isPublished: Boolean(post.isPublished),
    isFeatured: Boolean(post.isFeatured),
    displayOrder: post.displayOrder ?? 0,
  };
}

export function normalizePostPayload(form) {
  return {
    ...form,
    titleEN: form.titleEN || form.titleAL,
    titleIT: form.titleIT || form.titleAL,
    contentAL: normalizeContentHtml(form.contentAL),
    contentEN: normalizeContentHtml(form.contentEN || form.contentAL),
    contentIT: normalizeContentHtml(form.contentIT || form.contentAL),
    excerptAL: form.excerptAL || generateExcerpt(form.contentAL),
    excerptEN: form.excerptEN || generateExcerpt(form.contentEN || form.contentAL),
    excerptIT: form.excerptIT || generateExcerpt(form.contentIT || form.contentAL),
  };
}

export const EDITOR_STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'content', label: 'Write' },
  { id: 'seo', label: 'SEO & media' },
  { id: 'publish', label: 'Publish' },
];

export const CONTENT_LANGS = [
  { id: 'AL', label: 'Shqip', flag: '🇦🇱' },
  { id: 'EN', label: 'English', flag: '🇬🇧' },
  { id: 'IT', label: 'Italiano', flag: '🇮🇹' },
];

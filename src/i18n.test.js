import { languageFromPath, legacyLanguageParam, localizedPath, stripLanguagePrefix } from './i18n';
import { buildSeo } from './seo/seo';

test('maps paths to languages', () => {
  expect(languageFromPath('/')).toBe('al');
  expect(languageFromPath('/menu')).toBe('al');
  expect(languageFromPath('/en')).toBe('en');
  expect(languageFromPath('/it/menu')).toBe('it');
  expect(languageFromPath('/al/menu')).toBe('al');
  expect(languageFromPath('/english')).toBe('al');
});

test('builds and strips language prefixes', () => {
  expect(localizedPath('/', 'al')).toBe('/');
  expect(localizedPath('/', 'en')).toBe('/en');
  expect(localizedPath('/menu', 'it')).toBe('/it/menu');
  expect(stripLanguagePrefix('/en')).toBe('/');
  expect(stripLanguagePrefix('/it/menu')).toBe('/menu');
  expect(stripLanguagePrefix('/menu')).toBe('/menu');
});

test('reads the old ?lang= parameter', () => {
  expect(legacyLanguageParam('?lang=en')).toBe('en');
  expect(legacyLanguageParam('?lang=xx')).toBe(null);
  expect(legacyLanguageParam('')).toBe(null);
});

test('gives each page one canonical and a full set of hreflang links', () => {
  const { tags } = buildSeo({ page: 'menu', lang: 'en' });
  const canonical = tags.filter((tag) => tag.attrs.rel === 'canonical');
  expect(canonical).toHaveLength(1);
  expect(canonical[0].attrs.href).toBe('https://ullishtja-agroturizem.com/en/menu');
  const hreflang = tags.filter((tag) => tag.attrs.rel === 'alternate').map((tag) => tag.attrs.hreflang);
  expect(hreflang).toEqual(['sq', 'en', 'it', 'x-default']);
});

test('keeps the 404 page out of the index', () => {
  const { tags } = buildSeo({ page: 'notFound', lang: 'al' });
  expect(tags.find((tag) => tag.attrs.name === 'robots').attrs.content).toMatch(/noindex/);
  expect(tags.some((tag) => tag.attrs.rel === 'canonical')).toBe(false);
});

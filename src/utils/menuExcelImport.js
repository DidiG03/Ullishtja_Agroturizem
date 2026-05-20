import * as XLSX from 'xlsx';

export function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function cellStr(value) {
  if (value == null) return '';
  return String(value).trim();
}

function isHeaderRow(row) {
  const a = cellStr(row[0]).toLowerCase();
  const b = cellStr(row[1]).toLowerCase();
  return a.includes('category') && (b.includes('albanian') || b.includes('name'));
}

export function parsePrice(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const cleaned = String(value)
    .replace(/\s/g, '')
    .replace(/lekë?|all/gi, '')
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parseBilingual(text) {
  const t = cellStr(text);
  if (!t) return { nameAL: '', nameEN: '' };
  const slash = t.indexOf('/');
  if (slash !== -1) {
    return {
      nameAL: t.slice(0, slash).trim(),
      nameEN: t.slice(slash + 1).trim() || t.slice(0, slash).trim(),
    };
  }
  return { nameAL: t, nameEN: t };
}

function isSectionHeaderRow(colA, colB, colC, price) {
  const cat = cellStr(colA);
  const al = cellStr(colB);
  const en = cellStr(colC);
  if (!cat) return false;
  if (al || en) return false;
  if (price != null) return false;
  return true;
}

function ensureCategory(categoryBySlug, categories, parsed) {
  const slug = slugify(parsed.nameAL);
  if (!slug) return null;

  if (categoryBySlug.has(slug)) {
    return categoryBySlug.get(slug);
  }

  const category = {
    slug,
    nameAL: parsed.nameAL,
    nameEN: parsed.nameEN || parsed.nameAL,
    nameIT: parsed.nameEN || parsed.nameAL,
    displayOrder: categories.length,
    isActive: true,
  };
  categoryBySlug.set(slug, category);
  categories.push(category);
  return category;
}

/**
 * Parse rows from the first sheet (array of arrays: A, B, C, D).
 * Expected columns: Category | Albanian Name | English Name | Price (Lekë)
 */
export function parseMenuRows(rows) {
  const errors = [];
  const categories = [];
  const items = [];
  const categoryBySlug = new Map();
  const itemOrderByCategory = new Map();
  let currentCategory = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const colA = cellStr(row[0]);
    const colB = cellStr(row[1]);
    const colC = cellStr(row[2]);
    const price = parsePrice(row[3]);

    if (!colA && !colB && !colC && price == null) continue;
    if (isHeaderRow(row)) continue;

    if (isSectionHeaderRow(colA, colB, colC, price)) {
      const parsed = parseBilingual(colA);
      if (!parsed.nameAL) {
        errors.push({ row: i + 1, message: 'Section header is missing a category name.' });
        continue;
      }
      currentCategory = ensureCategory(categoryBySlug, categories, parsed);
      itemOrderByCategory.set(currentCategory.slug, 0);
      continue;
    }

    if (colB && price != null) {
      const nameAL = colB;
      const nameEN = colC || colB;
      let category = currentCategory;

      if (colA) {
        const parsedCat = parseBilingual(colA);
        category = ensureCategory(categoryBySlug, categories, parsedCat);
        if (!itemOrderByCategory.has(category.slug)) {
          itemOrderByCategory.set(category.slug, 0);
        }
        currentCategory = category;
      }

      if (!category) {
        errors.push({
          row: i + 1,
          message: `"${nameAL}" has no category — add a section header row above it.`,
        });
        continue;
      }

      const order = itemOrderByCategory.get(category.slug) ?? 0;
      itemOrderByCategory.set(category.slug, order + 1);

      items.push({
        categorySlug: category.slug,
        nameAL,
        nameEN,
        nameIT: nameEN,
        price,
        displayOrder: order,
        isActive: true,
      });
      continue;
    }

    if (colB && price == null) {
      errors.push({ row: i + 1, message: `"${colB}" is missing a price.` });
    } else if (colA && !colB) {
      errors.push({ row: i + 1, message: `Unrecognized row: "${colA}".` });
    }
  }

  return {
    categories,
    items,
    errors,
    stats: {
      categoryCount: categories.length,
      itemCount: items.length,
      rowCount: rows.length,
    },
  };
}

export function parseMenuWorkbook(workbook) {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      categories: [],
      items: [],
      errors: [{ row: 0, message: 'Workbook has no sheets.' }],
      stats: { categoryCount: 0, itemCount: 0, rowCount: 0 },
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  return parseMenuRows(rows);
}

export async function parseMenuExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  return parseMenuWorkbook(workbook);
}

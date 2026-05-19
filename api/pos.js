// Consolidated POS API for external apps
// Menu: GET /api/pos?resource=menu&lang=al&flat=false&includeInactive=false

import prisma from '../src/lib/prisma.js';

function coerceBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase().trim();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function pickLocalized(obj, baseKey, langSuffixes) {
  for (const suffix of langSuffixes) {
    const key = `${baseKey}${suffix}`;
    if (obj[key] && typeof obj[key] === 'string' && obj[key].trim().length > 0) {
      return obj[key];
    }
  }
  return null;
}

function parseAllergens(allergens) {
  if (!allergens) return [];
  try {
    const parsed = JSON.parse(allergens);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return String(allergens)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export default async function handler(req, res) {
  // CORS for external apps
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { resource = 'menu' } = req.query || {};

  try {
    if (resource !== 'menu') {
      return res.status(400).json({
        success: false,
        error: 'Unsupported resource. Use resource=menu',
      });
    }

    // Menu
    const { lang = 'al', flat = 'false', includeInactive = 'false' } = req.query || {};
    const language = String(lang).toLowerCase();
    const isFlat = coerceBoolean(flat, false);
    const includeInactiveBool = coerceBoolean(includeInactive, false);

    const suffix = language === 'it' ? 'IT' : language === 'en' ? 'EN' : 'AL';
    const langOrder = suffix === 'EN' ? ['EN', 'AL', 'IT'] : suffix === 'IT' ? ['IT', 'AL', 'EN'] : ['AL', 'EN', 'IT'];

    const categories = await prisma.menuCategory.findMany({
      where: includeInactiveBool ? undefined : { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { nameAL: 'asc' }],
      include: {
        menuItems: {
          where: includeInactiveBool ? undefined : { isActive: true },
          orderBy: [{ displayOrder: 'asc' }, { nameAL: 'asc' }],
        },
      },
    });

    const transformedCategories = categories.map((cat) => {
      const categoryName = pickLocalized(cat, 'name', langOrder) || cat.nameAL || cat.nameEN || cat.nameIT || '';
      const items = (cat.menuItems || []).map((item) => {
        const name = pickLocalized(item, 'name', langOrder) || item.nameAL || item.nameEN || item.nameIT || '';
        const description = pickLocalized(item, 'description', langOrder) || '';
        const ingredients = pickLocalized(item, 'ingredients', langOrder) || '';
        return {
          id: item.id,
          categoryId: item.categoryId,
          name,
          description,
          ingredients,
          price: item.price,
          currency: item.currency,
          displayOrder: item.displayOrder,
          isActive: item.isActive,
          tags: {
            isVegetarian: item.isVegetarian,
            isSpicy: item.isSpicy,
            isRecommended: item.isRecommended,
            isNew: item.isNew,
            isKg: item.isKg,
          },
          allergens: parseAllergens(item.allergens),
          imageUrl: item.imageUrl || null,
          updatedAt: item.updatedAt,
          createdAt: item.createdAt,
        };
      });

      return {
        id: cat.id,
        slug: cat.slug,
        name: categoryName,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
        items,
        updatedAt: cat.updatedAt,
        createdAt: cat.createdAt,
      };
    });

    const nowIso = new Date().toISOString();
    res.setHeader('Cache-Control', 'no-store');

    if (isFlat) {
      const flatItems = transformedCategories.flatMap((c) =>
        c.items.map((i) => ({
          ...i,
          category: { id: c.id, slug: c.slug, name: c.name, displayOrder: c.displayOrder },
        })),
      );
      return res.status(200).json({ success: true, source: 'pos-menu', language: suffix, updatedAt: nowIso, data: flatItems });
    }

    return res.status(200).json({ success: true, source: 'pos-menu', language: suffix, updatedAt: nowIso, data: transformedCategories });
  } catch (error) {
    console.error('POS API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}



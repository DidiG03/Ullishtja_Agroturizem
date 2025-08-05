// Seed Blog Categories
// Creates initial blog categories from the existing translations

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  {
    nameAL: 'Bujqësia',
    nameEN: 'Agriculture',
    nameIT: 'Agricoltura',
    slug: 'bujqesia',
    descriptionAL: 'Artikuj mbi praktikat moderne të bujqësisë dhe teknikat tradicionale shqiptare',
    descriptionEN: 'Articles about modern agricultural practices and traditional Albanian techniques',
    descriptionIT: 'Articoli sulle pratiche agricole moderne e le tecniche tradizionali albanesi',
    displayOrder: 1
  },
  {
    nameAL: 'Qëndrueshmëri',
    nameEN: 'Sustainability',
    nameIT: 'Sostenibilità',
    slug: 'qendrueshmeri',
    descriptionAL: 'Praktikat e qëndrueshme në bujqësi dhe mbrojtjen e mjedisit',
    descriptionEN: 'Sustainable practices in agriculture and environmental protection',
    descriptionIT: 'Pratiche sostenibili in agricoltura e protezione ambientale',
    displayOrder: 2
  },
  {
    nameAL: 'Traditë',
    nameEN: 'Tradition',
    nameIT: 'Tradizione',
    slug: 'tradite',
    descriptionAL: 'Traditat shqiptare të kuzhinës dhe kulturës rurale',
    descriptionEN: 'Albanian traditions of cuisine and rural culture',
    descriptionIT: 'Tradizioni albanesi di cucina e cultura rurale',
    displayOrder: 3
  },
  {
    nameAL: 'Receta',
    nameEN: 'Recipes',
    nameIT: 'Ricette',
    slug: 'receta',
    descriptionAL: 'Receta tradicionale dhe moderne me ingredientë lokalë',
    descriptionEN: 'Traditional and modern recipes with local ingredients',
    descriptionIT: 'Ricette tradizionali e moderne con ingredienti locali',
    displayOrder: 4
  },
  {
    nameAL: 'Natyra',
    nameEN: 'Nature',
    nameIT: 'Natura',
    slug: 'natyra',
    descriptionAL: 'Bukuria e natyrës shqiptare dhe turizmi i qëndrueshëm',
    descriptionEN: 'The beauty of Albanian nature and sustainable tourism',
    descriptionIT: 'La bellezza della natura albanese e il turismo sostenibile',
    displayOrder: 5
  }
];

async function seedBlogCategories() {
  console.log('🌱 Seeding blog categories...');

  try {
    // Check if categories already exist
    const existingCategories = await prisma.blogCategory.count();
    
    if (existingCategories > 0) {
      console.log(`📋 Found ${existingCategories} existing categories. Skipping seed.`);
      console.log('💡 If you want to re-seed, delete existing categories first.');
      return;
    }

    // Create categories
    for (const category of categories) {
      try {
        const created = await prisma.blogCategory.create({
          data: category
        });
        console.log(`✅ Created category: ${created.nameEN} (${created.slug})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Category "${category.slug}" already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 Blog categories seeded successfully!');
    
    // Display summary
    const totalCategories = await prisma.blogCategory.count();
    console.log(`📊 Total categories in database: ${totalCategories}`);

  } catch (error) {
    console.error('❌ Error seeding blog categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedBlogCategories()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { seedBlogCategories };
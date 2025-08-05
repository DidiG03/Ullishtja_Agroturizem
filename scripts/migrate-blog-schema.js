#!/usr/bin/env node

/**
 * Blog Schema Migration Script
 * 
 * This script deploys the blog schema migrations to production
 * and seeds initial blog categories.
 * 
 * Usage:
 *   node scripts/migrate-blog-schema.js
 * 
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection string for production
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting blog schema migration...');

  try {
    // Step 1: Deploy Prisma migrations
    console.log('📦 Deploying Prisma migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Prisma migrations deployed successfully');

    // Step 2: Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');

    // Step 3: Check if blog categories already exist
    console.log('🔍 Checking for existing blog categories...');
    const existingCategories = await prisma.blogCategory.count();
    
    if (existingCategories === 0) {
      console.log('📝 Seeding initial blog categories...');
      
      // Seed initial categories
      const categories = [
        {
          slug: 'bujqesia',
          nameAL: 'Bujqësia',
          nameEN: 'Agriculture',
          nameIT: 'Agricoltura',
          descriptionAL: 'Artikuj rreth praktikave bujqësore dhe kultivimit',
          descriptionEN: 'Articles about agricultural practices and cultivation',
          descriptionIT: 'Articoli sulle pratiche agricole e la coltivazione'
        },
        {
          slug: 'qendrueshmerita',
          nameAL: 'Qëndrueshmëria',
          nameEN: 'Sustainability',
          nameIT: 'Sostenibilità',
          descriptionAL: 'Praktikat e qëndrueshme në bujqësi dhe agroturizëm',
          descriptionEN: 'Sustainable practices in agriculture and agritourism',
          descriptionIT: 'Pratiche sostenibili in agricoltura e agriturismo'
        },
        {
          slug: 'tradita',
          nameAL: 'Traditë',
          nameEN: 'Tradition',
          nameIT: 'Tradizione',
          descriptionAL: 'Traditat e trashëguara në bujqësi dhe ushqim',
          descriptionEN: 'Inherited traditions in agriculture and food',
          descriptionIT: 'Tradizioni ereditate in agricoltura e cibo'
        },
        {
          slug: 'receta',
          nameAL: 'Receta',
          nameEN: 'Recipes',
          nameIT: 'Ricette',
          descriptionAL: 'Receta tradicionale me produkte lokale',
          descriptionEN: 'Traditional recipes with local products',
          descriptionIT: 'Ricette tradizionali con prodotti locali'
        },
        {
          slug: 'natyra',
          nameAL: 'Natyra',
          nameEN: 'Nature',
          nameIT: 'Natura',
          descriptionAL: 'Mjedisi natyror dhe biodiversiteti',
          descriptionEN: 'Natural environment and biodiversity',
          descriptionIT: 'Ambiente naturale e biodiversità'
        }
      ];

      for (const category of categories) {
        await prisma.blogCategory.create({
          data: category
        });
        console.log(`✅ Created category: ${category.nameAL}`);
      }
      
      console.log('✅ Blog categories seeded successfully');
    } else {
      console.log(`ℹ️  Found ${existingCategories} existing blog categories, skipping seeding`);
    }

    // Step 4: Verify the migration
    console.log('🔍 Verifying migration...');
    const blogCategories = await prisma.blogCategory.findMany();
    const blogPosts = await prisma.blogPost.findMany();
    
    console.log(`✅ Found ${blogCategories.length} blog categories`);
    console.log(`✅ Found ${blogPosts.length} blog posts`);

    console.log('\n🎉 Blog schema migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Visit your admin dashboard');
    console.log('2. Go to the Blog section');
    console.log('3. Start creating blog posts');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
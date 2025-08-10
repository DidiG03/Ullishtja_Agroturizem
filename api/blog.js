// Consolidated Blog API - handles posts and categories in one function
// Usage:
// - Categories: /api/blog?resource=categories [GET, POST, PUT, DELETE]
// - Posts: /api/blog?resource=posts [GET, POST, PUT, DELETE]

import prisma from '../src/lib/prisma.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { resource = 'posts', id } = req.query || {};

  try {
    if (resource === 'categories') {
      if (req.method === 'GET') {
        const categories = await prisma.blogCategory.findMany({
          include: {
            _count: {
              select: { blogPosts: { where: { isPublished: true } } },
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        const transformed = categories.map((c) => ({
          id: c.id,
          name: c.nameAL,
          nameAL: c.nameAL,
          nameEN: c.nameEN,
          nameIT: c.nameIT,
          slug: c.slug,
          descriptionAL: c.descriptionAL,
          descriptionEN: c.descriptionEN,
          descriptionIT: c.descriptionIT,
          displayOrder: c.displayOrder,
          isActive: c.isActive,
          postCount: c._count.blogPosts,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));

        return res.status(200).json({ success: true, data: transformed });
      }

      if (req.method === 'POST') {
        const { slug, nameAL, nameEN, nameIT, descriptionAL, descriptionEN, descriptionIT, displayOrder = 0, isActive = true } = req.body || {};
        if (!nameAL || !nameEN || !nameIT || !slug) {
          return res.status(400).json({ success: false, error: 'Missing required fields', required: ['nameAL', 'nameEN', 'nameIT', 'slug'] });
        }
        const existing = await prisma.blogCategory.findUnique({ where: { slug } });
        if (existing) {
          return res.status(400).json({ success: false, error: 'Slug already exists' });
        }
        const created = await prisma.blogCategory.create({
          data: { slug, nameAL, nameEN, nameIT, descriptionAL, descriptionEN, descriptionIT, displayOrder, isActive },
        });
        return res.status(201).json({ success: true, data: created });
      }

      if (req.method === 'PUT') {
        if (!id) return res.status(400).json({ success: false, error: 'id is required' });
        const { slug, nameAL, nameEN, nameIT, descriptionAL, descriptionEN, descriptionIT, displayOrder, isActive } = req.body || {};
        const updateData = {};
        if (slug !== undefined) updateData.slug = slug;
        if (nameAL !== undefined) updateData.nameAL = nameAL;
        if (nameEN !== undefined) updateData.nameEN = nameEN;
        if (nameIT !== undefined) updateData.nameIT = nameIT;
        if (descriptionAL !== undefined) updateData.descriptionAL = descriptionAL;
        if (descriptionEN !== undefined) updateData.descriptionEN = descriptionEN;
        if (descriptionIT !== undefined) updateData.descriptionIT = descriptionIT;
        if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
        if (isActive !== undefined) updateData.isActive = isActive;
        const updated = await prisma.blogCategory.update({ where: { id }, data: updateData });
        return res.status(200).json({ success: true, data: updated });
      }

      if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ success: false, error: 'id is required' });
        await prisma.blogCategory.delete({ where: { id } });
        return res.status(200).json({ success: true, message: 'Category deleted successfully' });
      }

      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Posts resource
    if (req.method === 'GET') {
      const { category, featured, published = 'true' } = req.query || {};
      const whereClause = {};
      if (published === 'true') whereClause.isPublished = true;
      else if (published === 'false') whereClause.isPublished = false;
      if (category && category !== 'all') whereClause.category = { slug: category };
      if (featured !== undefined) whereClause.isFeatured = String(featured) === 'true';

      const posts = await prisma.blogPost.findMany({
        where: whereClause,
        include: {
          category: { select: { id: true, nameAL: true, nameEN: true, nameIT: true, slug: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      });

      const transformed = posts.map((post) => ({
        id: post.id,
        titleAL: post.titleAL,
        titleEN: post.titleEN,
        titleIT: post.titleIT,
        excerptAL: post.excerptAL,
        excerptEN: post.excerptEN,
        excerptIT: post.excerptIT,
        contentAL: post.contentAL,
        contentEN: post.contentEN,
        contentIT: post.contentIT,
        slug: post.slug,
        featuredImageUrl: post.featuredImageUrl,
        featuredImageAlt: post.featuredImageAlt,
        author: post.author,
        isFeatured: post.isFeatured,
        isPublished: post.isPublished,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        metaDescription: post.metaDescription,
        metaKeywords: post.metaKeywords,
        category: {
          id: post.category.id,
          name: post.category.nameAL,
          nameAL: post.category.nameAL,
          nameEN: post.category.nameEN,
          nameIT: post.category.nameIT,
          slug: post.category.slug,
        },
      }));

      return res.status(200).json({ success: true, data: transformed });
    }

    if (req.method === 'POST') {
      const {
        categoryId,
        slug,
        titleAL,
        titleEN,
        titleIT,
        excerptAL,
        excerptEN,
        excerptIT,
        contentAL,
        contentEN,
        contentIT,
        featuredImageUrl,
        featuredImageAlt,
        author,
        isFeatured = false,
        isPublished = false,
        metaDescription,
        metaKeywords,
        displayOrder = 0,
      } = req.body || {};

      if (!categoryId || !slug || !titleAL || !titleEN || !titleIT || !contentAL || !contentEN || !contentIT) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['categoryId', 'slug', 'titleAL', 'titleEN', 'titleIT', 'contentAL', 'contentEN', 'contentIT'],
        });
      }

      const existingPost = await prisma.blogPost.findUnique({ where: { slug } });
      if (existingPost) {
        return res.status(400).json({ success: false, error: 'Slug already exists' });
      }

      const newPost = await prisma.blogPost.create({
        data: {
          categoryId,
          slug,
          titleAL,
          titleEN,
          titleIT,
          excerptAL,
          excerptEN,
          excerptIT,
          contentAL,
          contentEN,
          contentIT,
          featuredImageUrl,
          featuredImageAlt,
          author,
          isFeatured,
          isPublished,
          displayOrder,
          publishedAt: isPublished ? new Date() : null,
          metaDescription,
          metaKeywords,
        },
        include: {
          category: { select: { id: true, nameAL: true, nameEN: true, nameIT: true, slug: true } },
        },
      });

      return res.status(201).json({ success: true, data: newPost });
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ success: false, error: 'id is required' });
      const {
        categoryId,
        slug,
        titleAL,
        titleEN,
        titleIT,
        excerptAL,
        excerptEN,
        excerptIT,
        contentAL,
        contentEN,
        contentIT,
        featuredImageUrl,
        featuredImageAlt,
        author,
        isFeatured,
        isPublished,
        displayOrder,
        metaDescription,
        metaKeywords,
      } = req.body || {};

      const updateData = {};
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (slug !== undefined) updateData.slug = slug;
      if (titleAL !== undefined) updateData.titleAL = titleAL;
      if (titleEN !== undefined) updateData.titleEN = titleEN;
      if (titleIT !== undefined) updateData.titleIT = titleIT;
      if (excerptAL !== undefined) updateData.excerptAL = excerptAL;
      if (excerptEN !== undefined) updateData.excerptEN = excerptEN;
      if (excerptIT !== undefined) updateData.excerptIT = excerptIT;
      if (contentAL !== undefined) updateData.contentAL = contentAL;
      if (contentEN !== undefined) updateData.contentEN = contentEN;
      if (contentIT !== undefined) updateData.contentIT = contentIT;
      if (featuredImageUrl !== undefined) updateData.featuredImageUrl = featuredImageUrl;
      if (featuredImageAlt !== undefined) updateData.featuredImageAlt = featuredImageAlt;
      if (author !== undefined) updateData.author = author;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (isPublished !== undefined) updateData.isPublished = isPublished;
      if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
      if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
      if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;
      if (isPublished === true) updateData.publishedAt = new Date();

      const updated = await prisma.blogPost.update({ where: { id }, data: updateData });
      return res.status(200).json({ success: true, data: updated });
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ success: false, error: 'id is required' });
      await prisma.blogPost.delete({ where: { id } });
      return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Blog API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}



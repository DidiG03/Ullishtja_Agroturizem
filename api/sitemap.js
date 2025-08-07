// Dynamic Sitemap Generator for Vercel
// Generates XML sitemap with all published blog posts

const prisma = require('../src/lib/prisma.js').default;

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all published blog posts
    const publishedPosts = await prisma.blogPost.findMany({
      where: {
        isPublished: true
      },
      select: {
        slug: true,
        publishedAt: true,
        updatedAt: true,
        isFeatured: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    // Get the current date for lastmod
    const currentDate = new Date().toISOString().split('T')[0];

    // Start building the sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Main Homepage - Contains all primary content sections -->
  <url>
    <loc>https://ullishtja-agroturizem.com/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    
    <!-- Language alternatives for international SEO -->
    <xhtml:link rel="alternate" hreflang="sq" href="https://ullishtja-agroturizem.com/?lang=al" />
    <xhtml:link rel="alternate" hreflang="en" href="https://ullishtja-agroturizem.com/?lang=en" />
    <xhtml:link rel="alternate" hreflang="it" href="https://ullishtja-agroturizem.com/?lang=it" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ullishtja-agroturizem.com/" />
    
    <!-- Image information for SEO -->
    <image:image>
      <image:loc>https://ullishtja-agroturizem.com/images/posters/hero-poster.jpg</image:loc>
      <image:title>Ullishtja Agroturizem Restaurant - Mountain Views</image:title>
      <image:caption>Authentic Albanian restaurant with breathtaking 360° mountain views</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://ullishtja-agroturizem.com/images/ullishtja_logo.jpeg</image:loc>
      <image:title>Ullishtja Agroturizem Logo</image:title>
      <image:caption>Official logo of Ullishtja Agroturizem Albanian restaurant</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://ullishtja-agroturizem.com/images/posters/alacarte-poster.jpg</image:loc>
      <image:title>Albanian A la Carte Menu</image:title>
      <image:caption>Traditional Albanian cuisine and farm-to-table dining experience</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://ullishtja-agroturizem.com/images/posters/events-poster.jpg</image:loc>
      <image:title>Wedding and Events Venue</image:title>
      <image:caption>Beautiful venue for weddings, events and celebrations in Durres, Albania</image:caption>
    </image:image>
  </url>
  
  <!-- Language-specific versions (using URL parameters) -->
  <url>
    <loc>https://ullishtja-agroturizem.com/?lang=al</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="sq" href="https://ullishtja-agroturizem.com/?lang=al" />
    <xhtml:link rel="alternate" hreflang="en" href="https://ullishtja-agroturizem.com/?lang=en" />
    <xhtml:link rel="alternate" hreflang="it" href="https://ullishtja-agroturizem.com/?lang=it" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ullishtja-agroturizem.com/" />
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/?lang=en</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="sq" href="https://ullishtja-agroturizem.com/?lang=al" />
    <xhtml:link rel="alternate" hreflang="en" href="https://ullishtja-agroturizem.com/?lang=en" />
    <xhtml:link rel="alternate" hreflang="it" href="https://ullishtja-agroturizem.com/?lang=it" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ullishtja-agroturizem.com/" />
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/?lang=it</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="sq" href="https://ullishtja-agroturizem.com/?lang=al" />
    <xhtml:link rel="alternate" hreflang="en" href="https://ullishtja-agroturizem.com/?lang=en" />
    <xhtml:link rel="alternate" hreflang="it" href="https://ullishtja-agroturizem.com/?lang=it" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ullishtja-agroturizem.com/" />
  </url>
  
  <!-- Section-specific URLs for better SEO (anchor-based navigation) -->
  <url>
    <loc>https://ullishtja-agroturizem.com/#home</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/#about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/#menu</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/#events</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/#alacarte</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/#contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Blog Section -->
  <url>
    <loc>https://ullishtja-agroturizem.com/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    
    <!-- Language alternatives for blog -->
    <xhtml:link rel="alternate" hreflang="sq" href="https://ullishtja-agroturizem.com/blog?lang=al" />
    <xhtml:link rel="alternate" hreflang="en" href="https://ullishtja-agroturizem.com/blog?lang=en" />
    <xhtml:link rel="alternate" hreflang="it" href="https://ullishtja-agroturizem.com/blog?lang=it" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ullishtja-agroturizem.com/blog" />
  </url>
  
  <!-- Blog language variants -->
  <url>
    <loc>https://ullishtja-agroturizem.com/blog?lang=al</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="sq" href="https://ullishtja-agroturizem.com/blog?lang=al" />
    <xhtml:link rel="alternate" hreflang="en" href="https://ullishtja-agroturizem.com/blog?lang=en" />
    <xhtml:link rel="alternate" hreflang="it" href="https://ullishtja-agroturizem.com/blog?lang=it" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ullishtja-agroturizem.com/blog" />
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/blog?lang=en</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="sq" href="https://ullishtja-agroturizem.com/blog?lang=al" />
    <xhtml:link rel="alternate" hreflang="en" href="https://ullishtja-agroturizem.com/blog?lang=en" />
    <xhtml:link rel="alternate" hreflang="it" href="https://ullishtja-agroturizem.com/blog?lang=it" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ullishtja-agroturizem.com/blog" />
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/blog?lang=it</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="sq" href="https://ullishtja-agroturizem.com/blog?lang=al" />
    <xhtml:link rel="alternate" hreflang="en" href="https://ullishtja-agroturizem.com/blog?lang=en" />
    <xhtml:link rel="alternate" hreflang="it" href="https://ullishtja-agroturizem.com/blog?lang=it" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ullishtja-agroturizem.com/blog" />
  </url>
  
  <!-- Blog Category Pages -->
  <url>
    <loc>https://ullishtja-agroturizem.com/blog?category=agriculture</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/blog?category=sustainability</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/blog?category=tradition</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/blog?category=recipes</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://ullishtja-agroturizem.com/blog?category=nature</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;

    // Add dynamic blog posts
    publishedPosts.forEach(post => {
      const lastmod = post.updatedAt ? post.updatedAt.toISOString().split('T')[0] : currentDate;
      const priority = post.isFeatured ? '0.8' : '0.6';
      
      sitemap += `
  <!-- Blog Post: ${post.slug} -->
  <url>
    <loc>https://ullishtja-agroturizem.com/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
    
    <!-- Language alternatives for blog post -->
    <xhtml:link rel="alternate" hreflang="sq" href="https://ullishtja-agroturizem.com/blog/${post.slug}?lang=al" />
    <xhtml:link rel="alternate" hreflang="en" href="https://ullishtja-agroturizem.com/blog/${post.slug}?lang=en" />
    <xhtml:link rel="alternate" hreflang="it" href="https://ullishtja-agroturizem.com/blog/${post.slug}?lang=it" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ullishtja-agroturizem.com/blog/${post.slug}" />
  </url>`;
    });

    // Close the sitemap
    sitemap += `
  
  <!-- Note: Admin pages (/admin-login, /dashboard) are intentionally excluded 
       from the sitemap as they are not meant for public indexing -->
       
</urlset>`;

    // Set appropriate headers for XML
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    return res.status(200).send(sitemap);

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate sitemap',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}
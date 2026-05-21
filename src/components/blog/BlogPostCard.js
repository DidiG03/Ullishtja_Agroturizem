import React from 'react';

function BlogPostCard({ post, currentLanguage, formatDate, onRead }) {
  const featuredLabel =
    currentLanguage === 'al' ? 'I Zgjedhur' : currentLanguage === 'it' ? 'In Evidenza' : 'Featured';

  const readLabel =
    currentLanguage === 'al'
      ? 'Lexo Artikullin e Plotë'
      : currentLanguage === 'it'
        ? 'Leggi Articolo Completo'
        : 'Read Full Article';

  return (
    <article className="blog-post-card">
      {post.featuredImageUrl && (
        <div className="post-card-image">
          <img src={post.featuredImageUrl} alt={post.featuredImageAlt || post.title} loading="lazy" />
        </div>
      )}

      <div className="post-card-header">
        <h2 className="post-card-title">{post.title}</h2>
        <div className="post-card-meta">
          <span className="post-date">{formatDate(post.publishedAt || post.createdAt || post.publishDate)}</span>
          <span className="post-category">
            {post.category?.name || post.category?.nameAL || 'Blog'}
          </span>
          {post.isFeatured && <span className="featured-badge">{featuredLabel}</span>}
        </div>
      </div>

      <div className="post-card-content">
        {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}

        <div className="post-card-actions">
          <button type="button" className="read-full-btn" onClick={() => onRead(post)}>
            {readLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export default BlogPostCard;

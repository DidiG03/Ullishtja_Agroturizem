import React, { useState, useEffect, useMemo } from 'react';
import blogService from '../../services/blogService';
import RichTextEditor from './RichTextEditor';
import {
  EMPTY_POST_FORM,
  BLOG_DRAFT_STORAGE_KEY,
  EDITOR_STEPS,
  CONTENT_LANGS,
  postFormFromRecord,
  normalizePostPayload,
  generateExcerpt,
  stripHtml,
} from './blogEditorUtils';
import { normalizeContentHtml } from './blogImageUtils';
import './BlogPostEditor.css';
import './blogContentImages.css';

function BlogPostEditor({ post, categories, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => postFormFromRecord(post));
  const [step, setStep] = useState('basics');
  const [contentLang, setContentLang] = useState('AL');
  const [previewLang, setPreviewLang] = useState('AL');
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isEditing = Boolean(post?.id);
  const draftKey = `${BLOG_DRAFT_STORAGE_KEY}-${post?.id || 'new'}`;

  useEffect(() => {
    if (post) {
      setForm(postFormFromRecord(post));
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm(parsed.form || EMPTY_POST_FORM);
        setDraftSavedAt(parsed.savedAt);
      }
    } catch {
      /* ignore */
    }
  }, [post, draftKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ form, savedAt: new Date().toISOString() })
        );
        setDraftSavedAt(new Date().toISOString());
      } catch {
        /* storage full */
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [form, draftKey]);

  const updateForm = (updates) => setForm((prev) => ({ ...prev, ...updates }));

  const handleTitleALChange = (value) => {
    updateForm({
      titleAL: value,
      slug: value ? blogService.generateSlug(value) : form.slug,
    });
  };

  const copyFromAlbanian = () => {
    updateForm({
      titleEN: form.titleEN || form.titleAL,
      titleIT: form.titleIT || form.titleAL,
      excerptEN: form.excerptEN || form.excerptAL || generateExcerpt(form.contentAL),
      excerptIT: form.excerptIT || form.excerptAL || generateExcerpt(form.contentAL),
      contentEN: form.contentEN || form.contentAL,
      contentIT: form.contentIT || form.contentAL,
      metaDescriptionEN: form.metaDescriptionEN || form.metaDescriptionAL,
      metaDescriptionIT: form.metaDescriptionIT || form.metaDescriptionAL,
      metaKeywordsEN: form.metaKeywordsEN || form.metaKeywordsAL,
      metaKeywordsIT: form.metaKeywordsIT || form.metaKeywordsAL,
    });
  };

  const autoFillExcerpts = () => {
    updateForm({
      excerptAL: form.excerptAL || generateExcerpt(form.contentAL),
      excerptEN: form.excerptEN || generateExcerpt(form.contentEN || form.contentAL),
      excerptIT: form.excerptIT || generateExcerpt(form.contentIT || form.contentAL),
    });
  };

  const langField = (base) => `${base}${contentLang}`;

  const handleFeaturedUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await blogService.uploadImage(file, {
        altText: form.featuredImageAlt || form.titleAL,
      });
      const url = result.data?.url;
      if (url?.startsWith('http') || url?.startsWith('/')) {
        updateForm({ featuredImageUrl: url });
      } else {
        const reader = new FileReader();
        reader.onload = () => updateForm({ featuredImageUrl: reader.result });
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => updateForm({ featuredImageUrl: reader.result });
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const previewPost = useMemo(() => {
    const suffix = previewLang;
    const rawContent = form[`content${suffix}`] || form.contentAL;
    return {
      title: form[`title${suffix}`] || form.titleAL,
      excerpt: form[`excerpt${suffix}`] || generateExcerpt(rawContent),
      content: normalizeContentHtml(rawContent),
      image: form.featuredImageUrl,
    };
  }, [form, previewLang]);

  const handleSubmit = (publish) => {
    const payload = normalizePostPayload({
      ...form,
      isPublished: publish ? true : form.isPublished,
    });
    const validation = blogService.validatePostData(payload);
    if (!validation.isValid) {
      window.alert(validation.errors.join('\n'));
      return;
    }
    localStorage.removeItem(draftKey);
    onSave(payload, publish);
  };

  const metaCharCount = (text, max = 160) => ({
    count: (text || '').length,
    max,
    ok: (text || '').length <= max,
  });

  return (
    <div className="blog-post-editor">
      <header className="bpe-header">
        <div className="bpe-header-left">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
            ← Back to posts
          </button>
          <h2>{isEditing ? 'Edit post' : 'New post'}</h2>
          {draftSavedAt && (
            <span className="bpe-draft-hint">Draft saved {new Date(draftSavedAt).toLocaleTimeString()}</span>
          )}
        </div>
        <div className="bpe-header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => handleSubmit(false)} disabled={saving}>
            Save draft
          </button>
          <button type="button" className="btn btn-primary" onClick={() => handleSubmit(true)} disabled={saving}>
            {saving ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </header>

      <nav className="bpe-steps" aria-label="Editor steps">
        {EDITOR_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`bpe-step ${step === s.id ? 'active' : ''}`}
            onClick={() => setStep(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="bpe-layout">
        <div className="bpe-main">
          {step === 'basics' && (
            <section className="bpe-panel">
              <h3>Post basics</h3>
              <div className="bpe-form-grid">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => updateForm({ categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameAL || cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>URL slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => updateForm({ slug: e.target.value })}
                    placeholder="my-blog-post"
                  />
                  <span className="field-hint">/blog/{form.slug || '…'}</span>
                </div>
                <div className="form-group full">
                  <label>Title (Albanian) *</label>
                  <input
                    type="text"
                    value={form.titleAL}
                    onChange={(e) => handleTitleALChange(e.target.value)}
                    placeholder="Post title"
                  />
                </div>
                <div className="form-group">
                  <label>Title (English)</label>
                  <input
                    type="text"
                    value={form.titleEN}
                    onChange={(e) => updateForm({ titleEN: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Title (Italian)</label>
                  <input
                    type="text"
                    value={form.titleIT}
                    onChange={(e) => updateForm({ titleIT: e.target.value })}
                  />
                </div>
              </div>
              <button type="button" className="btn btn-link" onClick={copyFromAlbanian}>
                Copy Albanian → EN & IT
              </button>
            </section>
          )}

          <section
            className={`bpe-panel bpe-panel--content${step === 'content' ? '' : ' bpe-panel--hidden'}`}
            aria-hidden={step !== 'content'}
          >
              <div className="bpe-panel-head">
                <h3>Content</h3>
                <div className="bpe-lang-tabs">
                  {CONTENT_LANGS.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      className={contentLang === lang.id ? 'active' : ''}
                      onClick={() => setContentLang(lang.id)}
                    >
                      {lang.flag} {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Excerpt ({contentLang})</label>
                <textarea
                  rows={2}
                  value={form[langField('excerpt')]}
                  onChange={(e) => updateForm({ [langField('excerpt')]: e.target.value })}
                  placeholder="Short summary for cards and search…"
                />
                <button type="button" className="btn btn-link" onClick={autoFillExcerpts}>
                  Auto-generate all excerpts from content
                </button>
              </div>
              <div className="form-group">
                <label>Body ({contentLang}) *</label>
                <RichTextEditor
                  key={`editor-${contentLang}`}
                  value={form[langField('content')]}
                  onChange={(html) => updateForm({ [langField('content')]: html })}
                  placeholder={`Write in ${contentLang}…`}
                  minHeight={360}
                />
              </div>
            </section>

          {step === 'seo' && (
            <section className="bpe-panel">
              <h3>SEO & featured image</h3>
              <div className="bpe-featured-upload">
                {form.featuredImageUrl ? (
                  <img src={form.featuredImageUrl} alt={form.featuredImageAlt || 'Featured'} className="bpe-featured-preview" />
                ) : (
                  <div className="bpe-featured-placeholder">No featured image</div>
                )}
                <div className="bpe-featured-controls">
                  <input
                    type="url"
                    placeholder="Image URL (https://ucarecdn.com/…)"
                    value={form.featuredImageUrl}
                    onChange={(e) => updateForm({ featuredImageUrl: e.target.value })}
                  />
                  <label className="btn btn-secondary btn-sm">
                    {uploadingImage ? 'Uploading…' : 'Upload image'}
                    <input type="file" accept="image/*" hidden onChange={handleFeaturedUpload} />
                  </label>
                  <input
                    type="text"
                    placeholder="Alt text for accessibility"
                    value={form.featuredImageAlt}
                    onChange={(e) => updateForm({ featuredImageAlt: e.target.value })}
                  />
                </div>
              </div>
              {CONTENT_LANGS.map((lang) => {
                const metaDesc = form[`metaDescription${lang.id}`];
                const meta = metaCharCount(metaDesc);
                return (
                  <div key={lang.id} className="bpe-seo-block">
                    <h4>{lang.flag} {lang.label}</h4>
                    <div className="form-group">
                      <label>
                        Meta description
                        <span className={meta.ok ? 'char-ok' : 'char-warn'}>
                          {meta.count}/{meta.max}
                        </span>
                      </label>
                      <textarea
                        rows={2}
                        value={metaDesc}
                        onChange={(e) => updateForm({ [`metaDescription${lang.id}`]: e.target.value })}
                        placeholder="Shown in Google search results…"
                      />
                    </div>
                    <div className="form-group">
                      <label>Keywords (comma-separated)</label>
                      <input
                        type="text"
                        value={form[`metaKeywords${lang.id}`]}
                        onChange={(e) => updateForm({ [`metaKeywords${lang.id}`]: e.target.value })}
                      />
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {step === 'publish' && (
            <section className="bpe-panel">
              <h3>Publish settings</h3>
              <div className="bpe-publish-options">
                <label className="bpe-check">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => updateForm({ isPublished: e.target.checked })}
                  />
                  <span>
                    <strong>Published</strong>
                    <small>Visible on the public blog</small>
                  </span>
                </label>
                <label className="bpe-check">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => updateForm({ isFeatured: e.target.checked })}
                  />
                  <span>
                    <strong>Featured</strong>
                    <small>Highlight on the blog homepage</small>
                  </span>
                </label>
                <div className="form-group">
                  <label>Display order</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => updateForm({ displayOrder: parseInt(e.target.value, 10) || 0 })}
                  />
                  <span className="field-hint">Lower numbers appear first</span>
                </div>
              </div>
              <div className="bpe-summary">
                <h4>Summary</h4>
                <ul>
                  <li>
                    <strong>Title:</strong> {form.titleAL || '—'}
                  </li>
                  <li>
                    <strong>Words (AL):</strong> {stripHtml(form.contentAL).split(/\s+/).filter(Boolean).length}
                  </li>
                  <li>
                    <strong>Status:</strong> {form.isPublished ? 'Published' : 'Draft'}
                  </li>
                </ul>
              </div>
            </section>
          )}
        </div>

        <aside className="bpe-preview">
          <div className="bpe-preview-head">
            <h3>Live preview</h3>
            <select value={previewLang} onChange={(e) => setPreviewLang(e.target.value)}>
              {CONTENT_LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <article className="bpe-preview-card">
            {previewPost.image && (
              <img src={previewPost.image} alt="" className="bpe-preview-image" />
            )}
            <div className="bpe-preview-body">
              <h1>{previewPost.title || 'Untitled post'}</h1>
              {previewPost.excerpt && <p className="bpe-preview-excerpt">{previewPost.excerpt}</p>}
              <div
                className="bpe-preview-content post-content blog-article-body"
                dangerouslySetInnerHTML={{ __html: previewPost.content || '<p><em>Start writing…</em></p>' }}
              />
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}

export default BlogPostEditor;

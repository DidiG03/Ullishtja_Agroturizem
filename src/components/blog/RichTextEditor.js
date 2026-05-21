import React, { useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react';
import blogService from '../../services/blogService';
import {
  buildImageBlock,
  findFigureFromNode,
  getFigureAlignment,
  setFigureAlignment,
  normalizeContentHtml,
  IMAGE_ALIGNMENTS,
} from './blogImageUtils';
import './blogContentImages.css';

const FONT_FAMILIES = [
  { id: 'default', label: 'Font', value: '' },
  { id: 'inter', label: 'Inter', value: "'Inter', 'Helvetica Neue', sans-serif" },
  { id: 'playfair', label: 'Playfair', value: "'Playfair Display', Georgia, serif" },
  { id: 'cormorant', label: 'Cormorant', value: "'Cormorant Garamond', Georgia, serif" },
  { id: 'georgia', label: 'Georgia', value: 'Georgia, serif' },
];

const FONT_SIZES = [
  { id: 'default', label: 'Size', value: '' },
  { id: 'sm', label: 'Small', value: '0.875rem' },
  { id: 'md', label: 'Normal', value: '1rem' },
  { id: 'lg', label: 'Large', value: '1.25rem' },
  { id: 'xl', label: 'Extra large', value: '1.5rem' },
  { id: 'xxl', label: 'Title', value: '1.75rem' },
];

const STYLE_ACTIONS = [
  { cmd: 'bold', label: 'B', title: 'Bold' },
  { cmd: 'italic', label: 'I', title: 'Italic', style: { fontStyle: 'italic' } },
  { cmd: 'underline', label: 'U', title: 'Underline', style: { textDecoration: 'underline' } },
];

const BLOCK_ACTIONS = [
  { cmd: 'formatBlock', arg: 'h2', label: 'H2', title: 'Heading 2' },
  { cmd: 'formatBlock', arg: 'h3', label: 'H3', title: 'Heading 3' },
];

const LIST_ACTIONS = [
  { cmd: 'insertUnorderedList', label: '•', title: 'Bullet list' },
  { cmd: 'insertOrderedList', label: '1.', title: 'Numbered list' },
];

function ToolbarButton({ action, onRun }) {
  return (
    <button
      type="button"
      className="rte-btn"
      title={action.title}
      style={action.style}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onRun(action.cmd, action.arg)}
    >
      {action.label}
    </button>
  );
}

function isEmptyEditorHtml(html = '') {
  const normalized = normalizeContentHtml(html);
  if (!normalized) return true;
  const text = normalized.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();
  return !text;
}

function RichTextEditor({ value, onChange, placeholder = 'Write your story…', minHeight = 280 }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const savedRangeRef = useRef(null);
  const lastValueRef = useRef(null);
  const lastEmittedRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const emitTimerRef = useRef(null);
  const isComposingRef = useRef(false);
  const [selectedFigure, setSelectedFigure] = useState(null);
  const [selectedAlign, setSelectedAlign] = useState('center');
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const readEditorHtml = useCallback(() => {
    if (!editorRef.current) return '';
    return normalizeContentHtml(editorRef.current.innerHTML);
  }, []);

  const pushChangeToParent = useCallback(() => {
    if (!editorRef.current || !onChangeRef.current) return;
    const html = readEditorHtml();
    lastValueRef.current = html;
    if (html === lastEmittedRef.current) return;
    lastEmittedRef.current = html;
    onChangeRef.current(html);
  }, [readEditorHtml]);

  const flushChange = useCallback(() => {
    if (emitTimerRef.current) {
      clearTimeout(emitTimerRef.current);
      emitTimerRef.current = null;
    }
    pushChangeToParent();
  }, [pushChangeToParent]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    if (emitTimerRef.current) clearTimeout(emitTimerRef.current);
    emitTimerRef.current = setTimeout(() => {
      emitTimerRef.current = null;
      pushChangeToParent();
    }, 200);
  }, [pushChangeToParent]);

  const flushChangeRef = useRef(flushChange);
  flushChangeRef.current = flushChange;

  useEffect(
    () => () => {
      if (emitTimerRef.current) clearTimeout(emitTimerRef.current);
      flushChangeRef.current();
    },
    []
  );

  const insertHtmlAtCursor = useCallback(
    (html) => {
      editorRef.current?.focus();
      const sel = window.getSelection();
      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const fragment = range.createContextualFragment(html);
        range.insertNode(fragment);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        document.execCommand('insertHTML', false, html);
      }
      emitChange();
    },
    [emitChange]
  );

  const insertImage = useCallback(
    async (src, alt = '', align = 'center') => {
      if (!src) return;
      const block = buildImageBlock(src, alt, align);
      insertHtmlAtCursor(`${block}<p><br></p>`);
    },
    [insertHtmlAtCursor]
  );

  const insertImageFromFile = useCallback(
    async (file) => {
      if (!file?.type?.startsWith('image/')) return;
      try {
        const alt =
          window.prompt('Image description (alt text)', file.name.replace(/\.[^.]+$/, '')) || '';
        const result = await blogService.uploadImage(file, { altText: alt });
        const url = result?.data?.url;
        if (!url) {
          throw new Error('Upload did not return an image URL');
        }
        await insertImage(url, alt, 'center');
      } catch (err) {
        window.alert(err.message || 'Failed to upload image');
      }
    },
    [insertImage]
  );

  const insertImageFromUrl = useCallback(() => {
    const url = window.prompt('Image URL (https://… or Uploadcare CDN)');
    if (!url?.trim()) return;
    const alt = window.prompt('Alt text (for accessibility)', '') || '';
    insertImage(url.trim(), alt, 'center');
  }, [insertImage]);

  // Initialize editor HTML once on mount (language switches remount via key)
  useLayoutEffect(() => {
    if (!editorRef.current) return;
    const external = normalizeContentHtml(value || '');
    editorRef.current.innerHTML = external;
    lastValueRef.current = external;
    lastEmittedRef.current = external;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when value changes externally while editor is not focused
  useEffect(() => {
    if (!editorRef.current) return;
    const external = normalizeContentHtml(value || '');
    if (external === lastValueRef.current) return;
    if (
      document.activeElement === editorRef.current ||
      editorRef.current.contains(document.activeElement)
    ) {
      return;
    }
    editorRef.current.innerHTML = external;
    lastValueRef.current = external;
    lastEmittedRef.current = external;
  }, [value]);

  const handleBlur = useCallback(() => {
    if (!editorRef.current) return;
    const html = readEditorHtml();
    const propHtml = normalizeContentHtml(value || '');
    if (isEmptyEditorHtml(html) && !isEmptyEditorHtml(propHtml)) return;
    flushChange();
  }, [flushChange, readEditorHtml, value]);

  const clearFigureSelection = useCallback(() => {
    editorRef.current?.querySelectorAll('.blog-figure.is-selected').forEach((el) => {
      el.classList.remove('is-selected');
    });
    setSelectedFigure(null);
  }, []);

  const selectFigure = useCallback((figure) => {
    clearFigureSelection();
    if (!figure) return;
    figure.classList.add('is-selected');
    setSelectedFigure(figure);
    setSelectedAlign(getFigureAlignment(figure));
  }, [clearFigureSelection]);

  const handleEditorClick = (e) => {
    const figure = findFigureFromNode(e.target, editorRef.current);
    if (figure) {
      e.preventDefault();
      selectFigure(figure);
    } else {
      clearFigureSelection();
    }
  };

  const applyAlignment = (align) => {
    if (!selectedFigure) return;
    setFigureAlignment(selectedFigure, align);
    setSelectedAlign(align);
    emitChange();
  };

  const removeSelectedImage = () => {
    selectedFigure?.remove();
    clearFigureSelection();
    emitChange();
  };

  const saveSelection = useCallback(() => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    const saved = savedRangeRef.current;
    if (!editor || !saved) return false;
    editor.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(saved);
    return true;
  }, []);

  const applyInlineStyle = useCallback(
    (styles) => {
      const editor = editorRef.current;
      if (!editor) return;

      if (!restoreSelection()) {
        editor.focus();
      }

      const sel = window.getSelection();
      if (!sel?.rangeCount) return;

      const range = sel.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) return;

      const styleEntries = Object.entries(styles);
      if (!styleEntries.length) return;

      const span = document.createElement('span');
      styleEntries.forEach(([key, val]) => {
        span.style[key] = val;
      });

      if (range.collapsed) {
        span.appendChild(document.createTextNode('\u200b'));
        range.insertNode(span);
        const textNode = span.firstChild;
        range.setStart(textNode, 1);
        range.collapse(true);
      } else {
        try {
          range.surroundContents(span);
        } catch {
          const fragment = range.extractContents();
          span.appendChild(fragment);
          range.insertNode(span);
        }
        range.selectNodeContents(span);
        range.collapse(false);
      }

      sel.removeAllRanges();
      sel.addRange(range);
      emitChange();
    },
    [emitChange, restoreSelection]
  );

  const applyFontFamily = useCallback(
    (fontValue) => {
      applyInlineStyle({ fontFamily: fontValue || 'inherit' });
    },
    [applyInlineStyle]
  );

  const applyFontSize = useCallback(
    (sizeValue) => {
      applyInlineStyle({ fontSize: sizeValue || 'inherit' });
    },
    [applyInlineStyle]
  );

  const runCommand = (cmd, arg) => {
    if (cmd === 'createLink') {
      const url = window.prompt('Link URL (https://…)');
      if (url) document.execCommand('createLink', false, url);
    } else if (cmd === 'formatBlock' && arg) {
      document.execCommand('formatBlock', false, arg);
    } else if (cmd !== 'separator') {
      document.execCommand(cmd, false, arg || null);
    }
    editorRef.current?.focus();
    emitChange();
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await insertImageFromFile(file);
          return;
        }
      }
    }

    const html = e.clipboardData?.getData('text/html');
    if (html?.includes('<img')) {
      e.preventDefault();
      insertHtmlAtCursor(normalizeContentHtml(html));
      return;
    }

    const text = e.clipboardData?.getData('text/plain');
    if (text) {
      e.preventDefault();
      document.execCommand('insertText', false, text);
      emitChange();
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file?.type?.startsWith('image/')) {
      await insertImageFromFile(file);
      return;
    }
    const html = e.dataTransfer?.getData('text/html');
    if (html) {
      insertHtmlAtCursor(normalizeContentHtml(html));
    }
  };

  return (
    <div className="rich-text-editor">
      {selectedFigure && (
        <div className="rte-image-toolbar" role="toolbar" aria-label="Image placement">
          <span>Image layout:</span>
          {IMAGE_ALIGNMENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={selectedAlign === a.id ? 'active' : ''}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyAlignment(a.id)}
            >
              {a.label}
            </button>
          ))}
          <button type="button" className="danger" onMouseDown={(e) => e.preventDefault()} onClick={removeSelectedImage}>
            Remove
          </button>
        </div>
      )}

      <div
        className="rte-toolbar"
        role="toolbar"
        aria-label="Formatting"
        onMouseDown={(e) => {
          if (e.target.closest('select')) {
            saveSelection();
            return;
          }
          if (e.target.closest('button')) {
            e.preventDefault();
          }
        }}
      >
        <div className="rte-toolbar-group rte-toolbar-group--type">
          <select
            className="rte-select"
            defaultValue=""
            aria-label="Font family"
            onPointerDown={saveSelection}
            onChange={(e) => {
              applyFontFamily(e.target.value);
              e.target.selectedIndex = 0;
            }}
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.id} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            className="rte-select"
            defaultValue=""
            aria-label="Font size"
            onPointerDown={saveSelection}
            onChange={(e) => {
              applyFontSize(e.target.value);
              e.target.selectedIndex = 0;
            }}
          >
            {FONT_SIZES.map((s) => (
              <option key={s.id} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rte-toolbar-divider" aria-hidden />

        <div className="rte-toolbar-group rte-btn-cluster">
          {STYLE_ACTIONS.map((action) => (
            <ToolbarButton key={action.cmd} action={action} onRun={runCommand} />
          ))}
        </div>

        <div className="rte-toolbar-divider" aria-hidden />

        <div className="rte-toolbar-group rte-btn-cluster">
          {BLOCK_ACTIONS.map((action) => (
            <ToolbarButton key={action.cmd + action.arg} action={action} onRun={runCommand} />
          ))}
        </div>

        <div className="rte-toolbar-divider" aria-hidden />

        <div className="rte-toolbar-group rte-btn-cluster">
          {LIST_ACTIONS.map((action) => (
            <ToolbarButton key={action.cmd} action={action} onRun={runCommand} />
          ))}
        </div>

        <div className="rte-toolbar-divider" aria-hidden />

        <div className="rte-toolbar-group rte-btn-cluster">
          <ToolbarButton
            action={{ cmd: 'createLink', label: 'Link', title: 'Insert link' }}
            onRun={runCommand}
          />
        </div>

        <div className="rte-toolbar-spacer" aria-hidden />

        <div className="rte-toolbar-group rte-toolbar-group--media">
          <button
            type="button"
            className="rte-btn rte-btn--media"
            title="Upload image"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </button>
          <button
            type="button"
            className="rte-btn rte-btn--media rte-btn--ghost"
            title="Insert image from URL"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertImageFromUrl}
          >
            URL
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="rte-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) insertImageFromFile(file);
          e.target.value = '';
        }}
      />

      <div
        ref={editorRef}
        className={`rte-content blog-article-body${isDragOver ? ' rte-drop-hint' : ''}`}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{ minHeight }}
        onInput={() => {
          if (!isComposingRef.current) emitChange();
        }}
        onBlur={handleBlur}
        onClick={handleEditorClick}
        onPaste={handlePaste}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
          emitChange();
        }}
      />
      <p className="rte-hint">
        Tip: select text, then choose Font or Size. Click an image to change layout. Drag & drop or paste images into the text.
      </p>
    </div>
  );
}

export default RichTextEditor;

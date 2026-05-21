import React, { useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react';
import {
  buildImageBlock,
  findFigureFromNode,
  getFigureAlignment,
  setFigureAlignment,
  normalizeContentHtml,
  readFileAsDataUrl,
  IMAGE_ALIGNMENTS,
} from './blogImageUtils';
import './blogContentImages.css';

const TOOLBAR_ACTIONS = [
  { cmd: 'bold', label: 'B', title: 'Bold' },
  { cmd: 'italic', label: 'I', title: 'Italic', style: { fontStyle: 'italic' } },
  { cmd: 'underline', label: 'U', title: 'Underline', style: { textDecoration: 'underline' } },
  { cmd: 'separator' },
  { cmd: 'formatBlock', arg: 'h2', label: 'H2', title: 'Heading 2' },
  { cmd: 'formatBlock', arg: 'h3', label: 'H3', title: 'Heading 3' },
  { cmd: 'separator' },
  { cmd: 'insertUnorderedList', label: '• List', title: 'Bullet list' },
  { cmd: 'insertOrderedList', label: '1. List', title: 'Numbered list' },
  { cmd: 'separator' },
  { cmd: 'createLink', label: 'Link', title: 'Insert link' },
];

function isEmptyEditorHtml(html = '') {
  const normalized = normalizeContentHtml(html);
  if (!normalized) return true;
  const text = normalized.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();
  return !text;
}

function RichTextEditor({ value, onChange, placeholder = 'Write your story…', minHeight = 280 }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
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
        const dataUrl = await readFileAsDataUrl(file);
        const alt = window.prompt('Image description (alt text)', file.name.replace(/\.[^.]+$/, '')) || '';
        await insertImage(dataUrl, alt, 'center');
      } catch (err) {
        window.alert(err.message);
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

      <div className="rte-toolbar" role="toolbar" aria-label="Formatting">
        {TOOLBAR_ACTIONS.map((action, i) =>
          action.cmd === 'separator' ? (
            <span key={`sep-${i}`} className="rte-sep" aria-hidden />
          ) : (
            <button
              key={action.cmd + (action.arg || '')}
              type="button"
              className="rte-btn"
              title={action.title}
              style={action.style}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => runCommand(action.cmd, action.arg)}
            >
              {action.label}
            </button>
          )
        )}
        <button
          type="button"
          className="rte-btn"
          title="Upload image — place anywhere in the text"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          🖼 Upload
        </button>
        <button
          type="button"
          className="rte-btn rte-btn-muted"
          title="Insert image from URL"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertImageFromUrl}
        >
          Image URL
        </button>
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
      <p className="rte-hint">Tip: click an image to change layout (left, right, center, full). Drag & drop or paste images into the text.</p>
    </div>
  );
}

export default RichTextEditor;

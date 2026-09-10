import React, { useState, useRef, useEffect } from 'react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiList,
  FiImage,
  FiLink,
  FiCode,
  FiEye,
  FiRotateCcw,
  FiRotateCw,
  FiMaximize2,
  FiMinimize2,
  FiX,
  FiUploadCloud,
  FiInfo,
  FiGrid
} from 'react-icons/fi';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import './WordPadEditor.css';

const WordPadEditor = ({
  value = '',
  onChange,
  placeholder = 'Type your content here...',
  minHeight = '420px',
  folder = 'cms'
}) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value || '');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);

  // Image Modal state
  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageAlign, setImageAlign] = useState('center'); // 'left' | 'center' | 'right' | 'full'
  const [imageUploading, setImageUploading] = useState(false);

  // Link Modal state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Table Modal state
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Saved range for restoring selection when modal closes
  const savedSelectionRef = useRef(null);

  // Keep internal state in sync if external value changes (e.g. initial fetch)
  useEffect(() => {
    if (value !== htmlContent) {
      setHtmlContent(value || '');
      if (editorRef.current && !sourceMode) {
        if (editorRef.current.innerHTML !== (value || '')) {
          editorRef.current.innerHTML = value || '';
        }
      }
    }
  }, [value, sourceMode]);

  // Initial populate of editable div
  useEffect(() => {
    if (editorRef.current && !sourceMode) {
      editorRef.current.innerHTML = htmlContent;
    }
  }, []);

  const saveSelection = () => {
    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        savedSelectionRef.current = sel.getRangeAt(0);
      }
    }
  };

  const restoreSelection = () => {
    if (savedSelectionRef.current && window.getSelection) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const executeCmd = (command, value = null) => {
    if (sourceMode || previewMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const newHtml = editorRef.current.innerHTML;
    setHtmlContent(newHtml);
    if (onChange) onChange(newHtml);
  };

  const handleSourceChange = (e) => {
    const val = e.target.value;
    setHtmlContent(val);
    if (onChange) onChange(val);
  };

  const toggleSourceMode = () => {
    if (!sourceMode) {
      // Switching to code view
      setSourceMode(true);
      setPreviewMode(false);
    } else {
      // Switching back to visual
      setSourceMode(false);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = htmlContent;
        }
      }, 0);
    }
  };

  // Image Upload handler
  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (JPG, PNG, WebP)');
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('Image exceeds maximum recommended size of 5MB');
      return;
    }

    setImageUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await api.post(`/upload?folder=${folder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.success && res.data.data?.url) {
        setImageUrl(res.data.data.url);
        toast.success('Image uploaded successfully!');
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageUrl(e.target.result);
          toast.success('Image attached!');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target.result);
        toast.success('Image attached locally!');
      };
      reader.readAsDataURL(file);
    } finally {
      setImageUploading(false);
    }
  };

  const insertImage = () => {
    if (!imageUrl.trim()) {
      toast.warn('Please provide or upload an image first');
      return;
    }

    restoreSelection();
    if (editorRef.current) {
      editorRef.current.focus();
    }

    let alignStyle = 'display: block; margin: 1.5rem auto; max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);';
    if (imageAlign === 'left') {
      alignStyle = 'float: left; margin: 0.5rem 1.5rem 1rem 0; max-width: 50%; height: auto; border-radius: 6px;';
    } else if (imageAlign === 'right') {
      alignStyle = 'float: right; margin: 0.5rem 0 1rem 1.5rem; max-width: 50%; height: auto; border-radius: 6px;';
    } else if (imageAlign === 'full') {
      alignStyle = 'width: 100%; display: block; margin: 1.5rem 0; border-radius: 6px;';
    }

    const imgTag = `<figure style="margin: 1.5rem 0; text-align: ${imageAlign === 'center' ? 'center' : 'inherit'};"><img src="${imageUrl}" alt="${imageAlt || 'Page Image'}" style="${alignStyle}" />${imageAlt ? `<figcaption style="font-size: 0.82rem; color: #6c757d; margin-top: 0.4rem; font-style: italic; text-align: center;">${imageAlt}</figcaption>` : ''}</figure><p><br></p>`;

    document.execCommand('insertHTML', false, imgTag);
    handleEditorInput();

    // Reset & close modal
    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
    setImageAlign('center');
  };

  const insertLink = () => {
    if (!linkUrl.trim()) {
      toast.warn('Please provide a URL');
      return;
    }
    restoreSelection();
    if (editorRef.current) editorRef.current.focus();

    const textToDisplay = linkText.trim() || linkUrl.trim();
    const linkHtml = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer" style="color: #0d6efd; text-decoration: underline;">${textToDisplay}</a>`;
    document.execCommand('insertHTML', false, linkHtml);
    handleEditorInput();

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const insertTable = () => {
    restoreSelection();
    if (editorRef.current) editorRef.current.focus();

    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; border: 1px solid #dee2e6;"><thead><tr>`;
    for (let c = 1; c <= tableCols; c++) {
      tableHtml += `<th style="border: 1px solid #dee2e6; padding: 10px; background-color: #f8f9fa; font-weight: 600; text-align: left;">Header ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 1; r <= tableRows; r++) {
      tableHtml += `<tr>`;
      for (let c = 1; c <= tableCols; c++) {
        tableHtml += `<td style="border: 1px solid #dee2e6; padding: 10px;">Row ${r}, Col ${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;

    document.execCommand('insertHTML', false, tableHtml);
    handleEditorInput();
    setShowTableModal(false);
  };

  return (
    <div className={`wordpad-container ${isFullscreen ? 'wordpad-fullscreen' : ''}`}>
      {/* WORDPAD RIBBON / TOOLBAR */}
      <div className="wordpad-ribbon">
        {/* Undo / Redo */}
        <div className="wordpad-btn-group">
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Undo (Ctrl+Z)"
            onClick={() => executeCmd('undo')}
            disabled={sourceMode || previewMode}
          >
            <FiRotateCcw />
          </button>
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Redo (Ctrl+Y)"
            onClick={() => executeCmd('redo')}
            disabled={sourceMode || previewMode}
          >
            <FiRotateCw />
          </button>
        </div>

        <div className="wordpad-separator" />

        {/* Style / Heading Select */}
        <div className="wordpad-btn-group">
          <select
            className="wordpad-select"
            title="Format Block"
            disabled={sourceMode || previewMode}
            onChange={(e) => {
              executeCmd('formatBlock', e.target.value);
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>Style...</option>
            <option value="<p>">Normal Paragraph</option>
            <option value="<h1>">Heading 1 (Hero / Main)</option>
            <option value="<h2>">Heading 2 (Section Title)</option>
            <option value="<h3>">Heading 3 (Sub-section)</option>
            <option value="<h4>">Heading 4 (Minor Title)</option>
            <option value="<blockquote>">Quote Block</option>
            <option value="<pre>">Code Block</option>
          </select>

          {/* Font Size Select */}
          <select
            className="wordpad-select"
            title="Font Size"
            disabled={sourceMode || previewMode}
            onChange={(e) => {
              executeCmd('fontSize', e.target.value);
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>Size...</option>
            <option value="2">Small (12px)</option>
            <option value="3">Normal (14px)</option>
            <option value="4">Medium (16px)</option>
            <option value="5">Large (18px)</option>
            <option value="6">X-Large (24px)</option>
            <option value="7">XX-Large (32px)</option>
          </select>
        </div>

        <div className="wordpad-separator" />

        {/* Bold, Italic, Underline, Strike */}
        <div className="wordpad-btn-group">
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Bold (Ctrl+B)"
            onClick={() => executeCmd('bold')}
            disabled={sourceMode || previewMode}
          >
            <FiBold />
          </button>
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Italic (Ctrl+I)"
            onClick={() => executeCmd('italic')}
            disabled={sourceMode || previewMode}
          >
            <FiItalic />
          </button>
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Underline (Ctrl+U)"
            onClick={() => executeCmd('underline')}
            disabled={sourceMode || previewMode}
          >
            <FiUnderline />
          </button>
          <button
            type="button"
            className="wordpad-tool-btn font-monospace"
            title="Strikethrough"
            onClick={() => executeCmd('strikeThrough')}
            disabled={sourceMode || previewMode}
          >
            <del>S</del>
          </button>
        </div>

        <div className="wordpad-separator" />

        {/* Color Pickers */}
        <div className="wordpad-btn-group d-flex align-items-center gap-1">
          <label className="wordpad-color-picker-label" title="Text Color">
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>A</span>
            <input
              type="color"
              defaultValue="#1a1a1a"
              onChange={(e) => executeCmd('foreColor', e.target.value)}
              disabled={sourceMode || previewMode}
            />
          </label>

          <label className="wordpad-color-picker-label" title="Highlight Color">
            <span style={{ fontSize: '0.75rem', background: '#ffe066', padding: '1px 3px', borderRadius: '2px' }}>H</span>
            <input
              type="color"
              defaultValue="#ffff00"
              onChange={(e) => executeCmd('hiliteColor', e.target.value)}
              disabled={sourceMode || previewMode}
            />
          </label>
        </div>

        <div className="wordpad-separator" />

        {/* Alignments */}
        <div className="wordpad-btn-group">
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Align Left"
            onClick={() => executeCmd('justifyLeft')}
            disabled={sourceMode || previewMode}
          >
            <FiAlignLeft />
          </button>
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Align Center"
            onClick={() => executeCmd('justifyCenter')}
            disabled={sourceMode || previewMode}
          >
            <FiAlignCenter />
          </button>
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Align Right"
            onClick={() => executeCmd('justifyRight')}
            disabled={sourceMode || previewMode}
          >
            <FiAlignRight />
          </button>
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Justify"
            onClick={() => executeCmd('justifyFull')}
            disabled={sourceMode || previewMode}
          >
            <FiAlignJustify />
          </button>
        </div>

        <div className="wordpad-separator" />

        {/* Lists & Indent */}
        <div className="wordpad-btn-group">
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Bullet List"
            onClick={() => executeCmd('insertUnorderedList')}
            disabled={sourceMode || previewMode}
          >
            <FiList />
          </button>
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Numbered List"
            onClick={() => executeCmd('insertOrderedList')}
            disabled={sourceMode || previewMode}
          >
            1.
          </button>
        </div>

        <div className="wordpad-separator" />

        {/* Insert Elements */}
        <div className="wordpad-btn-group">
          <button
            type="button"
            className="wordpad-tool-btn wordpad-insert-highlight"
            title="Insert Image (Upload or URL with Size Placeholder)"
            onClick={() => {
              saveSelection();
              setShowImageModal(true);
            }}
            disabled={sourceMode || previewMode}
          >
            <FiImage />
            <span className="btn-label-text">Insert Image</span>
          </button>
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Insert Link"
            onClick={() => {
              saveSelection();
              setShowLinkModal(true);
            }}
            disabled={sourceMode || previewMode}
          >
            <FiLink />
          </button>
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Insert Table"
            onClick={() => {
              saveSelection();
              setShowTableModal(true);
            }}
            disabled={sourceMode || previewMode}
          >
            <FiGrid />
          </button>
          <button
            type="button"
            className="wordpad-tool-btn"
            title="Horizontal Divider"
            onClick={() => executeCmd('insertHorizontalRule')}
            disabled={sourceMode || previewMode}
          >
            —
          </button>
        </div>

        <div className="wordpad-separator ms-auto" />

        {/* View Modes & Fullscreen */}
        <div className="wordpad-btn-group">
          <button
            type="button"
            className={`wordpad-tool-btn ${sourceMode ? 'active' : ''}`}
            title="HTML Source Code Mode"
            onClick={toggleSourceMode}
          >
            <FiCode />
            <span className="btn-label-text">&lt;/&gt; Code</span>
          </button>
          <button
            type="button"
            className={`wordpad-tool-btn ${previewMode ? 'active' : ''}`}
            title="Live Preview"
            onClick={() => {
              setPreviewMode(!previewMode);
              if (sourceMode) setSourceMode(false);
            }}
          >
            <FiEye />
            <span className="btn-label-text">Preview</span>
          </button>
          <button
            type="button"
            className="wordpad-tool-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
        </div>
      </div>

      {/* RULER / STATUS BAR */}
      <div className="wordpad-ruler">
        <div className="ruler-notch-container">
          <span className="ruler-notch">1</span>
          <span className="ruler-notch">2</span>
          <span className="ruler-notch">3</span>
          <span className="ruler-notch">4</span>
          <span className="ruler-notch">5</span>
          <span className="ruler-notch">6</span>
          <span className="ruler-notch">7</span>
          <span className="ruler-notch">8</span>
        </div>
        <span className="wordpad-mode-indicator">
          {sourceMode ? 'HTML Source View' : previewMode ? 'Live Preview View' : 'Rich Text Editor (WordPad Style)'}
        </span>
      </div>

      {/* DOCUMENT CANVAS / PAPER */}
      <div className="wordpad-canvas-wrap" style={{ minHeight }}>
        {sourceMode ? (
          <textarea
            className="wordpad-source-code-view"
            value={htmlContent}
            onChange={handleSourceChange}
            placeholder="<!-- Write custom HTML code here -->"
            spellCheck="false"
          />
        ) : previewMode ? (
          <div className="wordpad-paper wordpad-preview-view">
            <div className="preview-badge">LIVE PREVIEW</div>
            <div
              className="wordpad-preview-body"
              dangerouslySetInnerHTML={{ __html: htmlContent || '<p style="color:#888;">Nothing to preview yet...</p>' }}
            />
          </div>
        ) : (
          <div className="wordpad-paper-outer">
            <div
              ref={editorRef}
              className="wordpad-paper wordpad-contenteditable"
              contentEditable
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
              data-placeholder={placeholder}
              suppressContentEditableWarning
            />
          </div>
        )}
      </div>

      {/* FOOTER BAR */}
      <div className="wordpad-footer-bar">
        <span>WordPad Content Editable Engine</span>
        <span>
          Chars: {htmlContent.replace(/<[^>]*>/g, '').length} | HTML bytes: {htmlContent.length}
        </span>
      </div>

      {/* MODAL: INSERT IMAGE */}
      {showImageModal && (
        <div className="wordpad-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="wordpad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wordpad-modal-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <FiImage /> Insert Image Into Document
              </h5>
              <button
                type="button"
                className="wordpad-modal-close"
                onClick={() => setShowImageModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="wordpad-modal-body">
              {/* SIZE / DIMENSION PLACEHOLDER BANNER */}
              <div className="wordpad-dimension-placeholder mb-3">
                <FiInfo className="placeholder-icon flex-shrink-0" />
                <div>
                  <strong>Recommended Dimensions & Sizing:</strong>
                  <div className="small text-muted mt-0.5">
                    • In-content illustration: <strong>800 x 600 px (4:3)</strong> or <strong>1200 x 800 px (3:2)</strong><br />
                    • Maximum file weight: <strong>5MB (JPG, PNG, WebP)</strong><br />
                    • Auto-compressed and optimized on upload.
                  </div>
                </div>
              </div>

              {/* Tabs: Upload vs URL */}
              <div className="btn-group w-100 mb-3" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${imageTab === 'upload' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => setImageTab('upload')}
                >
                  Upload File From Computer
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${imageTab === 'url' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => setImageTab('url')}
                >
                  Paste External Image URL
                </button>
              </div>

              {imageTab === 'upload' ? (
                <div className="mb-3">
                  <div
                    className="wordpad-dropzone text-center p-3 mb-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiUploadCloud size={28} className="text-muted mb-2" />
                    <p className="small mb-1 font-weight-bold">
                      {imageUploading ? 'Uploading & optimizing...' : 'Click to select image file'}
                    </p>
                    <span className="badge bg-light text-dark border">
                      Placeholder: Max 1200x800 px, Max 5MB
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="d-none"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {imageUrl && (
                    <div className="text-center mt-2">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        style={{ maxHeight: '140px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-3">
                  <label className="small font-weight-bold mb-1">Image URL</label>
                  <input
                    type="url"
                    className="form-control form-control-sm"
                    placeholder="https://example.com/images/banner.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  {imageUrl && (
                    <div className="text-center mt-2">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        style={{ maxHeight: '140px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Alt Text / Caption */}
              <div className="mb-3">
                <label className="small font-weight-bold mb-1">Image Caption / Alt Text (Optional)</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Master tailor stitching Italian linen cuff"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>

              {/* Alignment */}
              <div className="mb-2">
                <label className="small font-weight-bold mb-1">Image Alignment</label>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className={`btn btn-sm flex-fill ${imageAlign === 'center' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setImageAlign('center')}
                  >
                    Center Block
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm flex-fill ${imageAlign === 'full' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setImageAlign('full')}
                  >
                    Full Width (100%)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm flex-fill ${imageAlign === 'left' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setImageAlign('left')}
                  >
                    Float Left
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm flex-fill ${imageAlign === 'right' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setImageAlign('right')}
                  >
                    Float Right
                  </button>
                </div>
              </div>
            </div>

            <div className="wordpad-modal-footer">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowImageModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={insertImage}
                disabled={!imageUrl || imageUploading}
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSERT LINK */}
      {showLinkModal && (
        <div className="wordpad-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="wordpad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wordpad-modal-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <FiLink /> Insert Hyperlink
              </h5>
              <button
                type="button"
                className="wordpad-modal-close"
                onClick={() => setShowLinkModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="wordpad-modal-body">
              <div className="mb-3">
                <label className="small font-weight-bold mb-1">Target URL</label>
                <input
                  type="url"
                  className="form-control form-control-sm"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="mb-2">
                <label className="small font-weight-bold mb-1">Display Text (Optional)</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Read Our Full Return Policy"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
              </div>
            </div>
            <div className="wordpad-modal-footer">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowLinkModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={insertLink}
                disabled={!linkUrl}
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSERT TABLE */}
      {showTableModal && (
        <div className="wordpad-modal-overlay" onClick={() => setShowTableModal(false)}>
          <div className="wordpad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wordpad-modal-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <FiGrid /> Insert Data Table
              </h5>
              <button
                type="button"
                className="wordpad-modal-close"
                onClick={() => setShowTableModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="wordpad-modal-body">
              <div className="row g-3 mb-2">
                <div className="col-6">
                  <label className="small font-weight-bold mb-1">Rows (1 - 20)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="form-control form-control-sm"
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="col-6">
                  <label className="small font-weight-bold mb-1">Columns (1 - 8)</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    className="form-control form-control-sm"
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
            </div>
            <div className="wordpad-modal-footer">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowTableModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={insertTable}
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordPadEditor;


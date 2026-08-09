import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiImage, FiVideo, FiX, FiCheckCircle, FiFilm, FiInfo } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import './FileUploadInput.css';

const getDimensionHint = (type, folder, customHint) => {
  if (customHint) return customHint;
  if (type === 'video') {
    return 'Recommended: 1920 x 1080 px (16:9 Full HD Video, Max 50MB)';
  }
  switch (folder) {
    case 'products':
      return 'Recommended: 800 x 1000 px (4:5 Aspect Ratio, Max 10MB)';
    case 'categories':
      return 'Recommended: 600 x 600 px (1:1 Square Ratio, Max 10MB)';
    case 'hero':
      return 'Recommended: 1920 x 800 px (16:9 Landscape Banner, Max 10MB)';
    case 'combos':
      return 'Recommended: 1200 x 800 px (3:2 Aspect Ratio, Max 10MB)';
    case 'brands':
      return 'Recommended: 400 x 400 px (1:1 Square Logo, Max 10MB)';
    case 'occasions':
      return 'Recommended: 800 x 600 px (4:3 Aspect Ratio, Max 10MB)';
    case 'thumbnails':
      return 'Recommended: 1200 x 675 px (16:9 Cover, Max 10MB)';
    default:
      return 'Recommended: 800 x 800 px (Max 10MB)';
  }
};

const FileUploadInput = ({
  value = '',
  onChange,
  type = 'image', // 'image' or 'video'
  folder = 'general', // 'products', 'categories', 'videos', 'hero', 'thumbnails'
  label = '',
  placeholder = '',
  recommendedSize = '',
  required = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const dimensionHint = getDimensionHint(type, folder, recommendedSize);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // 1. Validate File Type
    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WebP, GIF)');
      return;
    }
    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please select a valid video file (MP4, WebM, MOV)');
      return;
    }

    // 2. Validate File Size
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

    if (type === 'image' && file.size > MAX_IMAGE_SIZE) {
      toast.error(`Image file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB`);
      return;
    }
    if (type === 'video' && file.size > MAX_VIDEO_SIZE) {
      toast.error(`Video file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 50MB`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await api.post(`/upload?folder=${folder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success && res.data.data?.url) {
        const uploadedUrl = res.data.data.url;
        onChange(uploadedUrl);
        toast.success(`${type === 'video' ? 'Video' : 'Image'} uploaded successfully!`);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          onChange(e.target.result);
          toast.success(`${type === 'video' ? 'Video' : 'Image'} attached successfully!`);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target.result);
        toast.success(`${type === 'video' ? 'Video' : 'Image'} loaded successfully!`);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="file-upload-input-group">
      <div className="d-flex align-items-center justify-content-between mb-1">
        {label && <label className="admin-form-label mb-0">{label}</label>}
        <span className="dimension-hint-badge" title="File limits & optimization range">
          <FiInfo className="me-1" /> {dimensionHint}
        </span>
      </div>

      {/* Media Preview Box (if value exists) */}
      {value && (
        <div className="media-preview-card mb-2">
          {type === 'video' ? (
            <div className="position-relative video-preview-wrapper">
              <video 
                src={value} 
                className="uploaded-video-preview" 
                controls 
                preload="metadata"
              />
              <button 
                type="button" 
                className="remove-media-btn" 
                onClick={() => onChange('')}
                title="Remove video"
              >
                <FiX />
              </button>
            </div>
          ) : (
            <div className="position-relative image-preview-wrapper">
              <img 
                src={value} 
                alt="Uploaded media" 
                className="uploaded-image-preview" 
              />
              <button 
                type="button" 
                className="remove-media-btn" 
                onClick={() => onChange('')}
                title="Remove image"
              >
                <FiX />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dual Input Controls: URL text field + Upload button */}
      <div className="d-flex align-items-center gap-2">
        <input 
          type="text" 
          className="admin-input flex-grow-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || (type === 'video' ? 'Paste Video URL or click Upload (Max 50MB)...' : 'Paste Image URL or click Upload (Max 10MB)...')}
          required={required}
        />

        <button 
          type="button"
          className="btn-admin-outline d-flex align-items-center gap-1 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title={`Upload ${type} file to media storage (${folder}/)`}
        >
          {uploading ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status" />
              <span>Optimizing...</span>
            </>
          ) : (
            <>
              <FiUploadCloud />
              <span>Upload {type === 'video' ? 'Video' : 'File'}</span>
            </>
          )}
        </button>

        <input 
          ref={fileInputRef}
          type="file"
          className="d-none"
          accept={type === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/gif'}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
      </div>

      {/* Dropzone Area */}
      {!value && (
        <div 
          className={`file-dropzone mt-2 ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center py-2">
            <FiUploadCloud className="dropzone-icon mb-1" />
            <p className="small mb-0 text-dark font-weight-bold">
              Click or drag & drop <strong>{type === 'video' ? 'MP4/WebM video (Max 50MB)' : 'Image JPG/PNG/WebP (Max 10MB)'}</strong>
            </p>
            <span className="folder-badge me-2">Storage Folder: /{folder}</span>
            <span className="text-muted extra-small d-block mt-1">{dimensionHint}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadInput;

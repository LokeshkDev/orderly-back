import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiX, FiLoader, FiPlus, FiLink } from 'react-icons/fi';
import { uploadImage, uploadImages } from '../../services/api';
import { toast } from 'react-toastify';
import './ImageUploader.css';

const ImageUploader = ({ 
  images = [], 
  onChange,
  onUpload, 
  multiple = true,
  maxImages = 10
}) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const currentImages = Array.isArray(images) ? images : [];

  const updateImagesList = (newList) => {
    if (typeof onChange === 'function') onChange(newList);
    if (typeof onUpload === 'function') onUpload(newList);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    if (multiple && currentImages.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    setIsUploading(true);
    try {
      if (files.length > 1) {
        const res = await uploadImages(files);
        if (res.data?.success && Array.isArray(res.data.urls)) {
          updateImagesList([...currentImages, ...res.data.urls]);
          toast.success(`${res.data.urls.length} images uploaded`);
        } else {
          // Fallback object URLs for dev preview
          const localUrls = Array.from(files).map(f => URL.createObjectURL(f));
          updateImagesList([...currentImages, ...localUrls]);
          toast.success(`${localUrls.length} images added`);
        }
      } else {
        const res = await uploadImage(files[0]);
        if (res.data?.success && res.data.url) {
          updateImagesList(multiple ? [...currentImages, res.data.url] : [res.data.url]);
          toast.success('Image uploaded');
        } else {
          const localUrl = URL.createObjectURL(files[0]);
          updateImagesList(multiple ? [...currentImages, localUrl] : [localUrl]);
          toast.success('Image added');
        }
      }
    } catch (error) {
      const localUrls = Array.from(files).map(f => URL.createObjectURL(f));
      updateImagesList([...currentImages, ...localUrls]);
      toast.info('Added image preview');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    updateImagesList([...currentImages, urlInput.trim()]);
    setUrlInput('');
    setShowUrlInput(false);
    toast.success('Image URL added');
  };

  const removeImage = (indexToRemove) => {
    const newImages = currentImages.filter((_, index) => index !== indexToRemove);
    updateImagesList(newImages);
  };

  return (
    <div className="image-uploader-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="text-muted small">Uploaded Photos ({currentImages.length}/{maxImages})</span>
        <button 
          type="button" 
          className="btn btn-sm btn-outline-secondary text-light py-0 px-2" 
          style={{ fontSize: '0.75rem' }}
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          <FiLink /> {showUrlInput ? 'Hide URL Input' : '+ Add Image URL'}
        </button>
      </div>

      {showUrlInput && (
        <div className="d-flex gap-2 mb-3">
          <input 
            type="url" 
            className="form-control form-control-sm bg-dark text-white border-secondary" 
            placeholder="Paste image URL (https://images.unsplash.com/...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button type="button" className="btn btn-sm btn-primary px-3" onClick={handleAddUrl}>
            Add
          </button>
        </div>
      )}

      <div 
        className={`image-dropzone ${dragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        
        <div className="dropzone-content py-3 text-center">
          {isUploading ? (
            <div className="d-flex flex-column align-items-center gap-2">
              <FiLoader className="upload-spinner text-accent-red" size={28} />
              <p className="mb-0 text-white small">Uploading image(s)...</p>
            </div>
          ) : (
            <div className="d-flex flex-column align-items-center gap-2">
              <FiUploadCloud size={30} className="text-accent-red" />
              <p className="mb-0 text-white small font-weight-bold">Click or drag multiple photos here</p>
              <span className="text-muted small">PNG, JPG, WEBP (Max {maxImages})</span>
            </div>
          )}
        </div>
      </div>

      {currentImages && currentImages.length > 0 && (
        <div className="image-previews d-flex flex-wrap gap-2 mt-3">
          {currentImages.map((url, index) => (
            <div key={index} className="image-preview-item position-relative border rounded overflow-hidden" style={{ width: '85px', height: '85px' }}>
              <img src={url} alt={`Preview ${index}`} className="w-100 h-100 object-fit-cover" />
              <button 
                type="button" 
                className="remove-image-btn position-absolute top-0 end-0 bg-danger text-white border-0 p-1"
                style={{ borderRadius: '0 0 0 4px', lineHeight: 1 }}
                onClick={() => removeImage(index)}
                title="Remove image"
              >
                <FiX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

/**
 * High-performance client-side image compression utility
 * Resizes large camera/phone photos (5MB - 20MB) down to 200KB - 600KB WebP
 * before transmission, preventing HTTP 413 (Request Entity Too Large) from Nginx/reverse proxies.
 */
export const compressImageBeforeUpload = async (file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) => {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // Preserve animated GIFs and vector SVGs as-is
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  // If already under 600KB, no need for heavy compression
  if (file.size <= 600 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file); // Fallback on failure
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate downscaled dimensions preserving aspect ratio
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file);
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Try converting to modern WebP first
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const baseName = file.name.replace(/\.[^/.]+$/, '');
                const compressedFile = new File([blob], `${baseName}.webp`, {
                  type: 'image/webp',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                // If WebP is unsupported or larger, try JPEG
                canvas.toBlob(
                  (jpegBlob) => {
                    if (jpegBlob && jpegBlob.size < file.size) {
                      const baseName = file.name.replace(/\.[^/.]+$/, '');
                      const compressedJpeg = new File([jpegBlob], `${baseName}.jpg`, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                      });
                      resolve(compressedJpeg);
                    } else {
                      resolve(file);
                    }
                  },
                  'image/jpeg',
                  quality
                );
              }
            },
            'image/webp',
            quality
          );
        } catch (err) {
          console.warn('Client-side compression skipped:', err);
          resolve(file);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

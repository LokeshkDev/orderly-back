import React, { useState, useRef, useEffect } from 'react';

/**
 * Optimized Image Component
 * - Automatic WebP/AVIF format selection
 * - Responsive images with srcset
 * - Lazy loading with IntersectionObserver
 * - Blur-up placeholder (LQIP)
 * - Proper sizing to prevent CLS
 * - Error fallback
 */
const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  width,
  height,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 82,
  placeholder = 'blur', // 'blur' | 'color' | 'none'
  placeholderColor = '#1a1a1a',
  blurDataURL,
  onLoad,
  onError,
  objectFit = 'cover',
  objectPosition = 'center',
  loading, // 'lazy' | 'eager' | undefined (auto)
  fetchPriority, // 'high' | 'low' | 'auto'
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Auto-determine loading strategy
  const effectiveLoading = loading ?? (priority ? 'eager' : 'lazy');
  const effectiveFetchPriority = fetchPriority ?? (priority ? 'high' : 'auto');

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || effectiveLoading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px 0px', // Start loading 100px before visible
        threshold: 0.01
      }
    );

    observerRef.current = observer;
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority, effectiveLoading]);

  // Generate responsive srcset
  const generateSrcSet = (baseSrc) => {
    if (!baseSrc) return '';
    
    // If external URL or already optimized, return as-is
    if (baseSrc.startsWith('http') && !baseSrc.includes('orderly')) {
      return baseSrc;
    }
    
    // For local/optimized images, generate responsive sizes
    const widths = [320, 480, 768, 1024, 1280, 1536, 1920];
    const targetWidth = width || 1920;
    
    return widths
      .filter(w => w <= targetWidth * 1.5) // Don't generate larger than needed
      .map(w => {
        const optimizedUrl = getOptimizedUrl(baseSrc, w, quality);
        return `${optimizedUrl} ${w}w`;
      })
      .join(', ');
  };

  // Get optimized URL with width parameter
  const getOptimizedUrl = (url, w, q) => {
    if (!url) return '';
    
    // Already optimized
    if (url.includes('.webp') || url.includes('.avif')) return url;
    
    // External images - return as-is (server handles optimization)
    if (url.startsWith('http') && !url.includes('orderly')) return url;
    
    // Local uploads - server returns WebP, add size param if supported
    if (url.includes('/uploads/')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}w=${w}&q=${q}&fm=webp`;
    }
    
    return url;
  };

  // Generate WebP/AVIF source elements
  const generateSources = (baseSrc) => {
    if (!baseSrc) return null;
    
    // Skip for external non-optimized images
    if (baseSrc.startsWith('http') && !baseSrc.includes('orderly')) return null;
    
    const webpSrc = getOptimizedUrl(baseSrc, width || 1920, quality);
    const avifSrc = webpSrc.replace('.webp', '.avif');
    
    return (
      <>
        <source 
          type="image/avif" 
          srcSet={avifSrc} 
          sizes={sizes}
        />
        <source 
          type="image/webp" 
          srcSet={generateSrcSet(baseSrc)} 
          sizes={sizes}
        />
      </>
    );
  };

  // Blur placeholder data URL
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    if (placeholder === 'color') return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Crect fill='${encodeURIComponent(placeholderColor)}' width='20' height='20'/%3E%3C/svg%3E`;
    
    // Default tiny blurred placeholder
    return 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  };

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  const fallbackSrc = '/logo.png';

  if (hasError) {
    return (
      <img
        ref={imgRef}
        src={fallbackSrc}
        alt={alt}
        className={`${className} img-error`} 
        width={width}
        height={height}
        style={{ objectFit, objectPosition, ...props.style }}
        {...props}
      />
    );
  }

  return (
    <div 
      ref={imgRef}
      className={`optimized-image-wrapper ${className} ${isLoaded ? 'loaded' : ''} ${isInView ? 'in-view' : ''}`}
      style={{ 
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        position: 'relative',
        overflow: 'hidden',
        ...props.style 
      }}
      aria-hidden={!alt}
    >
      {/* Placeholder */}
      {!isLoaded && placeholder !== 'none' && (
        <div 
          className="img-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: placeholderColor,
            backgroundImage: placeholder === 'blur' ? `url("${getBlurDataURL()}")` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: placeholder === 'blur' ? 'blur(20px)' : 'none',
            transition: 'opacity 0.4s ease, filter 0.4s ease',
            opacity: isLoaded ? 0 : 1,
            pointerEvents: 'none',
            zIndex: 1
          }}
          aria-hidden="true"
        />
      )}

      {/* Picture element for format selection */}
      <picture>
        {generateSources(src)}
        <img
          src={isInView ? getOptimizedUrl(src, width || 1920, quality) : getBlurDataURL()}
          alt={alt}
          className={`optimized-img ${isLoaded ? 'loaded' : ''}`}
          width={width}
          height={height}
          loading={effectiveLoading}
          fetchPriority={effectiveFetchPriority}
          decoding={priority ? 'sync' : 'async'}
          sizes={sizes}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            objectPosition,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
            position: 'relative',
            zIndex: 2
          }}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      </picture>

      {/* Loading spinner for priority images */}
      {priority && !isLoaded && !hasError && (
        <div className="img-loading-spinner" aria-hidden="true">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
};

/**
 * Preload image utility
 */
export const preloadImage = (src, options = {}) => {
  if (!src || typeof window === 'undefined') return;
  
  const { as = 'image', fetchPriority = 'high', type } = options;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = src;
  if (fetchPriority) link.fetchPriority = fetchPriority;
  if (type) link.type = type;
  
  document.head.appendChild(link);
};

/**
 * Prefetch page utility
 */
export const prefetchPage = (href) => {
  if (!href || typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

export default OptimizedImage;
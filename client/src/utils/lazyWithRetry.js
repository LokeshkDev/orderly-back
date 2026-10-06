import React, { lazy } from 'react';

/**
 * Enhanced React.lazy with automatic single-refresh fallback when a dynamic import
 * fails (typically caused by new production deployments replacing chunk hashes).
 */
export const lazyWithRetry = (componentImport, componentName = 'Component') =>
  lazy(async () => {
    const storageKey = `retry_chunk_${componentName}`;
    const pageHasAlreadyBeenForceRefreshed = sessionStorage.getItem(storageKey);

    try {
      const component = await componentImport();
      sessionStorage.removeItem(storageKey);
      return component;
    } catch (error) {
      console.warn(`[Dynamic Chunk Load Note] Failed to load module "${componentName}":`, error?.message);

      const errorMessage = String(error?.message || '');
      const isChunkLoadFailed =
        errorMessage.includes('dynamically imported module') ||
        errorMessage.includes('text/html') ||
        errorMessage.includes('Failed to fetch') ||
        error?.name === 'ChunkLoadError';

      if (isChunkLoadFailed && !pageHasAlreadyBeenForceRefreshed) {
        sessionStorage.setItem(storageKey, 'true');
        // Force a fresh reload to get the latest index.html with new asset hashes
        window.location.reload();
        // Return an empty promise to prevent React from trying to render a failed module before the reload happens
        return new Promise(() => {});
      }

      // If already retried or it's a real JavaScript error inside the component, rethrow
      throw error;
    }
  });

export default lazyWithRetry;


import { useState, useEffect } from 'react';

/**
 * High-performance viewport detector for responsive conditional rendering.
 * Prevents mounting inactive desktop/mobile component trees in DOM,
 * eliminating duplicate API queries, double Virtual DOM allocations, and unnecessary image downloads.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    
    const handleChange = (e) => {
      setIsMobile(e.matches);
    };

    // Sync initial state
    setIsMobile(mediaQuery.matches);

    // Modern and backward-compatible event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [breakpoint]);

  return isMobile;
}

export default useIsMobile;

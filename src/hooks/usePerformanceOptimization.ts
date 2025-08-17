import { useEffect, useCallback, useRef } from 'react';

// Performance monitoring hook
export function usePerformanceOptimization() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Debounce function for API calls
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Throttle function for scroll events
  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle: boolean;
    return (...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  // Intersection observer for lazy loading
  const createIntersectionObserver = useCallback((callback: IntersectionObserverCallback) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1
    });

    return observerRef.current;
  }, []);

  // Performance measurement
  const measurePerformance = useCallback((name: string, fn: () => Promise<any>) => {
    return async (...args: any[]) => {
      const start = performance.now();
      try {
        const result = await fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
      } catch (error) {
        const end = performance.now();
        console.error(`${name} failed after ${end - start} milliseconds:`, error);
        throw error;
      }
    };
  }, []);

  // Cache implementation
  const createCache = useCallback((maxSize: number = 100) => {
    const cache = new Map();
    
    return {
      get: (key: string) => cache.get(key),
      set: (key: string, value: any) => {
        if (cache.size >= maxSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, value);
      },
      has: (key: string) => cache.has(key),
      clear: () => cache.clear()
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    debounce,
    throttle,
    createIntersectionObserver,
    measurePerformance,
    createCache
  };
}
// Performance utilities for various optimizations

/**
 * Debounce function to limit API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Simple LRU Cache implementation
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache = new Map<K, V>();

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) item
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Measure function execution time
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  name: string,
  func: T,
  threshold: number = 100
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = func(...args);
    const end = performance.now();
    const duration = end - start;
    
    // Only log if execution time exceeds threshold or in development
    if (process.env.NODE_ENV === 'development' || duration > threshold) {
      console.log(`⏱️ ${name}: ${Math.round(duration)}ms`);
    }
    
    return result;
  }) as T;
}

/**
 * Async performance measurement
 */
export function measureAsyncPerformance<T extends (...args: any[]) => Promise<any>>(
  name: string,
  func: T,
  threshold: number = 100
): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now();
    try {
      const result = await func(...args);
      const end = performance.now();
      const duration = end - start;
      
      if (process.env.NODE_ENV === 'development' || duration > threshold) {
        console.log(`⏱️ ${name}: ${Math.round(duration)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      console.error(`❌ ${name} failed after ${Math.round(duration)}ms:`, error);
      throw error;
    }
  }) as T;
}

/**
 * Memory-efficient array chunking
 */
export function* chunkArray<T>(array: T[], size: number): Generator<T[]> {
  for (let i = 0; i < array.length; i += size) {
    yield array.slice(i, i + size);
  }
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string = 'script'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Check if element is in viewport
 */
export function isElementInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Get optimal image size based on device pixel ratio and container size
 */
export function getOptimalImageSize(
  containerWidth: number,
  containerHeight: number,
  maxWidth: number = 1920
): { width: number; height: number } {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const scaledWidth = Math.min(containerWidth * devicePixelRatio, maxWidth);
  const scaledHeight = containerHeight * devicePixelRatio;
  
  return {
    width: Math.round(scaledWidth),
    height: Math.round(scaledHeight)
  };
}
import { useEffect } from 'react';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

export const PerformanceMonitor = () => {
  const { measurePerformance } = usePerformanceOptimization();

  useEffect(() => {
    // Monitor page load performance
    const handleLoad = () => {
      // Measure Core Web Vitals
      if ('performance' in window) {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          console.log('Performance Metrics:', {
            'DOM Content Loaded': navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            'Load Event': navigation.loadEventEnd - navigation.loadEventStart,
            'First Paint': performance.getEntriesByType('paint')[0]?.startTime,
            'Largest Contentful Paint': performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
          });
        }, 1000);
      }
    };

    // Monitor route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      measurePerformance('route-change', async () => {
        originalPushState.apply(this, args);
        return Promise.resolve();
      })();
    };

    history.replaceState = function(...args) {
      measurePerformance('route-change', async () => {
        originalReplaceState.apply(this, args);
        return Promise.resolve();
      })();
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [measurePerformance]);

  return null; // This component doesn't render anything
};
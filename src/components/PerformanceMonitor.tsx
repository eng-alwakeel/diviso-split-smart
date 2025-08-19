import { useEffect } from 'react';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

export const PerformanceMonitor = () => {
  const { measurePerformance } = usePerformanceOptimization();

  useEffect(() => {
    // Monitor page load performance only in development
    const handleLoad = () => {
      if ('performance' in window && process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const paintMetrics = performance.getEntriesByType('paint');
          const lcpMetrics = performance.getEntriesByType('largest-contentful-paint');
          
          // Only log if we have meaningful metrics
          if (navigation && (paintMetrics.length > 0 || lcpMetrics.length > 0)) {
            console.group('🚀 Performance Metrics');
            console.log('DOM Ready:', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart + 'ms');
            console.log('Load Complete:', navigation.loadEventEnd - navigation.loadEventStart + 'ms');
            if (paintMetrics[0]) console.log('First Paint:', Math.round(paintMetrics[0].startTime) + 'ms');
            if (lcpMetrics[0]) console.log('LCP:', Math.round(lcpMetrics[0].startTime) + 'ms');
            console.groupEnd();
          }
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
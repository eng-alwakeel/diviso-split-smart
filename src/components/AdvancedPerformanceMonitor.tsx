import { useEffect, useState } from 'react';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  ttfb?: number; // Time to First Byte
}

export const AdvancedPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const { measurePerformance } = usePerformanceOptimization();

  useEffect(() => {
    // Measure Core Web Vitals
    const measureWebVitals = () => {
      // First Contentful Paint
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
      if (fcpEntry) {
        setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
      }

      // Largest Contentful Paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcpEntry = entries[entries.length - 1] as any;
        setMetrics(prev => ({ ...prev, lcp: lcpEntry.startTime }));
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        setMetrics(prev => ({ ...prev, cls: clsValue }));
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
        }
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Time to First Byte
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics(prev => ({ ...prev, ttfb: navigation.responseStart - navigation.requestStart }));
      }

      return () => {
        observer.disconnect();
        clsObserver.disconnect();
        fidObserver.disconnect();
      };
    };

    const cleanup = measureWebVitals();

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        if (Object.keys(metrics).length > 0) {
          console.group('🚀 Performance Metrics');
          console.log('First Contentful Paint (FCP):', metrics.fcp?.toFixed(2), 'ms');
          console.log('Largest Contentful Paint (LCP):', metrics.lcp?.toFixed(2), 'ms');
          console.log('Cumulative Layout Shift (CLS):', metrics.cls?.toFixed(4));
          console.log('First Input Delay (FID):', metrics.fid?.toFixed(2), 'ms');
          console.log('Time to First Byte (TTFB):', metrics.ttfb?.toFixed(2), 'ms');
          console.groupEnd();
        }
      }, 10000); // Log every 10 seconds

      return () => {
        cleanup?.();
        clearInterval(interval);
      };
    }

    return cleanup;
  }, [metrics, measurePerformance]);

  // Monitor route changes performance
  useEffect(() => {
    const handleRouteChange = () => {
      measurePerformance('route-change', async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        return 'Route changed';
      })();
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [measurePerformance]);

  return null; // This component doesn't render anything
};
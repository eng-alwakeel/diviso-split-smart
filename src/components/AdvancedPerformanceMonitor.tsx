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
    let observers: PerformanceObserver[] = [];
    let logInterval: NodeJS.Timeout | null = null;

    // Measure Core Web Vitals
    const measureWebVitals = () => {
      // First Contentful Paint (one-time measurement)
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
      if (fcpEntry) {
        setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
      }

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcpEntry = entries[entries.length - 1] as any;
        setMetrics(prev => ({ ...prev, lcp: lcpEntry.startTime }));
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observation not supported');
      }

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        setMetrics(prev => ({ ...prev, cls: prev.cls ? prev.cls + clsValue : clsValue }));
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observation not supported');
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
        }
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observation not supported');
      }

      // Time to First Byte (one-time measurement)
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics(prev => ({ ...prev, ttfb: navigation.responseStart - navigation.requestStart }));
      }
    };

    measureWebVitals();

    // Log performance metrics in development (only once, then clear)
    if (process.env.NODE_ENV === 'development') {
      logInterval = setTimeout(() => {
        setMetrics(currentMetrics => {
          if (Object.keys(currentMetrics).length > 0) {
            console.group('🚀 Performance Metrics');
            console.log('First Contentful Paint (FCP):', currentMetrics.fcp?.toFixed(2), 'ms');
            console.log('Largest Contentful Paint (LCP):', currentMetrics.lcp?.toFixed(2), 'ms');
            console.log('Cumulative Layout Shift (CLS):', currentMetrics.cls?.toFixed(4));
            console.log('First Input Delay (FID):', currentMetrics.fid?.toFixed(2), 'ms');
            console.log('Time to First Byte (TTFB):', currentMetrics.ttfb?.toFixed(2), 'ms');
            console.groupEnd();
          }
          return currentMetrics;
        });
      }, 5000); // Log once after 5 seconds
    }

    return () => {
      observers.forEach(observer => observer.disconnect());
      if (logInterval) clearTimeout(logInterval);
    };
  }, []); // Remove dependencies to prevent infinite loop

  // Monitor route changes performance (stable reference)
  useEffect(() => {
    const handleRouteChange = () => {
      if (measurePerformance) {
        measurePerformance('route-change', async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
          return 'Route changed';
        })();
      }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []); // Remove dependency to prevent recreation

  return null; // This component doesn't render anything
};
import { useEffect, useRef, useState } from 'react';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  cls?: number;
  fid?: number;
  ttfb?: number;
  memoryUsage?: number;
  bundleSize?: number;
}

export const EnhancedPerformanceMonitor = () => {
  const { measurePerformance } = usePerformanceOptimization();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const observersRef = useRef<PerformanceObserver[]>([]);
  const metricsRef = useRef<PerformanceMetrics>({});

  useEffect(() => {
    // Only monitor in development or when specifically needed
    if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug=true')) {
      return;
    }

    const observers: PerformanceObserver[] = [];

    // Core Web Vitals monitoring
    try {
      // First Contentful Paint & Largest Contentful Paint
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metricsRef.current.fcp = entry.startTime;
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      observers.push(paintObserver);

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metricsRef.current.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observers.push(lcpObserver);

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
        metricsRef.current.cls = cls;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(clsObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          metricsRef.current.fid = entry.processingStart - entry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observers.push(fidObserver);

    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    // Memory usage monitoring (if available)
    const monitorMemory = () => {
      if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        metricsRef.current.memoryUsage = memory.usedJSHeapSize / 1048576; // MB
      }
    };

    // Log comprehensive metrics periodically (development only)
    const metricsInterval = setInterval(() => {
      if (process.env.NODE_ENV === 'development') {
        monitorMemory();
        
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          metricsRef.current.ttfb = navigation.responseStart - navigation.requestStart;
        }

        // Only log if we have meaningful data
        const hasMetrics = Object.values(metricsRef.current).some(value => value && value > 0);
        if (hasMetrics) {
          console.group('📊 Performance Dashboard');
          console.table({
            'First Contentful Paint': metricsRef.current.fcp ? `${Math.round(metricsRef.current.fcp)}ms` : 'N/A',
            'Largest Contentful Paint': metricsRef.current.lcp ? `${Math.round(metricsRef.current.lcp)}ms` : 'N/A',
            'Cumulative Layout Shift': metricsRef.current.cls ? metricsRef.current.cls.toFixed(3) : 'N/A',
            'First Input Delay': metricsRef.current.fid ? `${Math.round(metricsRef.current.fid)}ms` : 'N/A',
            'Time to First Byte': metricsRef.current.ttfb ? `${Math.round(metricsRef.current.ttfb)}ms` : 'N/A',
            'Memory Usage': metricsRef.current.memoryUsage ? `${Math.round(metricsRef.current.memoryUsage)}MB` : 'N/A',
          });
          console.groupEnd();
          
          // Performance scoring
          const score = calculatePerformanceScore(metricsRef.current);
          if (score < 70) {
            console.warn(`⚠️ Performance Score: ${score}/100 - Consider optimizations`);
          } else if (score >= 90) {
            console.log(`✅ Excellent Performance Score: ${score}/100`);
          }
        }
      }
    }, 10000); // Every 10 seconds

    observersRef.current = observers;

    return () => {
      observers.forEach(observer => observer.disconnect());
      clearInterval(metricsInterval);
    };
  }, [measurePerformance]);

  return null;
};

// Performance scoring algorithm
function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100;
  
  // FCP scoring (good < 1800ms, poor > 3000ms)
  if (metrics.fcp) {
    if (metrics.fcp > 3000) score -= 20;
    else if (metrics.fcp > 1800) score -= 10;
  }
  
  // LCP scoring (good < 2500ms, poor > 4000ms)
  if (metrics.lcp) {
    if (metrics.lcp > 4000) score -= 25;
    else if (metrics.lcp > 2500) score -= 15;
  }
  
  // CLS scoring (good < 0.1, poor > 0.25)
  if (metrics.cls) {
    if (metrics.cls > 0.25) score -= 20;
    else if (metrics.cls > 0.1) score -= 10;
  }
  
  // FID scoring (good < 100ms, poor > 300ms)
  if (metrics.fid) {
    if (metrics.fid > 300) score -= 15;
    else if (metrics.fid > 100) score -= 8;
  }
  
  // Memory usage penalty
  if (metrics.memoryUsage && metrics.memoryUsage > 50) {
    score -= 10;
  }
  
  return Math.max(0, score);
}
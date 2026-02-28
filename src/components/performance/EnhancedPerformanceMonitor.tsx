import { useEffect, useRef, useState } from 'react';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  cls?: number;
  fid?: number;
  inp?: number; // Interaction to Next Paint (Google's 2024 metric)
  ttfb?: number;
  memoryUsage?: number;
  bundleSize?: number;
}

// Helper to get performance rating
const getMetricRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds: Record<string, [number, number]> = {
    FCP: [1800, 3000],
    LCP: [2500, 4000],
    FID: [100, 300],
    INP: [200, 500], // Google's 2024 Core Web Vital
    CLS: [0.1, 0.25],
    TTFB: [800, 1800],
  };
  const [good, poor] = thresholds[name] || [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
};

export const EnhancedPerformanceMonitor = () => {
  const { measurePerformance } = usePerformanceOptimization();
  const { trackWebVitals } = useGoogleAnalytics();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const observersRef = useRef<PerformanceObserver[]>([]);
  const metricsRef = useRef<PerformanceMetrics>({});
  const sentToGA4Ref = useRef<Set<string>>(new Set());

  useEffect(() => {
    const observers: PerformanceObserver[] = [];

    // Send metric to GA4 only once
    const sendMetricToGA4 = (name: string, value: number) => {
      if (!sentToGA4Ref.current.has(name) && value > 0) {
        sentToGA4Ref.current.add(name);
        const rating = getMetricRating(name, value);
        trackWebVitals(name, value, rating);
      }
    };

    // Core Web Vitals monitoring
    try {
      // First Contentful Paint & Largest Contentful Paint
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metricsRef.current.fcp = entry.startTime;
            sendMetricToGA4('FCP', entry.startTime);
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
        sendMetricToGA4('LCP', lastEntry.startTime);
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
          const fid = entry.processingStart - entry.startTime;
          metricsRef.current.fid = fid;
          sendMetricToGA4('FID', fid);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observers.push(fidObserver);

      // Interaction to Next Paint (INP) - Google's 2024 Core Web Vital
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          const inp = entry.duration;
          // Track the longest interaction (worst case)
          if (!metricsRef.current.inp || inp > metricsRef.current.inp) {
            metricsRef.current.inp = inp;
          }
        }
      });
      try {
        inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 } as any);
        observers.push(inpObserver);
      } catch (e) {
        console.warn('INP observation not supported');
      }

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

    // Send GA4 metrics once after page stabilizes (10s), then stop
    const metricsTimeout = setTimeout(() => {
      monitorMemory();
      
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        metricsRef.current.ttfb = ttfb;
        sendMetricToGA4('TTFB', ttfb);
      }

      if (metricsRef.current.cls !== undefined) {
        sendMetricToGA4('CLS', metricsRef.current.cls);
      }

      if (metricsRef.current.inp !== undefined) {
        sendMetricToGA4('INP', metricsRef.current.inp);
      }
    }, 10000);

    observersRef.current = observers;

    return () => {
      observers.forEach(observer => observer.disconnect());
      clearInterval(metricsInterval);
    };
  }, [trackWebVitals]);

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

  // INP scoring (good < 200ms, poor > 500ms)
  if (metrics.inp) {
    if (metrics.inp > 500) score -= 20;
    else if (metrics.inp > 200) score -= 10;
  }
  
  // Memory usage penalty
  if (metrics.memoryUsage && metrics.memoryUsage > 50) {
    score -= 10;
  }
  
  return Math.max(0, score);
}
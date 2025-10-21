import { useEffect, useRef, useState, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface LazyAdLoaderProps {
  children: ReactNode;
  minViewportScroll?: number;
  minHeight?: number;
  className?: string;
}

export const LazyAdLoader = ({ 
  children, 
  minViewportScroll = 0.3,
  minHeight = 250,
  className = ''
}: LazyAdLoaderProps) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '200px', // Load 200px before visible
        threshold: 0.1
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={adRef} 
      style={{ minHeight: `${minHeight}px` }}
      className={className}
    >
      {shouldLoad ? (
        children
      ) : (
        <AdSkeleton minHeight={minHeight} />
      )}
    </div>
  );
};

const AdSkeleton = ({ minHeight }: { minHeight: number }) => (
  <Card className="w-full animate-pulse" style={{ minHeight: `${minHeight}px` }}>
    <CardContent className="p-4 flex items-center gap-4">
      <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <Skeleton className="h-9 w-24 flex-shrink-0" />
    </CardContent>
  </Card>
);

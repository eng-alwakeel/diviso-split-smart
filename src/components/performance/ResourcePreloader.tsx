import { useEffect } from 'react';

interface ResourcePreloaderProps {
  resources: {
    href: string;
    as: 'image' | 'font' | 'style' | 'script';
    type?: string;
    crossorigin?: 'anonymous' | 'use-credentials';
  }[];
}

export const ResourcePreloader: React.FC<ResourcePreloaderProps> = ({ resources }) => {
  useEffect(() => {
    const preloadedElements: HTMLLinkElement[] = [];

    resources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      
      if (resource.type) {
        link.type = resource.type;
      }
      
      if (resource.crossorigin) {
        link.crossOrigin = resource.crossorigin;
      }

      // For fonts, add display swap
      if (resource.as === 'font') {
        link.setAttribute('crossorigin', 'anonymous');
      }

      document.head.appendChild(link);
      preloadedElements.push(link);
    });

    // Cleanup on unmount
    return () => {
      preloadedElements.forEach((element) => {
        if (document.head.contains(element)) {
          document.head.removeChild(element);
        }
      });
    };
  }, [resources]);

  return null;
};

// Critical resources to preload
export const CriticalResourcePreloader = () => {
  const criticalResources = [
    {
      href: '/fonts/ReadexPro-Regular.woff2',
      as: 'font' as const,
      type: 'font/woff2',
      crossorigin: 'anonymous' as const,
    },
    {
      href: '/fonts/ReadexPro-SemiBold.woff2', 
      as: 'font' as const,
      type: 'font/woff2',
      crossorigin: 'anonymous' as const,
    },
  ];

  return <ResourcePreloader resources={criticalResources} />;
};

// Hook for dynamic resource preloading
export const useResourcePreloader = () => {
  const preloadImage = (src: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  };

  const preloadRoute = (path: string) => {
    // This would work with a bundler that supports route-based code splitting
    import(`../pages${path}.tsx`).catch(() => {
      // Silently fail if route doesn't exist
    });
  };

  const prefetchDNS = (hostname: string) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${hostname}`;
    document.head.appendChild(link);
  };

  const preconnect = (hostname: string) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = `//${hostname}`;
    document.head.appendChild(link);
  };

  return {
    preloadImage,
    preloadRoute,
    prefetchDNS,
    preconnect,
  };
};
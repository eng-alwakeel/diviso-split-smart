import { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  className?: string;
}

export const AdsterraAd = ({ className = '' }: AdsterraAdProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || !adContainerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://pl28331867.effectivegatecpm.com/4f/6d/45/4f6d45e2d8a0216b1786a3e65182455b.js';
    script.async = true;
    script.type = 'text/javascript';
    
    adContainerRef.current.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      if (adContainerRef.current && script.parentNode === adContainerRef.current) {
        adContainerRef.current.removeChild(script);
      }
    };
  }, []);

  return (
    <div 
      ref={adContainerRef} 
      className={`adsterra-ad-container ${className}`}
    />
  );
};

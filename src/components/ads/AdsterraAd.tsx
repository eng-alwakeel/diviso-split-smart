import { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  className?: string;
}

export const AdsterraAd = ({ className = '' }: AdsterraAdProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || !adContainerRef.current) return;

    // Add atOptions configuration
    const optionsScript = document.createElement('script');
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '40b07d02ef97efae4bd57f91b2660b9e',
        'format' : 'iframe',
        'height' : 300,
        'width' : 160,
        'params' : {}
      };
    `;
    adContainerRef.current.appendChild(optionsScript);

    // Add invoke script
    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/40b07d02ef97efae4bd57f91b2660b9e/invoke.js';
    invokeScript.async = true;
    adContainerRef.current.appendChild(invokeScript);
    
    scriptLoaded.current = true;
  }, []);

  return (
    <div 
      ref={adContainerRef} 
      className={`adsterra-ad-container flex justify-center ${className}`}
    />
  );
};

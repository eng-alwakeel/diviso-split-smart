import { useEffect } from "react";

export const initGA4 = (measurementId?: string) => {
  if (!measurementId) return;
  if ((window as any)._gaInitialized) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s);
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]){ (window as any).dataLayer.push(args); }
  (window as any).gtag = gtag as any;
  (window as any).gtag('js', new Date());
  (window as any).gtag('config', measurementId);
  (window as any)._gaInitialized = true;
};

export const gaEvent = (name: string, params: Record<string, any>) => {
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', name, params);
  } else {
    // Fallback logging
    console.debug('[GA4]', name, params);
  }
};

export const useGA4 = (measurementId?: string) => {
  useEffect(() => { initGA4(measurementId); }, [measurementId]);
};

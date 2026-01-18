/**
 * Lazy loader for Moyasar Payment SDK
 * Loads the script and CSS only when payment functionality is needed
 */

let moyasarLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadMoyasar(): Promise<void> {
  // Already loaded
  if (moyasarLoaded && typeof window !== 'undefined' && window.Moyasar) {
    return;
  }

  // Currently loading
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    // Load CSS first
    const existingLink = document.querySelector('link[href*="moyasar.css"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
      document.head.appendChild(link);
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="moyasar.js"]');
    if (existingScript && window.Moyasar) {
      moyasarLoaded = true;
      resolve();
      return;
    }

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
    script.async = true;
    
    script.onload = () => {
      moyasarLoaded = true;
      console.log('Moyasar SDK loaded dynamically');
      resolve();
    };
    
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error('Failed to load Moyasar SDK'));
    };
    
    document.body.appendChild(script);
  });

  return loadingPromise;
}

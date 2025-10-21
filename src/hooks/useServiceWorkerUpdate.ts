import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

export const useServiceWorkerUpdate = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    // Only run in browser and if service workers are supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const reloadPage = () => {
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    };

    const handleServiceWorkerUpdate = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowReload(true);
        
        // Show toast notification with update button
        toast({
          title: "تحديث جديد متاح! 🎉",
          description: "نسخة جديدة من التطبيق متاحة الآن. انقر لتحديث الصفحة.",
          duration: 10000,
        });
      }
    };

    // Listen for service worker updates
    navigator.serviceWorker.ready.then((registration) => {
      // Check for updates periodically
      const updateInterval = setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      // Listen for new service worker waiting
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              handleServiceWorkerUpdate(registration);
            }
          });
        }
      });

      // Check if there's already a waiting service worker
      if (registration.waiting) {
        handleServiceWorkerUpdate(registration);
      }

      // Cleanup interval on unmount
      return () => clearInterval(updateInterval);
    });

    // Listen for controller change (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (showReload) {
        window.location.reload();
      }
    });

    // Message handler for service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        toast({
          title: "تحديث جديد متاح! 🎉",
          description: "نسخة جديدة من التطبيق متاحة الآن. انقر لتحديث الصفحة.",
          duration: 10000,
        });
      }
    });

  }, [waitingWorker, showReload]);

  return { 
    showReload, 
    reloadPage: () => {
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    }
  };
};

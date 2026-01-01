import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export const useServiceWorkerUpdate = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showReload, setShowReload] = useState(false);

  const reloadPage = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, [waitingWorker]);

  const showUpdateToast = useCallback(() => {
    const lang = localStorage.getItem('i18nextLng') || 'ar';
    const isRTL = lang === 'ar';
    
    toast({
      title: isRTL ? '🔄 تحديث متوفر' : '🔄 Update Available',
      description: isRTL 
        ? 'نسخة جديدة من التطبيق متوفرة. أعد تحميل الصفحة للتحديث.'
        : 'A new version is available. Reload the page to update.',
      duration: 15000,
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleServiceWorkerUpdate = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowReload(true);
        showUpdateToast();
      }
    };

    navigator.serviceWorker.ready.then((registration) => {
      const updateInterval = setInterval(() => {
        registration.update().catch(console.error);
      }, 5 * 60 * 1000);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setShowReload(true);
              showUpdateToast();
            }
          });
        }
      });

      if (registration.waiting) {
        handleServiceWorkerUpdate(registration);
      }

      return () => clearInterval(updateInterval);
    });

    const onControllerChange = () => {
      if (showReload) {
        window.location.reload();
      }
    };
    
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, [showReload, showUpdateToast]);

  return { showReload, reloadPage };
};

export default useServiceWorkerUpdate;

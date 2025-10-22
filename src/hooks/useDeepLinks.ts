import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { isNativePlatform } from '@/lib/native';

export const useDeepLinks = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    // Handle app URL open (deep links)
    App.addListener('appUrlOpen', (data) => {
      console.log('Deep link opened:', data.url);

      // Parse the URL and navigate accordingly
      const url = new URL(data.url);
      
      // Handle different deep link patterns
      if (url.hostname === 'diviso.app' || url.protocol === 'diviso:') {
        const path = url.pathname;
        const params = new URLSearchParams(url.search);

        // Examples:
        // diviso://invite/ABC123 -> /i/ABC123
        // https://diviso.app/i/ABC123 -> /i/ABC123
        // diviso://group/123 -> /group/123
        // diviso://referral -> /referral

        if (path.includes('/i/')) {
          navigate(path);
        } else if (path.includes('/invite/')) {
          const code = path.split('/invite/')[1];
          navigate(`/i/${code}`);
        } else if (path.includes('/group/')) {
          navigate(path);
        } else if (path.includes('/join/')) {
          navigate(path);
        } else if (path.includes('/referral')) {
          navigate('/referral');
        } else {
          // Default to dashboard
          navigate('/dashboard');
        }
      }
    }).then(listener => {
      cleanup = () => listener.remove();
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [navigate]);
};
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { 
  isNativePlatform, 
  setStatusBarStyle, 
  addAppStateListener,
  addBackButtonListener 
} from '@/lib/native';
import { initPushNotifications, isPushEnabled } from '@/lib/pushNotifications';
import { useNavigate, useLocation } from 'react-router-dom';

export const useNativeFeatures = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [pushEnabled, setPushEnabled] = useState(false);

  // Set status bar style based on theme
  useEffect(() => {
    if (!isNativePlatform()) return;

    const style = theme === 'dark' ? 'dark' : 'light';
    setStatusBarStyle(style);
  }, [theme]);

  // Initialize push notifications
  useEffect(() => {
    if (!isNativePlatform()) return;

    const initPush = async () => {
      const enabled = await initPushNotifications();
      setPushEnabled(enabled);
    };

    initPush();

    // Check push status
    isPushEnabled().then(setPushEnabled);
  }, []);

  // Handle app state changes
  useEffect(() => {
    if (!isNativePlatform()) return;

    const cleanup = addAppStateListener((state) => {
      console.log('App state changed:', state);
      // You can add custom logic here when app becomes active/inactive
      // For example: refresh data, sync, etc.
    });

    return cleanup;
  }, []);

  // Handle Android back button
  useEffect(() => {
    if (!isNativePlatform()) return;

    const cleanup = addBackButtonListener(() => {
      // Allow back navigation on most pages
      const canGoBack = window.history.length > 1;
      const isHomePage = location.pathname === '/dashboard' || location.pathname === '/';

      if (isHomePage) {
        // On home page, show exit confirmation
        const shouldExit = window.confirm('هل تريد الخروج من التطبيق؟');
        if (shouldExit) {
          // Note: exitApp() is available but not imported here
          // You can import it if needed
        }
      } else if (canGoBack) {
        // Navigate back
        navigate(-1);
      } else {
        // Go to home
        navigate('/dashboard');
      }
    });

    return cleanup;
  }, [navigate, location.pathname]);

  return {
    isNative: isNativePlatform(),
    pushEnabled,
  };
};
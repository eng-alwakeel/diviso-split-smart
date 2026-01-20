/**
 * Browser Push Notifications Utility
 * Handles Web Push API for desktop/mobile browsers
 */

/**
 * Check if browser supports notifications
 */
export const isBrowserNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Request permission for browser notifications
 * Returns true if permission was granted
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isBrowserNotificationSupported()) {
    console.log('[BrowserNotifications] Browser notifications not supported');
    return false;
  }

  // If already granted, return true
  if (Notification.permission === 'granted') {
    return true;
  }

  // If denied, can't request again
  if (Notification.permission === 'denied') {
    console.log('[BrowserNotifications] Permission was previously denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[BrowserNotifications] Permission result:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('[BrowserNotifications] Error requesting permission:', error);
    return false;
  }
};

/**
 * Show a browser notification
 */
export const showBrowserNotification = (
  title: string,
  options?: NotificationOptions & { onClick?: () => void }
): Notification | null => {
  if (!isBrowserNotificationSupported()) {
    console.log('[BrowserNotifications] Browser notifications not supported');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.log('[BrowserNotifications] Permission not granted');
    return null;
  }

  try {
    const { onClick, ...notificationOptions } = options || {};
    
    const notification = new Notification(title, {
      icon: '/favicon.png',
      badge: '/favicon.png',
      dir: 'rtl',
      lang: 'ar',
      ...notificationOptions,
    });

    // Handle notification click
    if (onClick) {
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        onClick();
        notification.close();
      };
    } else {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } catch (error) {
    console.error('[BrowserNotifications] Error showing notification:', error);
    return null;
  }
};

/**
 * Save notification preference to localStorage
 */
export const saveNotificationPreference = (enabled: boolean): void => {
  localStorage.setItem('browser_notifications_enabled', JSON.stringify(enabled));
};

/**
 * Get notification preference from localStorage
 */
export const getNotificationPreference = (): boolean => {
  const stored = localStorage.getItem('browser_notifications_enabled');
  if (stored === null) return false;
  try {
    return JSON.parse(stored);
  } catch {
    return false;
  }
};

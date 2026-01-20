import { useState, useEffect, useCallback } from "react";
import {
  isBrowserNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  saveNotificationPreference,
  showBrowserNotification,
} from "@/lib/browserNotifications";

const NOTIFICATION_ASKED_KEY = "diviso_notification_asked";

export function useBrowserNotificationPrompt() {
  const [hasAsked, setHasAsked] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');

  // Check on mount
  useEffect(() => {
    const asked = localStorage.getItem(NOTIFICATION_ASKED_KEY);
    setHasAsked(asked !== null);
    setPermissionStatus(getNotificationPermission());
  }, []);

  // Should show prompt?
  const shouldShowPrompt = useCallback((): boolean => {
    if (!isBrowserNotificationSupported()) return false;
    if (hasAsked === null) return false; // Still loading
    if (hasAsked) return false;
    if (permissionStatus === 'granted' || permissionStatus === 'denied') return false;
    return true;
  }, [hasAsked, permissionStatus]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    localStorage.setItem(NOTIFICATION_ASKED_KEY, "true");
    setHasAsked(true);
    
    const granted = await requestNotificationPermission();
    setPermissionStatus(getNotificationPermission());
    
    if (granted) {
      saveNotificationPreference(true);
      
      // Show a test notification to confirm it works
      setTimeout(() => {
        showBrowserNotification("تم تفعيل الإشعارات! 🔔", {
          body: "ستصلك إشعارات عند وجود تحديثات جديدة",
          tag: "notification-enabled",
        });
      }, 500);
    }
    
    return granted;
  }, []);

  // Dismiss prompt
  const dismissPrompt = useCallback(() => {
    localStorage.setItem(NOTIFICATION_ASKED_KEY, "dismissed");
    setHasAsked(true);
  }, []);

  // Reset prompt (for testing/settings)
  const resetPrompt = useCallback(() => {
    localStorage.removeItem(NOTIFICATION_ASKED_KEY);
    setHasAsked(false);
  }, []);

  return {
    shouldShowPrompt,
    requestPermission,
    dismissPrompt,
    resetPrompt,
    permissionStatus,
    isSupported: isBrowserNotificationSupported(),
  };
}

import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Contacts } from '@capacitor-community/contacts';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';

export type PermissionType = 'camera' | 'contacts' | 'location' | 'notifications';
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unavailable';

export interface PermissionInfo {
  type: PermissionType;
  status: PermissionStatus;
  title: string;
  description: string;
  icon: string;
}

const permissionDetails: Record<PermissionType, { title: string; description: string; icon: string }> = {
  camera: {
    title: 'الكاميرا',
    description: 'نحتاج الوصول للكاميرا لمسح الفواتير واستخراج البيانات تلقائياً',
    icon: '📷'
  },
  contacts: {
    title: 'جهات الاتصال',
    description: 'نحتاج الوصول لجهات الاتصال لدعوة أصدقائك بسهولة',
    icon: '👥'
  },
  location: {
    title: 'الموقع',
    description: 'نحتاج موقعك لتحسين تجربة الاستخدام وعرض العروض القريبة منك',
    icon: '📍'
  },
  notifications: {
    title: 'الإشعارات',
    description: 'نحتاج إرسال إشعارات لتنبيهك بالمصروفات الجديدة والتحديثات المهمة',
    icon: '🔔'
  }
};

export const usePermissions = () => {
  const [loading, setLoading] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const checkPermission = useCallback(async (type: PermissionType): Promise<PermissionStatus> => {
    if (!isNative) {
      return 'unavailable';
    }

    try {
      switch (type) {
        case 'camera': {
          const result = await Camera.checkPermissions();
          if (result.camera === 'granted' || result.photos === 'granted') return 'granted';
          if (result.camera === 'denied') return 'denied';
          return 'prompt';
        }
        case 'contacts': {
          const result = await Contacts.checkPermissions();
          if (result.contacts === 'granted') return 'granted';
          if (result.contacts === 'denied') return 'denied';
          return 'prompt';
        }
        case 'location': {
          const result = await Geolocation.checkPermissions();
          if (result.location === 'granted' || result.coarseLocation === 'granted') return 'granted';
          if (result.location === 'denied') return 'denied';
          return 'prompt';
        }
        case 'notifications': {
          const result = await PushNotifications.checkPermissions();
          if (result.receive === 'granted') return 'granted';
          if (result.receive === 'denied') return 'denied';
          return 'prompt';
        }
        default:
          return 'unavailable';
      }
    } catch (error) {
      console.error(`Error checking ${type} permission:`, error);
      return 'unavailable';
    }
  }, [isNative]);

  const requestPermission = useCallback(async (type: PermissionType): Promise<boolean> => {
    if (!isNative) {
      console.log(`Permission ${type} not available on web`);
      return false;
    }

    setLoading(true);
    try {
      switch (type) {
        case 'camera': {
          const result = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
          return result.camera === 'granted' || result.photos === 'granted';
        }
        case 'contacts': {
          const result = await Contacts.requestPermissions();
          return result.contacts === 'granted';
        }
        case 'location': {
          const result = await Geolocation.requestPermissions();
          return result.location === 'granted' || result.coarseLocation === 'granted';
        }
        case 'notifications': {
          const result = await PushNotifications.requestPermissions();
          return result.receive === 'granted';
        }
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isNative]);

  const requestMultiplePermissions = useCallback(async (
    types: PermissionType[]
  ): Promise<Record<PermissionType, boolean>> => {
    const results: Record<PermissionType, boolean> = {
      camera: false,
      contacts: false,
      location: false,
      notifications: false
    };

    for (const type of types) {
      results[type] = await requestPermission(type);
    }

    return results;
  }, [requestPermission]);

  const getPermissionInfo = useCallback(async (type: PermissionType): Promise<PermissionInfo> => {
    const status = await checkPermission(type);
    const details = permissionDetails[type];
    
    return {
      type,
      status,
      ...details
    };
  }, [checkPermission]);

  const getAllPermissionsStatus = useCallback(async (): Promise<PermissionInfo[]> => {
    const types: PermissionType[] = ['camera', 'contacts', 'location', 'notifications'];
    const results: PermissionInfo[] = [];

    for (const type of types) {
      const info = await getPermissionInfo(type);
      results.push(info);
    }

    return results;
  }, [getPermissionInfo]);

  const openAppSettings = useCallback(() => {
    if (Capacitor.getPlatform() === 'android') {
      // على Android، يمكن فتح إعدادات التطبيق
      console.log('Opening app settings on Android');
    } else if (Capacitor.getPlatform() === 'ios') {
      // على iOS، يمكن فتح إعدادات التطبيق
      console.log('Opening app settings on iOS');
    }
    // ملاحظة: فتح الإعدادات يحتاج plugin إضافي مثل capacitor-native-settings
  }, []);

  return {
    isNative,
    loading,
    checkPermission,
    requestPermission,
    requestMultiplePermissions,
    getPermissionInfo,
    getAllPermissionsStatus,
    openAppSettings,
    permissionDetails
  };
};

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App } from '@capacitor/app';

// Platform detection
export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();
export const isIOS = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';
export const isWeb = () => getPlatform() === 'web';

// Camera utilities
export const takePhoto = async () => {
  if (!isNativePlatform()) {
    throw new Error('Camera is only available on native platforms');
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });

    return image;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

export const pickImage = async () => {
  if (!isNativePlatform()) {
    throw new Error('Gallery is only available on native platforms');
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });

    return image;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

// Native sharing
export const shareNative = async (options: {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}) => {
  if (!isNativePlatform()) {
    return false;
  }

  try {
    const canShare = await Share.canShare();
    if (!canShare.value) {
      return false;
    }

    await Share.share({
      title: options.title,
      text: options.text,
      url: options.url,
      dialogTitle: options.dialogTitle || 'مشاركة',
    });

    return true;
  } catch (error) {
    console.error('Error sharing:', error);
    return false;
  }
};

// Status bar utilities
export const setStatusBarStyle = async (style: 'light' | 'dark') => {
  if (!isNativePlatform()) return;

  try {
    await StatusBar.setStyle({
      style: style === 'light' ? Style.Light : Style.Dark,
    });
  } catch (error) {
    console.error('Error setting status bar style:', error);
  }
};

export const hideStatusBar = async () => {
  if (!isNativePlatform()) return;
  
  try {
    await StatusBar.hide();
  } catch (error) {
    console.error('Error hiding status bar:', error);
  }
};

export const showStatusBar = async () => {
  if (!isNativePlatform()) return;
  
  try {
    await StatusBar.show();
  } catch (error) {
    console.error('Error showing status bar:', error);
  }
};

// Haptic feedback
export const hapticImpact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (!isNativePlatform()) return;

  try {
    const impactStyle = style === 'light' 
      ? ImpactStyle.Light 
      : style === 'heavy' 
      ? ImpactStyle.Heavy 
      : ImpactStyle.Medium;

    await Haptics.impact({ style: impactStyle });
  } catch (error) {
    console.error('Error triggering haptic:', error);
  }
};

export const hapticVibrate = async () => {
  if (!isNativePlatform()) return;

  try {
    await Haptics.vibrate();
  } catch (error) {
    console.error('Error triggering vibration:', error);
  }
};

export const hapticNotification = async (type: 'success' | 'warning' | 'error' = 'success') => {
  if (!isNativePlatform()) return;

  try {
    await Haptics.notification({ 
      type: type.toUpperCase() as any 
    });
  } catch (error) {
    console.error('Error triggering notification haptic:', error);
  }
};

// App lifecycle
export const addAppStateListener = (callback: (state: { isActive: boolean }) => void) => {
  if (!isNativePlatform()) return () => {};

  App.addListener('appStateChange', callback).then(listener => {
    return () => {
      listener.remove();
    };
  });
  
  return () => {};
};

export const addBackButtonListener = (callback: () => void) => {
  if (!isAndroid()) return () => {};

  App.addListener('backButton', callback).then(listener => {
    return () => {
      listener.remove();
    };
  });
  
  return () => {};
};

export const exitApp = () => {
  if (!isNativePlatform()) return;
  
  App.exitApp();
};

// Get app info
export const getAppInfo = async () => {
  if (!isNativePlatform()) {
    return {
      name: 'Diviso',
      version: '1.0.0',
      build: '1',
    };
  }

  try {
    const info = await App.getInfo();
    return info;
  } catch (error) {
    console.error('Error getting app info:', error);
    return null;
  }
};

// ===== Native Messaging Functions =====

/**
 * فتح تطبيق الرسائل مع رسالة جاهزة
 */
export const openSMSApp = (phone: string, message: string) => {
  const cleanedPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  
  // iOS uses & and Android uses ?
  const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const smsUrl = isIOSDevice 
    ? `sms:${cleanedPhone}&body=${encodedMessage}`
    : `sms:${cleanedPhone}?body=${encodedMessage}`;
  
  window.location.href = smsUrl;
};

/**
 * فتح واتساب مباشرة لرقم معين مع رسالة
 */
export const openWhatsAppDirect = (phone: string, message: string) => {
  // إزالة كل شيء ما عدا الأرقام
  let cleanedPhone = phone.replace(/\D/g, '');
  
  // إضافة رمز السعودية إذا لم يكن موجوداً
  if (!cleanedPhone.startsWith('966') && cleanedPhone.length === 9) {
    cleanedPhone = '966' + cleanedPhone;
  }
  if (cleanedPhone.startsWith('0')) {
    cleanedPhone = '966' + cleanedPhone.substring(1);
  }
  
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
  
  window.open(url, '_blank');
};

/**
 * فتح تليجرام للمشاركة (لا يدعم رقم محدد مباشرة)
 */
export const openTelegramShare = (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  const url = `https://t.me/share/url?url=${encodedMessage}`;
  
  window.open(url, '_blank');
};
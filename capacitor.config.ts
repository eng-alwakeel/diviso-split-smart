import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.diviso.app',
  appName: 'Diviso',
  webDir: 'dist',
  server: {
    // For development: use sandbox URL
    // url: 'https://3776a414-f124-4f36-83bd-711dd8d56f9a.lovableproject.com?forceHideBadge=true',
    // For production: comment out the url
    cleartext: true,
    allowNavigation: ['diviso.app', '*.lovableproject.com']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1A1C1E',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1A1C1E',
    },
    Camera: {
      ios: {
        NSCameraUsageDescription: 'نحتاج الوصول للكاميرا لمسح الفواتير',
        NSPhotoLibraryUsageDescription: 'نحتاج الوصول لمعرض الصور لتحميل الفواتير',
      },
      android: {
        permissions: ['camera', 'photos']
      }
    },
    Contacts: {
      ios: {
        NSContactsUsageDescription: 'نحتاج الوصول لجهات الاتصال لدعوة أصدقائك'
      }
    },
    Geolocation: {
      ios: {
        NSLocationWhenInUseUsageDescription: 'نحتاج موقعك لتحسين تجربة الاستخدام وعرض العروض القريبة منك',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'نحتاج موقعك لتتبع موقعك في الخلفية'
      }
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  // Deep linking configuration
  appUrlOpen: {
    // Custom scheme for deep links
    scheme: 'diviso',
    // Host for universal links
    host: 'diviso.app',
  },
};

export default config;

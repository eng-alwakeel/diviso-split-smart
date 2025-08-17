import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.diviso.app',
  appName: 'Diviso',
  webDir: 'dist',
  server: {
    url: 'https://diviso.app',
    cleartext: true,
    allowNavigation: ['diviso.app']
  },
  plugins: {
    Contacts: {
      permissions: ['contacts']
    }
  },
  android: {
    permissions: [
      'android.permission.READ_CONTACTS'
    ]
  },
  ios: {
    permissions: [
      'NSContactsUsageDescription'
    ]
  }
};

export default config;

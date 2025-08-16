import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.diviso.app',
  appName: 'Diviso',
  webDir: 'dist',
  server: {
    url: 'https://diviso.app',
    cleartext: true,
    allowNavigation: ['diviso.app']
  }
};

export default config;

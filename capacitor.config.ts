import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.diviso.app',
  appName: 'Diviso',
  webDir: 'dist',
  server: {
    url: 'https://app.diviso.co',
    cleartext: true,
    allowNavigation: ['app.diviso.co']
  }
};

export default config;

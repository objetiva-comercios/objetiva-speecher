import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.objetiva.speecher',
  appName: 'Objetiva Speecher',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  server: {
    cleartext: true,  // Required for HTTP to local network backend
  },
};

export default config;

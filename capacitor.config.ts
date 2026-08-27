import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.banglorecolletive.app',
  appName: 'Banglore Colletive',
  webDir: 'capacitor-www',
  server: {
    url: 'https://bangalorecollective.com/', 
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      backgroundColor: "#000000",
      showSpinner: false,
      androidScaleType: "CENTER_INSIDE"
    }
  }
};
export default config;
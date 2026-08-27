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
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false,
      androidScaleType: "CENTER_CROP"
    }
  }
};
export default config;
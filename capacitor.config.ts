import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.banglorecolletive.app',
  appName: 'Banglore Colletive',
  webDir: 'out',
  server: {
    url: 'https://ecommercode-w89a.vercel.app/userinterface/home/', 
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      androidScaleType: "CENTER_CROP"
    }
  }
};
export default config;
// components/BackButtonHandler.tsx
'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';

const HOME_ROUTES = ['/userinterface', '/userinterface/home'];
export default function BackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let handle: any;

    App.addListener('backButton', ({ canGoBack }) => {
      if (HOME_ROUTES.includes(pathname)) {
        // Already on home -> exit app
        App.exitApp();
      } else if (canGoBack) {
        // Let the webview history go back (About Us -> Home)
        window.history.back();
      } else {
        // No webview history left, force navigate to home
        router.push('/');
      }
    }).then((h) => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, [pathname, router]);

  return null;
}
'use client';

import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';

const HOME_ROUTES = ['/userinterface', '/userinterface/home'];
const HOME_ROUTE = '/userinterface/home';

function normalizePathname(pathname: string | null) {
  const normalized = pathname?.replace(/\/+$/, '');
  return normalized || '/';
}

export default function BackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let isActive = true;

    console.log('[BackButton] registering Capacitor listener');
    const listener = App.addListener('backButton', () => {
      if (!isActive) return;

      const currentPath = normalizePathname(pathnameRef.current);
      console.log('[BackButton] event received', { currentPath });
      if (HOME_ROUTES.includes(currentPath)) {
        void App.exitApp().then(() => {
          console.log('[BackButton] exitApp completed');
        }).catch((error) => {
          console.error('[BackButton] exitApp failed', error);
        });
        return;
      }

      console.log('[BackButton] redirecting to home');
      router.replace(HOME_ROUTE);
    });

    void listener.then(() => {
      console.log('[BackButton] Capacitor listener registered');
    }).catch((error) => {
      console.error('[BackButton] listener registration failed', error);
    });

    return () => {
      isActive = false;
      console.log('[BackButton] removing Capacitor listener');
      void listener.then((handle) => handle.remove());
    };
  }, [router]);

  return null;
}
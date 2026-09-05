'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const HOME_ROUTES = ['/userinterface', '/userinterface/home', '/userinterface/', '/userinterface/home/'];

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
    let removeListener: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) {
          return;
        }

        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('backButton', ({ canGoBack }) => {
          if (!isActive) return;

          const currentPath = normalizePathname(pathnameRef.current);
          console.log('[BackButton] event received', { currentPath, canGoBack });

          if (HOME_ROUTES.includes(currentPath)) {
            App.exitApp().catch((error) => {
              console.error('[BackButton] exitApp error', error);
            });
            return;
          }

          if (canGoBack) {
            router.back();
          } else {
            router.push('/userinterface/home');
          }
        });

        removeListener = () => {
          handle.remove();
        };
      } catch (error) {
        console.error('[BackButton] setup failed', error);
      }
    };

    setupListener();

    return () => {
      isActive = false;
      if (removeListener) {
        removeListener();
      }
    };
  }, [router]);

  return null;
}
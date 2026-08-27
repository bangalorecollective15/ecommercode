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

    const listener = App.addListener('backButton', () => {
      if (!isActive) return;

      const currentPath = normalizePathname(pathnameRef.current);
      if (HOME_ROUTES.includes(currentPath)) {
        void App.exitApp();
        return;
      }

      router.replace(HOME_ROUTE);
    });

    return () => {
      isActive = false;
      void listener.then((handle) => handle.remove());
    };
  }, [router]);

  return null;
}
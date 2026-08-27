// components/BackButtonHandler.tsx
'use client';

import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';

const HOME_ROUTES = ['/userinterface', '/userinterface/home'];
const HOME_ROUTE = '/userinterface/home';

export default function BackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const listener = App.addListener('backButton', () => {
      if (HOME_ROUTES.includes(pathnameRef.current)) {
        App.exitApp();
      } else {
        router.replace(HOME_ROUTE);
      }
    });

    return () => { void listener.then((handle) => handle.remove()); };
  }, [router]);

  return null;
}
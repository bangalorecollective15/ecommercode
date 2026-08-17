"use client";

import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { usePathname, useRouter } from "next/navigation";

// Routes where a back-press should exit the app instead of navigating back
const ROOT_ROUTES = ["/", "/userinterface/home"];

export default function BackButtonHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);

  // Keep a ref in sync so the listener (registered once) always reads the current path
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log("Capacitor App plugin not available in browser.");
      return;
    }

    let handle: any;

    const setupListener = async () => {
      handle = await App.addListener("backButton", () => {
        const isRoot = ROOT_ROUTES.includes(pathnameRef.current);

        if (!isRoot) {
          // Not on a root screen — just go back in-app
          router.back();
          return;
        }

        // On a root screen (Home) — nothing to go back to, so exit right away
        if (Capacitor.getPlatform() === "android") {
          App.exitApp();
        }
        // iOS: Apple doesn't allow programmatically quitting the app, so do nothing here
      });
    };

    setupListener();

    return () => {
      handle?.remove();
    };
  }, [router]);

  return null;
}
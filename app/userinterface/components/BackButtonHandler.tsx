"use client";
import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { usePathname, useRouter } from "next/navigation";

// Routes where a back-press should exit the app instead of navigating back
const ROOT_ROUTES = ["/", "/userinterface", "/userinterface/home"];

// Helper to clean up trailing slashes
function normalize(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export default function BackButtonHandler() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let handle: any;

    const setupListener = async () => {
      handle = await App.addListener("backButton", ({ canGoBack }) => {
        const currentPath = normalize(window.location.pathname); // Use window.location for absolute current truth
        const isRoot = ROOT_ROUTES.includes(currentPath);

        // If we are on a root route OR the native webview history stack cannot go back
        if (isRoot || !canGoBack) {
          if (Capacitor.getPlatform() === "android") {
            App.exitApp();
          }
        } else {
          router.back();
        }
      });
    };

    setupListener();

    return () => {
      handle?.remove();
    };
  }, [router, pathname]);

  return null;
}
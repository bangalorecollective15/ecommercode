"use client";
import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { usePathname, useRouter } from "next/navigation";

// Exact routes where a back-press should exit the app
const ROOT_ROUTES = ["/", "/userinterface", "/userinterface/home"];

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
      handle = await App.addListener("backButton", () => {
        const currentPath = normalize(window.location.pathname);
        const isRoot = ROOT_ROUTES.includes(currentPath);

        if (isRoot) {
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
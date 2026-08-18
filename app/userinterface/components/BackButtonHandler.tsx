"use client";
import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { usePathname, useRouter } from "next/navigation";

// Routes where a back-press should exit the app instead of navigating back
const ROOT_ROUTES = ["/", "/userinterface", "/userinterface/home"];

// Strip a trailing slash so "/userinterface/home/" and "/userinterface/home" match the same route
function normalize(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export default function BackButtonHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let handle: any;

    const setupListener = async () => {
      handle = await App.addListener("backButton", () => {
        const currentPath = normalize(pathnameRef.current);
        const isRoot = ROOT_ROUTES.includes(currentPath);

        if (!isRoot) {
          router.back();
          return;
        }

        if (Capacitor.getPlatform() === "android") {
          App.exitApp();
        }
      });
    };

    setupListener();

    return () => {
      handle?.remove();
    };
  }, [router]);

  return null;
}
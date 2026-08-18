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

  console.log("[BackButtonHandler] MOUNTED, pathname:", pathname);

  // Keep a ref in sync so the listener (registered once) always reads the current path
  useEffect(() => {
    console.log("[BackButtonHandler] pathname changed ->", pathname);
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    console.log("[BackButtonHandler] setup effect running. isNativePlatform:", Capacitor.isNativePlatform(), "platform:", Capacitor.getPlatform());

    if (!Capacitor.isNativePlatform()) {
      console.log("[BackButtonHandler] Capacitor App plugin not available in browser.");
      return;
    }

    let handle: any;

    const setupListener = async () => {
      handle = await App.addListener("backButton", () => {
        console.log("[BackButtonHandler] backButton event fired. current path:", pathnameRef.current);

        const isRoot = ROOT_ROUTES.includes(pathnameRef.current);
        console.log("[BackButtonHandler] isRoot:", isRoot);

        if (!isRoot) {
          console.log("[BackButtonHandler] Not root -> router.back()");
          router.back();
          return;
        }

        console.log("[BackButtonHandler] On root -> attempting exitApp(), platform:", Capacitor.getPlatform());
        if (Capacitor.getPlatform() === "android") {
          App.exitApp();
        } else {
          console.log("[BackButtonHandler] Not android, skipping exitApp (iOS restriction).");
        }
      });
      console.log("[BackButtonHandler] listener registered successfully.");
    };

    setupListener().catch((err) => {
      console.log("[BackButtonHandler] ERROR registering listener:", err);
    });

    return () => {
      console.log("[BackButtonHandler] cleanup, removing listener");
      handle?.remove();
    };
  }, [router]);

  return null;
}
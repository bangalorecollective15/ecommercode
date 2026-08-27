"use client";
import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { usePathname, useRouter } from "next/navigation";

// Include variations just in case
const ROOT_ROUTES = ["/", "/userinterface", "/userinterface/home"];

function normalize(path: string) {
  if (!path) return "/";
  // Remove trailing slashes and potential query params/hashes if any
  const cleanPath = path.split("?")[0].split("#")[0];
  if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
    return cleanPath.slice(0, -1);
  }
  return cleanPath;
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
        const rawPath = window.location.pathname;
        const currentPath = normalize(rawPath);
        
        // DEBUG: Check your IDE console / logcat to see what path it's reading
        console.log("RAW PATH:", rawPath, "NORMALIZED:", currentPath);

        // Check if it matches any root route or contains the home path indicator
        const isRoot = 
          ROOT_ROUTES.includes(currentPath) || 
          currentPath === "/userinterface/home" || 
          currentPath === "/userinterface";

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
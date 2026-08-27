"use client";
import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";

export default function BackButtonHandler() {
  const router = useRouter();

  useEffect(() => {
    // Only run on native Android/iOS
    if (!Capacitor.isNativePlatform()) return;

    let sub: any;

    const initListener = async () => {
      sub = await App.addListener("backButton", ({ canGoBack }) => {
        const path = window.location.pathname.replace(/\/$/, ""); // Strip trailing slash

        // Define exact root pages where the app should close
        const isHomeOrRoot = 
          path === "" || 
          path === "/" || 
          path === "/userinterface" || 
          path === "/userinterface/home";

        if (isHomeOrRoot) {
          // If we are on any home/root screen, exit the app
          App.exitApp();
        } else if (canGoBack) {
          // Otherwise, if history can go back, go back
          router.back();
        } else {
          // Absolute fallback: exit app if nowhere else to go
          App.exitApp();
        }
      });
    };

    initListener();

    return () => {
      if (sub) {
        sub.remove();
      }
    };
  }, [router]);

  return null;
}
"use client";
import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";

const HOME_PATHS = ["", "/", "/userinterface", "/userinterface/home"];

function normalizePath(pathname: string) {
  return pathname
    .replace(/\/$/, "")   // strip trailing slash
    .split("?")[0]        // strip query string
    .split("#")[0];       // strip hash
}

export default function BackButtonHandler() {
  const router = useRouter();
  const lastBackPress = useRef(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let sub: any;

    const initListener = async () => {
      sub = await App.addListener("backButton", ({ canGoBack }) => {
        const path = normalizePath(window.location.pathname);
        const isHomeOrRoot = HOME_PATHS.includes(path);

        if (isHomeOrRoot) {
          const now = Date.now();
          if (now - lastBackPress.current < 2000) {
            App.exitApp();
          } else {
            lastBackPress.current = now;
            // Optional: show a toast "Press back again to exit"
          }
          return;
        }

        if (canGoBack) {
          router.back();
        } else {
          App.exitApp();
        }
      });
    };

    initListener();

    return () => {
      if (sub) sub.remove();
    };
  }, [router]);

  return null;
}
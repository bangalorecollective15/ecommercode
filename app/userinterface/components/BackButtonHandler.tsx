"use client";
import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";

const HOME_PATHS = ["", "/", "/userinterface", "/userinterface/home"];

function normalizePath(pathname: string) {
  return pathname
    .replace(/\/$/, "")
    .split("?")[0]
    .split("#")[0];
}

export default function BackButtonHandler() {
  const router = useRouter();
  const lastBackPress = useRef(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      alert("Not native platform — listener not attached");
      return;
    }

    let sub: any;

    const initListener = async () => {
      sub = await App.addListener("backButton", ({ canGoBack }) => {
        const rawPath = window.location.pathname;
        const path = normalizePath(rawPath);
        const isHomeOrRoot = HOME_PATHS.includes(path);

        // TEMP DEBUG POPUP — remove after diagnosing
        alert(
          "BACK PRESSED\n" +
          "raw pathname: " + rawPath + "\n" +
          "normalized: " + path + "\n" +
          "isHomeOrRoot: " + isHomeOrRoot + "\n" +
          "canGoBack: " + canGoBack
        );

        if (isHomeOrRoot) {
          const now = Date.now();
          if (now - lastBackPress.current < 2000) {
            App.exitApp();
          } else {
            lastBackPress.current = now;
            alert("Press back again to exit");
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
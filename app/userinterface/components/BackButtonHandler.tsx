"use client";
import { useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";

const HOME_PATHS = ["", "/", "/userinterface", "/userinterface/home"];

function normalizePath(pathname: string) {
  return pathname.replace(/\/$/, "").split("?")[0].split("#")[0];
}

export default function BackButtonHandler() {
  const router = useRouter();
  const lastBackPress = useRef(0);

  useEffect(() => {
    let sub: any;
    let cancelled = false;

    const waitForNative = async () => {
      // Poll up to ~3 seconds for the native bridge to be ready
      for (let i = 0; i < 30; i++) {
        if (Capacitor.isNativePlatform()) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return Capacitor.isNativePlatform();
    };

    const initListener = async () => {
      const isNative = await waitForNative();
      alert("isNativePlatform after poll: " + isNative); // TEMP DEBUG

      if (!isNative || cancelled) return;

      sub = await App.addListener("backButton", ({ canGoBack }) => {
        const path = normalizePath(window.location.pathname);
        const isHomeOrRoot = HOME_PATHS.includes(path);

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
      cancelled = true;
      if (sub) sub.remove();
    };
  }, [router]);

  return null;
}
"use client";

import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { useRouter } from "next/navigation";

const HOME_PATHS = [
  "",
  "/",
  "/userinterface",
  "/userinterface/home",
];

function normalizePath(pathname: string): string {
  const pathWithoutQuery = pathname.split("?")[0].split("#")[0];

  if (pathWithoutQuery === "/") {
    return "";
  }

  return pathWithoutQuery.replace(/\/+$/, "");
}

export default function BackButtonHandler() {
  const router = useRouter();
  const lastBackPress = useRef(0);
  const listenerRef = useRef<PluginListenerHandle | null>(null);

  useEffect(() => {
    let mounted = true;

    const setupBackButton = async () => {
      // Check whether we are actually running inside Capacitor.
      const platform = Capacitor.getPlatform();
      const isNative = Capacitor.isNativePlatform();

      console.log(
        "[BackButtonHandler]",
        "Platform:",
        platform,
        "Native:",
        isNative
      );

      // Running in normal browser — don't attach native listener.
      if (!isNative) {
        console.log(
          "[BackButtonHandler] Not running as a native Capacitor app."
        );
        return;
      }

      try {
        // Wait until Capacitor's App plugin is ready.
        await App.getInfo();

        if (!mounted) {
          return;
        }

        listenerRef.current = await App.addListener(
          "backButton",
          ({ canGoBack }) => {
            const rawPath = window.location.pathname;
            const path = normalizePath(rawPath);

            const isHomeOrRoot = HOME_PATHS.includes(path);

            console.log("[BackButtonHandler] BACK PRESSED", {
              rawPath,
              normalizedPath: path,
              isHomeOrRoot,
              canGoBack,
            });

            // ---------------------------------------
            // HOME PAGE
            // ---------------------------------------
            if (isHomeOrRoot) {
              const now = Date.now();

              // Press back twice within 2 seconds -> exit app
              if (now - lastBackPress.current < 2000) {
                console.log(
                  "[BackButtonHandler] Second back press -> exiting app"
                );

                App.exitApp();
                return;
              }

              // First back press
              lastBackPress.current = now;

              console.log(
                "[BackButtonHandler] First back press -> press again to exit"
              );

              // Simple Android toast-like browser alert.
              // You can replace this later with your own toast.
              alert("Press back again to exit");

              return;
            }

            // ---------------------------------------
            // OTHER PAGES
            // ---------------------------------------
            if (canGoBack) {
              console.log(
                "[BackButtonHandler] Going back to previous page"
              );

              router.back();
              return;
            }

            // ---------------------------------------
            // NO HISTORY
            // ---------------------------------------
            console.log(
              "[BackButtonHandler] No browser history -> exiting app"
            );

            App.exitApp();
          }
        );

        console.log(
          "[BackButtonHandler] Capacitor back button listener attached."
        );
      } catch (error) {
        console.error(
          "[BackButtonHandler] Failed to attach listener:",
          error
        );
      }
    };

    setupBackButton();

    return () => {
      mounted = false;

      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }

      console.log("[BackButtonHandler] Listener removed.");
    };
  }, [router]);

  return null;
}
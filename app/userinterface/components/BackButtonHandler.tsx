"use client";
import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";

const ROOT_ROUTES = ["/", "/userinterface", "/userinterface/home"];

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

    // Fires immediately so you can confirm this effect even ran
    toast(`BackButtonHandler active. platform: ${Capacitor.getPlatform()}`, { duration: 3000 });

    let handle: any;

    const setupListener = async () => {
      try {
        handle = await App.addListener("backButton", () => {
          const currentPath = pathnameRef.current;
          const isRoot = ROOT_ROUTES.includes(currentPath);

          toast(`path: ${currentPath} | isRoot: ${isRoot}`, { duration: 3000 });

          if (!isRoot) {
            router.back();
            return;
          }

          if (Capacitor.getPlatform() === "android") {
            toast("Calling App.exitApp() now...", { duration: 2000 });
            App.exitApp();
          }
        });
        toast("Listener registered OK", { duration: 2000 });
      } catch (err: any) {
        toast.error(`Listener FAILED: ${err?.message || String(err)}`, { duration: 6000 });
      }
    };

    setupListener();

    return () => {
      handle?.remove();
    };
  }, [router]);

  return null;
}
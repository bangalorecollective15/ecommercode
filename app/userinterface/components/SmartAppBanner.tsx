"use client";

import { useEffect, useState } from "react";
import { X, Download, ArrowRight } from "lucide-react";
import { getMobileOS } from "@/lib/platform";

const APP_SCHEME = "banglorecollective";
const ANDROID_PACKAGE = "com.banglorecolletive.app";
const ANDROID_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=com.banglorecolletive.app`;

interface SmartAppBannerProps {
  /** Path (no domain) the app should deep-link straight into, e.g. /userinterface/product/123 */
  path: string;
  dismissedKey?: string;
}

export default function SmartAppBanner({ path, dismissedKey = "hideAppBanner" }: SmartAppBannerProps) {
  const [visible, setVisible] = useState(false);
  const [isNative, setIsNative] = useState<boolean | null>(null);

  // Detect whether we're already running inside the Capacitor app shell.
  // If so, this IS the app — no banner needed at all.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
          if (!cancelled) setIsNative(true);
          return;
        }

        const { Capacitor } = await import("@capacitor/core");
        if (!cancelled) setIsNative(Capacitor.isNativePlatform());
      } catch {
        if (!cancelled) setIsNative(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Show the banner once we know: an Android browser, not already inside
  // the app, not dismissed this session.
  useEffect(() => {
    if (isNative !== false) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(dismissedKey) === "1") return;

    // Guard against running inside app webviews
    const ua = navigator.userAgent || "";
    if (ua.includes("com.banglorecolletive.app") || ua.includes("Capacitor") || ua.includes("AndroidBridge")) {
      return;
    }

    const detectedOs = getMobileOS();
    if (detectedOs !== "android") return; // Android-only banner

    setVisible(true);
  }, [isNative, dismissedKey]);

  if (!visible) return null;

  const cleanPath = path.replace(/^\//, "");
  const fallbackUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${cleanPath}`
    : `https://bangalorecollective.com/${cleanPath}`;

  const dismiss = () => {
    sessionStorage.setItem(dismissedKey, "1");
    setVisible(false);
  };

  const openInApp = () => {
    const intentUrl =
      `intent://${cleanPath}#Intent;scheme=${APP_SCHEME};` +
      `package=${ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
    window.location.href = intentUrl;
  };

  return (
    <div className="fixed top-0 inset-x-0 z-[998] bg-brand-blue dark:bg-white text-white dark:text-slate-900 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-white/15 dark:bg-black/10 rounded-lg flex-shrink-0">
          <Download size={16} />
        </div>
        <p className="text-xs font-bold truncate">
          Open this in the Banglore Collective app for the full experience
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={openInApp}
          className="px-3 py-1.5 rounded-lg bg-white/20 dark:bg-black/10 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap flex items-center gap-1"
        >
          Open App <ArrowRight size={12} />
        </button>
        <a
          href={ANDROID_PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-white/10 dark:bg-black/5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
        >
          Get App
        </a>
        <button onClick={dismiss} aria-label="Dismiss" className="p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
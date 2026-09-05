"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { getMobileOS } from "@/lib/platform";

// ─────────────────────────────────────────────────────────────────────────
// Replace these with your real values.
// APP_SCHEME must match the custom URL scheme registered for your app
// (Android: intent-filter in AndroidManifest.xml, iOS: CFBundleURLSchemes
// in Info.plist). It does NOT have to match capacitor.config.ts's appId,
// but keeping them related is a good convention.
// ─────────────────────────────────────────────────────────────────────────
const APP_SCHEME = "banglorecollective";
const IOS_APP_STORE_URL = "https://apps.apple.com/app/idXXXXXXXXX";
const ANDROID_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.banglorecollective.app";

interface SmartAppBannerProps {
  /** Path (no domain) the app should deep-link straight into, e.g. /userinterface/product/123 */
  path: string;
  dismissedKey?: string;
}

export default function SmartAppBanner({ path, dismissedKey = "hideAppBanner" }: SmartAppBannerProps) {
  const [visible, setVisible] = useState(false);
  const [os, setOs] = useState<"ios" | "android" | "other">("other");
  const [isNative, setIsNative] = useState<boolean | null>(null);

  // Detect whether we're already running inside the Capacitor app shell.
  // If so, this IS the app — no banner, no redirect needed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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

  useEffect(() => {
    if (isNative !== false) return; // still checking, or already inside the app
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(dismissedKey) === "1") return;

    const detectedOs = getMobileOS();
    setOs(detectedOs);
    if (detectedOs === "other") return; // desktop browser — nothing to hand off to

    // Attempt a silent handoff into the installed app first. If the app
    // isn't installed, the OS just ignores the custom scheme and the
    // browser stays put, so we show the banner shortly after as a fallback.
    const deepLink = `${APP_SCHEME}://${path.replace(/^\//, "")}`;
    let handedOff = false;

    const onVisibilityChange = () => {
      if (document.hidden) handedOff = true;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const attempt = window.setTimeout(() => {
      window.location.href = deepLink;
    }, 50);

    const revealBanner = window.setTimeout(() => {
      if (!handedOff) setVisible(true);
    }, 1200);

    return () => {
      window.clearTimeout(attempt);
      window.clearTimeout(revealBanner);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isNative, path, dismissedKey]);

  if (!visible) return null;

  const storeUrl = os === "ios" ? IOS_APP_STORE_URL : ANDROID_PLAY_STORE_URL;

  const dismiss = () => {
    sessionStorage.setItem(dismissedKey, "1");
    setVisible(false);
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
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-white/20 dark:bg-black/10 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
        >
          Get the app
        </a>
        <button onClick={dismiss} aria-label="Dismiss" className="p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
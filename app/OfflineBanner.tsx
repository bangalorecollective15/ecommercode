"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

// Catches the case native Android error handling CAN'T see: when the user is
// already inside the app and taps a tab (Home, Videos, Fashion Studio, etc).
// Next.js does this as a background JS fetch, not a full page reload — so if
// there's no internet, the fetch just fails silently and the old page stays
// frozen on screen with no feedback. This component watches the browser's
// online/offline state directly and shows a banner the moment it drops,
// regardless of which page/tab the user is currently on.
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Set initial state correctly on mount (covers the case where JS loads
    // while already offline, e.g. a stale cached page).
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full z-[9999] flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold tracking-wide text-white"
      style={{ backgroundColor: "#0f172a" }} // slate-900, matches your header/button branding
      role="alert"
    >
      <WifiOff size={14} />
      <span>No internet connection — some content may not load</span>
    </div>
  );
}
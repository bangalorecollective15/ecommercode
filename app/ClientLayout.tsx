"use client";

import "./globals.css";
import Sidebar from "@/app/components/Sidebar";
import Header from "@/app/components/Header";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BackButtonHandler from "@/app/userinterface/components/BackButtonHandler";
import { Toaster } from "react-hot-toast";

type UserRole = "admin" | "subadmin";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [role, setRole] = useState<"admin" | "subadmin" | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedRole = localStorage.getItem("userRole") as "admin" | "subadmin" | null;

    const isPublicPage =
      pathname.startsWith("/login") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/userinterface");

    // 1. If not logged in and not on a public page, go to login
    if (!isLoggedIn && !isPublicPage) {
      router.replace("/login");
      return;
    }

    // 2. Set the role if it exists, otherwise leave it null
    if (storedRole) {
      setRole(storedRole);
    }

    // 3. Mark auth as complete so the UI can render
    setAuthLoading(false);
  }, [pathname, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLaunchScreen(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  // Prevent Hydration Mismatch: Render a simple fragment placeholder until mounted
  if (!mounted) {
    return null; 
  }

  // Double check your layout hiding condition logic
  const hideLayout =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/userinterface");

  return (
    <>
      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{
          top: 20,
          zIndex: 999999,
        }}
        toastOptions={{
          duration: 2500,
          style: {
            background: "rgba(15,23,42,0.95)",
            color: "#fff",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "14px 18px",
            fontWeight: "600",
            fontSize: "14px",
          },
        }}
      />

      {showLaunchScreen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black">
          <img
            src="/logowhite.png"
            alt="Bangalore Collective"
            className="w-[82vw] max-w-[760px] object-contain"
          />
        </div>
      )}

      <BackButtonHandler />
      
      {hideLayout ? (
        <div className="w-full h-full overflow-auto">
          {children}
        </div>
      ) : (
        <div className="flex w-full h-full">
          {!authLoading && (
            <>
              <Sidebar role={role || "admin"} />

              <div className="flex-1 flex flex-col h-screen min-w-0">
                <Header /> 
                <main className="flex-1 overflow-auto p-2">
                  {children}
                </main>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
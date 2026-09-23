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
      pathname === "/" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/userinterface") ||
      pathname.startsWith("/product") ||
      pathname.startsWith("/category");

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

  const hideLayout =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/userinterface") ||
    pathname.startsWith("/product") ||
    pathname.startsWith("/category");

  // For public storefront pages, render children immediately (enabling full SSR)
  if (hideLayout) {
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
        <BackButtonHandler />
        <div className="w-full h-full overflow-auto">
          {children}
        </div>
      </>
    );
  }

  // For protected admin pages, show an admin shell skeleton while auth is verified
  if (!mounted || authLoading) {
    return (
      <div className="flex w-full h-full bg-slate-50 dark:bg-slate-950 animate-pulse">
        <div className="w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:block" />
        <div className="flex-1 flex flex-col h-screen">
          <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />
          <div className="flex-1 p-6 space-y-4">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <BackButtonHandler />

      <div className="flex w-full h-full">
        <Sidebar role={role || "admin"} />
        <div className="flex-1 flex flex-col h-screen min-w-0">
          <Header /> 
          <main className="flex-1 overflow-auto p-2">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
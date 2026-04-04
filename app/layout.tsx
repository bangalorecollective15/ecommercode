"use client";

import "./globals.css";
import Sidebar from "@/app/components/Sidebar";
import Header from "@/app/components/Header";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
type UserRole = "admin" | "subadmin";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
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

  // Prevent Hydration Mismatch
  if (!mounted) return <html lang="en"><body></body></html>;

  const hideLayout =
    pathname.startsWith("/login") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/userinterface");

  return (
    <html lang="en">
      <body className="h-screen flex overflow-hidden bg-white">
        {hideLayout ? (
          <div className="w-full h-full overflow-auto">
            {children}
          </div>
        ) : (
          <div className="flex w-full h-full">
            {/* Show UI once the check is done, regardless of if 'role' is null */}
            {!authLoading && (
              <>
                {/* Pass role or a default 'admin' string if you want the sidebar always visible */}
                <Sidebar role={role || "admin"} />

                <div className="flex-1 flex flex-col h-screen min-w-0">
                  <Header /> {/* This child will now respect the boundaries */}
                  <main className="flex-1 overflow-auto p-2">
                    {children}
                  </main>
                </div>
              </>
            )}
          </div>
        )}
      </body>
    </html>
  );
}
"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "../globals.css";

export default function UserInterfaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages where header/footer should be hidden
  const hideLayout = pathname === "/userinterface" || pathname === "/userinterface/login";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {!hideLayout && <Header />}

      {/* We use pt-32 (8rem / 128px) to account for:
        1. top-4 (1rem) header offset
        2. h-20 (5rem) header height
        3. extra breathing room (2rem)
      */}
      <main className={`flex-1 transition-all duration-300 ${hideLayout ? "pt-0" : "pt-[10px]"}`}>
        {children}
      </main>

      {!hideLayout && <Footer />}
    </div>
  );
}
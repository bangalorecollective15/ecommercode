"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, ShieldCheck } from "lucide-react";

export default function Header() {
  const [userInfo, setUserInfo] = useState<{ email: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("userRole");
    const email = localStorage.getItem("userEmail");

    if (isLoggedIn !== "true") {
      router.replace("/login");
      return;
    }

    setUserInfo({
      email: email || "admin@panel.com",
      role: role || "Admin",
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    router.replace("/login");
  };

  return (
    /* FIX: Changed w-full to w-auto + min-w-0 to let the flex-parent control it.
       Added 'max-w-full' to prevent horizontal bleed.
    */
    <header className="min-w-0 max-w-full bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 md:px-10 py-3 md:py-4 flex justify-between items-center sticky top-0 z-50 overflow-hidden">
      
      {/* LEFT */}
      <div className="flex items-center gap-6 min-w-0">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 flex-shrink-0">
          <ShieldCheck size={12} className="text-black" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap">
            Secure Session
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 md:gap-8 flex-shrink-0">
        {!userInfo ? (
          <div className="flex items-center gap-3">
            <div className="animate-pulse bg-gray-100 w-24 h-2 rounded-full hidden md:block"></div>
            <div className="animate-pulse bg-gray-200 w-8 h-8 rounded-full"></div>
          </div>
        ) : (
          <div className="flex items-center gap-4 md:gap-6">
            
            {/* USER INFO */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-black leading-none">
                {userInfo.role}
              </span>
              <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                {userInfo.email.split("@")[0]}
              </span>
            </div>

            <div className="h-8 w-[1px] bg-gray-100 hidden md:block"></div>

            {/* AVATAR */}
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-black flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <User size={16} strokeWidth={2.5} />
            </div>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 bg-white border-2 border-black hover:bg-black text-black hover:text-white px-3 md:px-5 py-1.5 md:py-2 rounded-xl transition-all active:scale-95 flex-shrink-0"
            >
              <LogOut size={14} />
              <span className="text-[10px] font-black uppercase hidden md:inline">
                Sign Out
              </span>
            </button>

          </div>
        )}
      </div>
    </header>
  );
}
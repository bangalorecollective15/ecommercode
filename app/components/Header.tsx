"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle, ShieldCheck } from "lucide-react";

export default function Header() {
  const [userInfo, setUserInfo] = useState<{ email: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");

    if (isLoggedIn !== "true" || !email || !role) {
      router.push("/login");
      return;
    }

    setUserInfo({ email, role });
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <header className="w-full bg-white border-b border-slate-100 px-8 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      {/* Brand Identity / Breadcrumb Placeholder */}
      <div className="hidden md:flex items-center gap-2">
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
          <ShieldCheck className="text-white" size={18} />
        </div>
        <span className="text-sm font-black text-slate-800 tracking-tighter uppercase">
          Admin <span className="text-orange-600">Panel</span>
        </span>
      </div>

      {!userInfo ? (
        <div className="flex items-center gap-3 ml-auto">
          <div className="animate-pulse bg-slate-100 w-24 h-4 rounded-full"></div>
          <div className="animate-pulse bg-slate-200 w-10 h-10 rounded-xl"></div>
        </div>
      ) : (
        <div className="flex items-center gap-6 ml-auto">
          {/* User Details */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">
                {userInfo.role}
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">
                {userInfo.email}
              </p>
            </div>
            
            {/* Avatar Decoration */}
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group hover:border-orange-200 hover:bg-orange-50 transition-colors">
              <UserCircle size={24} className="group-hover:text-orange-600 transition-colors" />
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="h-8 w-[1px] bg-slate-100 hidden sm:block"></div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-orange-100"
          >
            <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">LOGOUT</span>
          </button>
        </div>
      )}
    </header>
  );
}
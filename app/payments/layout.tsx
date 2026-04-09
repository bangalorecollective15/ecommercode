"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Header from "@/app/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<"admin" | "subadmin">("admin");

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") as "admin" | "subadmin";
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fcfcfc]">
      <Sidebar role={role} /> 
      
      <div className="flex flex-col flex-1 overflow-x-hidden overflow-y-auto">
        <Header />
        <main className="p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
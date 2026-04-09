"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart, ClipboardList, ListTree, Package,
  Megaphone, FileText, Users, Shield, Lock,
  LogOut, ChevronRight, LayoutDashboard, QrCode,
  CreditCard, CheckCircle, Sparkles
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "subadmin";
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const menu = [
    { label: "Overview", href: "/dashboard", icon: <LayoutDashboard size={16} /> },
    { label: "POS", href: "/pos", icon: <ClipboardList size={16} /> },
    { label: "Orders", href: "/orderupdate", icon: <ShoppingCart size={16} /> },
    
    {
      label: "Payments",
      icon: <CreditCard size={16} />,
      subMenu: [
        { label: "UPI Scanner", href: "/payments/upi-scanner", icon: <QrCode size={14} /> },
        { label: "Pay Approvals", href: "/payments/approvals", icon: <CheckCircle size={14} /> },
      ],
    },

    {
      label: "Brand",
      icon: <Shield size={16} />,
      subMenu: [
        { label: "New Brands", href: "/brands/newbrands" },
        { label: "List Brands", href: "/brands/listbrands" },
      ],
    },
    {
      label: "Category",
      icon: <ListTree size={16} />,
      subMenu: [
        { label: "Main category", href: "/categorysetup/category" },
        { label: "subcategory", href: "/categorysetup/subcategory" },
        { label: "Deep subcategory", href: "/categorysetup/subsubcategory" },
      ],
    },
    {
      label: "Products",
      icon: <Package size={16} />,
      subMenu: [
        { label: "Add New", href: "/products/addproducts" },
        { label: "All Products", href: "/products/listproducts" },
        { label: "Bulk Upload", href: "/products/bulkupload" },
        { label: "Stock", href: "/products/restock" },
        { label: "Attributes", href: "/attribute" },
      ],
    },
    {
      label: "Home page",
      icon: <Megaphone size={16} />,
      subMenu: [
        { label: "Banner Sections", href: "/hero" },
        { label: "Top Sections", href: "/banner" },
        { label: "Instagram", href: "/insta" },
      ],
    },
    { label: "Admin Creations", href: "/createsub", icon: <Lock size={16} /> },
    {
      label: "Reports",
      icon: <FileText size={16} />,
      subMenu: [
        { label: "Product Stats", href: "/productreport" },
        { label: "Order Stats", href: "/orderreport" },
      ],
    },
    { label: "User", href: "/customer", icon: <Users size={16} /> },
  ];

  useEffect(() => {
    menu.forEach((item) => {
      if (item.subMenu) {
        const isSubItemActive = item.subMenu.some((sub) => pathname === sub.href);
        if (isSubItemActive) setOpenMenu(item.label);
      }
    });
  }, [pathname]);

  const filteredMenu = role === "subadmin" 
    ? menu.filter(m => ["Overview", "POS", "Orders", "Products", "Payments"].includes(m.label)) 
    : menu;

  return (
    <aside className="w-64 h-screen bg-brand-blue text-white flex flex-col sticky top-0 z-50 selection:bg-brand-gold selection:text-brand-blue shadow-2xl">
      
      {/* 1. BRANDING SECTION */}
      <div className="pt-12 pb-10 px-8 flex flex-col items-center">
        <div className="w-full flex justify-center mb-6">
          <img 
            src="/banglorecollectivelogo.jpg" 
            alt="Logo" 
            className="h-12 w-auto object-contain brightness-0 invert" 
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={10} className="text-brand-gold" />
          <span className="text-[8px] font-black uppercase tracking-[0.5em] text-brand-gold/60">Executive Portal</span>
        </div>
        <div className="h-[1px] w-12 bg-white/10" />
      </div>

      {/* 2. NAVIGATION SECTION */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
        {filteredMenu.map((item) => {
          const isCurrentPath = pathname === item.href;
          const isSubMenuChildActive = item.subMenu?.some((sub) => pathname === sub.href);
          const isParentActive = isCurrentPath || isSubMenuChildActive;
          
          return (
            <div key={item.label} className="group">
              {item.subMenu ? (
                <div className="mb-1">
                  <button
                    onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}
                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300
                    ${isParentActive ? "bg-brand-gold text-white shadow-lg shadow-black/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`${isParentActive ? "text-white" : "text-brand-gold/70"}`}>{item.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                    </div>
                    <ChevronRight size={12} className={`transition-transform duration-500 ${openMenu === item.label ? "rotate-90 text-white" : "opacity-30"}`} />
                  </button>
                  
                  {openMenu === item.label && (
                    <div className="mt-1 ml-6 flex flex-col gap-1 border-l border-white/10">
                      {item.subMenu.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className={`
                              relative block px-6 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-all
                              ${isSubActive ? "text-brand-gold" : "text-white/40 hover:text-white hover:translate-x-1"}
                            `}
                          >
                            {isSubActive && (
                              <span className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[2px] h-3 bg-brand-gold" />
                            )}
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href!}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl mb-1 transition-all duration-300
                  ${pathname === item.href ? "bg-brand-gold text-white shadow-lg shadow-black/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                >
                  <span className={`${pathname === item.href ? "text-white" : "text-brand-gold/70"}`}>{item.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* 3. FOOTER SECTION */}
      <div className="p-6 border-t border-white/5 bg-brand-blue/50 backdrop-blur-sm">
        <button
          onClick={() => window.location.href = "/login"}
          className="group w-full py-4 bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-brand-gold hover:text-white transition-all active:scale-[0.97] flex items-center justify-center gap-3"
        >
          <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
          End Session
        </button>
      </div>
    </aside>
  );
}
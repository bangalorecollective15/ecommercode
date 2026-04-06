"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  ClipboardList,
  ListTree,
  Package,
  Megaphone,
  FileText,
  Users,
  Shield,
  Lock,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  QrCode,        // Added for UPI
  CreditCard,    // Added for Payments
  CheckCircle    // Added for Approvals
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
    
    // NEW: PAYMENTS SECTION
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
        if (isSubItemActive) {
          setOpenMenu(item.label);
        }
      }
    });
  }, [pathname]);

  // Updated Filter: Added "Payments" to subadmin visibility
  const filteredMenu = role === "subadmin" 
    ? menu.filter(m => ["Overview", "POS", "Orders", "Products", "Payments"].includes(m.label)) 
    : menu;

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col sticky top-0 z-50 selection:bg-black selection:text-white">
      
      {/* 1. BRANDING */}
      <div className="pt-10 pb-8 px-6 flex flex-col items-center">
        <div className="w-full flex justify-center mb-5">
          <img 
            src="/banglorecollectivelogo.jpg" 
            alt="Logo" 
            className="h-14 w-auto object-contain brightness-0" 
          />
        </div>
        <div className="h-[1.5px] w-8 bg-black mb-3" />
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">Admin Panel</span>
      </div>

      {/* 2. NAVIGATION */}
      <nav className="flex-1 px-5 space-y-1.5 overflow-y-auto no-scrollbar">
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
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300
                    ${isParentActive ? "bg-black text-white shadow-xl shadow-black/10" : "text-black hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-[10px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                    </div>
                    <ChevronRight size={12} className={`transition-transform duration-500 ${openMenu === item.label ? "rotate-90" : "opacity-30"}`} />
                  </button>
                  
                  {openMenu === item.label && (
                    <div className="mt-1 ml-9 flex flex-col gap-1 border-l-2 border-gray-100/50">
                      {item.subMenu.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className={`
                              relative block px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all
                              ${isSubActive 
                                ? "text-black bg-gray-50 rounded-r-lg" 
                                : "text-black hover:bg-gray-50/50 rounded-r-lg"
                              }
                            `}
                          >
                            {isSubActive && (
                              <span className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-0.5 h-4 bg-black rounded-full" />
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-300
                  ${pathname === item.href ? "bg-black text-white shadow-xl shadow-black/10" : "text-black hover:bg-gray-50"}`}
                >
                  {item.icon}
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* 3. FOOTER */}
      <div className="p-6">
        <div className="bg-gray-50/50 rounded-[1.5rem] p-5 flex flex-col items-center border border-gray-100/50">
          <button
            onClick={() => window.location.href = "/login"}
            className="w-full py-3 bg-white border border-black text-black text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-black hover:text-white transition-all active:scale-[0.97] shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
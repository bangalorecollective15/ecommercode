"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

import {
  Home,
  ShoppingCart,
  ClipboardList,
  ListTree,
  Package,
  Megaphone,
  FileText,
  Users,
  Shield,
  Lock,
  UserCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "subadmin";
}

interface MenuItem {
  label: string;
  icon?: ReactNode;
  href?: string;
  subMenu?: MenuItem[];
}

export default function Sidebar({ role }: SidebarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [active, setActive] = useState<string>("Dashboard");

  const toggle = (menu: string) =>
    setOpenMenu(openMenu === menu ? null : menu);

  const handleClick = (label: string) => setActive(label);

  const menu: MenuItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <Home size={18} /> },
    { label: "POS", href: "/pos", icon: <ClipboardList size={18} /> },
    { label: "Orders", href: "/orderupdate", icon: <ShoppingCart size={18} /> },

    {
      label: "Brand",
      icon: <Shield size={18} />,
      subMenu: [
        { label: "Add Brands", href: "/brands/newbrands" },
        { label: "List Brands", href: "/brands/listbrands" },
      ],
    },

    {
      label: "Category",
      icon: <ListTree size={18} />,
      subMenu: [
        { label: "Category", href: "/categorysetup/category" },
        { label: "Sub Category", href: "/categorysetup/subcategory" },
        { label: "Sub-Sub Category", href: "/categorysetup/subsubcategory" },
      ],
    },

    {
      label: "In-House Products",
      icon: <Package size={18} />,
      subMenu: [
        { label: "Add Product", href: "/products/addproducts" },
        { label: "View Product", href: "/products/listproducts" },
        { label: "Re-stock Product", href: "/products/restock" },
        { label: "Attribute", href: "/attribute" },
      ],
    },

    {
      label: "Homepage Setup",
      icon: <Megaphone size={18} />,
      subMenu: [
        { label: "Banner", href: "/hero" },
        { label: "Top Section", href: "/banner" },
        { label: "Notification", href: "/notification" },
        { label: "Instagram Feed", href: "/insta" },
      ],
    },

    {
      label: "Create Credentials",
      href: "/createsub",
      icon: <Lock size={18} />,
    },

    {
      label: "Reports",
      icon: <FileText size={18} />,
      subMenu: [
        { label: "Product Report", href: "/productreport" },
        { label: "Order Report", href: "/orderreport" },
      ],
    },

    { label: "Customers", href: "/customer", icon: <Users size={18} /> },
  ];

  const filteredMenu =
    role === "subadmin"
      ? menu.filter((item) =>
        [
          "Dashboard",
          "POS",
          "Orders",
          "Category",
          "In-House Products",
        ].includes(item.label)
      )
      : menu;

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col justify-between shadow-sm">

      {/* Logo */}
      <div>
        <div className="flex justify-center py-6 border-b">
          <Image
            src="/logo.png"
            width={150}
            height={50}
            style={{ height: 'auto' }} // Add this to maintain aspect ratio
            alt="Logo"
            priority // Adding priority since it's likely above the fold
          />
        </div>

        {/* Menu */}
        <nav className="mt-4 px-2 space-y-1">

          {filteredMenu.map((item) => (
            <div key={item.label}>

              {/* Parent Menu */}
              {item.subMenu ? (
                <>
                  <button
                    onClick={() => toggle(item.label)}
                    className={`flex items-center justify-between w-full px-4 py-2 rounded-lg transition
                    ${openMenu === item.label
                        ? "bg-orange-100 text-orange-600"
                        : "hover:bg-gray-100"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    </div>

                    {openMenu === item.label ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>

                  {/* Sub Menu */}
                  {openMenu === item.label && (
                    <div className="ml-7 mt-1 space-y-1 border-l pl-3">

                      {item.subMenu.map((sub) => (
                        <Link
                          key={sub.label}
                          href={sub.href!}
                          onClick={() => handleClick(sub.label)}
                          className={`block text-sm px-3 py-2 rounded-md transition
                          ${active === sub.label
                              ? "bg-orange-100 text-orange-600 font-medium"
                              : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                          {sub.label}
                        </Link>
                      ))}

                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href!}
                  onClick={() => handleClick(item.label)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition
                  ${active === item.label
                      ? "bg-orange-100 text-orange-600"
                      : "hover:bg-gray-100"
                    }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </div>
          ))}

        </nav>
      </div>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={() => (window.location.href = "/login")}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg
          text-red-500 hover:bg-red-50 transition font-medium"
        >
          <UserCircle size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
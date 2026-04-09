"use client";

import { ShoppingCart, User, Heart, ChevronDown, LogOut, Package, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import AuthModal from "../components/AuthModal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SubSubCategory { id: number; name: string; }
interface SubCategory { id: number; name: string; sub_subcategories: SubSubCategory[]; }
interface Category { id: number; name: string; subcategories: SubCategory[]; }

export default function Header() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [banner, setBanner] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: bData } = await supabase.from("banner").select("*").eq("active", true).limit(1).single();
      if (bData) setBanner(bData);

      // Updated fetch to include sub_subcategories
      const { data: catData } = await supabase.from("categories").select(`
          id, name, 
          subcategories (id, name, sub_subcategories (id, name))
        `).order('priority', { ascending: true });
      if (catData) setCategories(catData as any);
    };

    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setDropdownOpen(false);
      router.push("/userinterface/home");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-31 bg-white z-[40] shadow-sm" />

      <header className="fixed top-0 left-0 w-full z-50">
        {banner && (
          <div className="w-full py-2 overflow-hidden backdrop-blur-lg border-b border-white/20 shadow-lg"
            style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
          >
            <div className="flex whitespace-nowrap">
              <div className="flex animate-marquee gap-8 items-center">
                <p className="text-[9px] font-black uppercase tracking-[0.4em]">{banner.title}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.4em]">{banner.title}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.4em]">{banner.title}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.4em]">{banner.title}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.4em]">{banner.title}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.4em]">{banner.title}</p>

              </div>
            </div>
            <style jsx>{`
              @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-33.33%); } }
              .animate-marquee { animation: marquee 20s linear infinite; }
            `}</style>
          </div>
        )}

        <div className="w-full backdrop-blur-xl bg-brand-gold border-b border-white/40 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">

            <Link href="/userinterface/home" className="flex-shrink-0 transition-transform hover:scale-105 active:scale-95">
              <Image
                src="/removebglogo.png"
                alt="Logo"
                width={200} // Increased from 140
                height={70}  // Increased from 50
                className="h-16 w-auto object-contain" // Changed h-10 to h-16
                priority
              />
            </Link>

            <nav className="hidden lg:flex items-center gap-3">
              <Link href="/userinterface/home" className="px-5 py-2 border border-slate-200 rounded-full tracking-[0.15em] font-bold text-[10px] uppercase hover:bg-brand-blue hover:text-white transition-all duration-500">
                HOME
              </Link>

              {categories.map((category) => (
                <div key={category.id} className="relative group/l1">
                  {/* Level 1: Main Category Button */}
                  <button className="px-5 py-2 border border-slate-200 rounded-full flex items-center gap-2 tracking-[0.15em] font-bold text-[10px] uppercase hover:bg-brand-blue hover:text-white transition-all duration-500 group-hover/l1:bg-brand-blue group-hover/l1:text-white">
                    {category.name.toUpperCase()}
                    <ChevronDown size={10} className="opacity-40 group-hover/l1:rotate-180 transition-transform" />
                  </button>

                  {/* Dropdown Container */}
                  <div className="absolute top-full left-0 w-64 pt-2 opacity-0 invisible group-hover/l1:opacity-100 group-hover/l1:visible transition-all duration-300 z-50">
                    <div className="backdrop-blur-2xl bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-visible py-2">

                      {/* Link to Category Slug */}
                      <Link
                        href={`/userinterface/Gproducts/category/${category.id}`}
                        className="block px-5 py-3 text-[11px] font-black text-brand-gold border-b border-slate-50 hover:bg-slate-50 transition-all uppercase tracking-wider"
                      >
                        All {category.name}
                      </Link>

                      {category.subcategories?.map((sub) => (
                        <div key={sub.id} className="relative group/l2">
                          {/* Level 2: Subcategory Link */}
                          <Link
                            href={`/userinterface/Gproducts/subcategory/${sub.id}`}
                            className="flex items-center justify-between px-5 py-3 text-[13px] font-bold text-slate-700 hover:bg-brand-blue hover:text-white transition-all"
                          >
                            {sub.name}
                            {sub.sub_subcategories && sub.sub_subcategories.length > 0 && (
                              <ChevronRight size={14} className="opacity-50" />
                            )}
                          </Link>

                          {/* Level 3: Sub-Subcategory Flyout Menu */}
                          {sub.sub_subcategories && sub.sub_subcategories.length > 0 && (
                            <div className="absolute left-full top-0 w-56 ml-1 opacity-0 invisible group-hover/l2:opacity-100 group-hover/l2:visible transition-all duration-200">
                              <div className="bg-white border border-slate-100 shadow-xl rounded-xl py-2">
                                {sub.sub_subcategories.map((ssub) => (
                                  <Link
                                    key={ssub.id}
                                    href={`/userinterface/Gproducts/subsubcategory/${ssub.id}`}
                                    className="block px-4 py-2 text-[12px] text-slate-600 hover:text-brand-blue hover:bg-slate-50 font-medium transition-colors"
                                  >
                                    {ssub.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {/* ... Other links ... */}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200/50">
                <Link href="/userinterface/Gproducts" className="px-5 py-2 border border-slate-200 rounded-full tracking-[0.15em] font-bold text-[10px] uppercase hover:bg-brand-blue hover:text-white transition-all duration-500">
                  Product Gallery
                </Link>
                <Link href="/userinterface/about" className="px-5 py-2 border border-slate-200 rounded-full tracking-[0.15em] font-bold text-[10px] uppercase hover:bg-brand-blue hover:text-white transition-all duration-500">
                  ABOUT US
                </Link>
              </div>
            </nav>

            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <div className="flex items-center gap-1 mr-2 pr-4 border-r border-slate-200/60">
                  <IconButton href="/userinterface/wishlist"><Heart size={20} className=" transition-colors" /></IconButton>
                  <IconButton href="/userinterface/cart" count={cartCount}><ShoppingCart size={20} className=" transition-colors" /></IconButton>
                </div>
              )}

              {!isAuthenticated ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-8 py-3 bg-brand-blue text-white rounded-full text-[11px] font-black tracking-[0.2em] hover:bg-brand-gold shadow-xl transition-all active:scale-95"
                >
                  LOGIN
                </button>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-11 h-11 rounded-full border-2 border-white bg-white/50 flex items-center justify-center hover:bg-white transition-all shadow-sm"
                  >
                    <User size={20} className="text-slate-800" />
                  </button>

                  {/* PROFILE DROPDOWN MENU */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 shadow-2xl rounded-2xl py-3 z-[60] overflow-hidden">
                      <Link
                        href="/userinterface/order"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Package size={18} className="text-brand-blue" />
                        Track Orders
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors border-t border-slate-50"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}

function IconButton({ href, children, count }: { href: string; children: React.ReactNode; count?: number }) {
  return (
    <Link href={href} className="p-3 text-slate-800 hover:text-brand hover:bg-brand-soft rounded-full transition-all relative">
      {children}
      {count !== undefined && count > 0 && (
        <span className="absolute top-2 right-2 bg-brand-blue text-white text-[8px] font-black rounded-full h-4 w-4 flex items-center justify-center border-2 border-white shadow-sm">
          {count}
        </span>
      )}
    </Link>
  );
}
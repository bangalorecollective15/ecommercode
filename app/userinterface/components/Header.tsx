"use client";

import { Home, Grid, ShoppingCart, User, Heart, ChevronDown, LogOut, Package, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import AuthModal from "../components/AuthModal"; // Ensure path is correct

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Banner {
  id: string;
  bg_color: string;
  text_color: string;
  title: string;
  active: boolean;
}

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loadingBanner, setLoadingBanner] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // NEW STATE
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auth Listener
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
    };
    checkAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
      if (session) setIsAuthModalOpen(false); // Close modal on successful login
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch Banner
  useEffect(() => {
    const fetchBanner = async () => {
      const { data } = await supabase
        .from("banner")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data) setBanner(data);
      setLoadingBanner(false);
    };
    fetchBanner();
  }, []);

  // Fetch Cart Count
  const fetchCartCount = async (uid: string | null) => {
    if (!uid) {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const totalQty = cart.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
      setCartCount(totalQty);
      return;
    }
    const { data } = await supabase.from("cart").select("quantity").eq("user_id", uid);
    if (data) {
      const totalQty = data.reduce((sum, i) => sum + i.quantity, 0);
      setCartCount(totalQty);
    }
  };

  useEffect(() => {
    fetchCartCount(userId);
    const handleCartEvent = () => fetchCartCount(userId);
    window.addEventListener("cartUpdated", handleCartEvent);
    return () => window.removeEventListener("cartUpdated", handleCartEvent);
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Refresh to update state
  };

  return (
    <>
      <header className="w-full bg-white sticky top-0 z-50 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)]">
        {/* Dynamic Banner */}
      
         {banner && (
  <div
    className="w-full py-1 px-4 text-center transition-all duration-500 border-b border-black/5"
    style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
  >
    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] leading-none py-1">
      {banner.title}
    </p>
  </div>
)}
    

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24 md:h-32">
            
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 transition-transform hover:scale-105 active:scale-95">
              <Image
                src="/logo.png"
                alt="Brand Logo"
                width={220}
                height={90}
                className="object-contain w-auto h-16 md:h-24"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              <NavLink href="/userinterface/home" icon={<Home size={20} />} label="Home" />
              <NavLink href="/userinterface/Gproducts" icon={<Tag size={20} />} label="Products" />
              <NavLink href="/userinterface/category" icon={<Grid size={20} />} label="Categories" />

              <div className="h-8 w-[1px] bg-slate-200 mx-2" />

              <div className="flex items-center gap-6">
                {!isAuthenticated ? (
                  <button
                    onClick={() => setIsAuthModalOpen(true)} // TRIGGER MODAL
                    className="px-10 py-4 bg-orange-600 text-white rounded-2xl font-black text-sm tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-700 hover:-translate-y-1 transition-all active:scale-95"
                  >
                    LOGIN
                  </button>
                ) : (
                  <>
                    <Link href="/userinterface/wishlist" className="p-3 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all relative group">
                      <Heart size={26} className="group-hover:fill-orange-600" />
                    </Link>

                    <Link href="/userinterface/cart" className="p-3 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all relative group">
                      <ShoppingCart size={26} />
                      {cartCount > 0 && (
                        <span className="absolute top-2 right-2 bg-orange-600 text-white text-[10px] font-black rounded-full min-w-[22px] h-5 px-1 flex items-center justify-center border-2 border-white">
                          {cartCount}
                        </span>
                      )}
                    </Link>

                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className={`flex items-center gap-3 p-1.5 pr-4 rounded-[1.25rem] border transition-all ${dropdownOpen ? 'border-orange-200 bg-orange-50' : 'border-slate-100 hover:border-orange-200'}`}
                      >
                        <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold shadow-inner">
                          <User size={24} />
                        </div>
                        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute right-0 mt-4 w-60 bg-white shadow-2xl shadow-slate-300 border border-slate-100 rounded-[2rem] py-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                          <p className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">My Account</p>
                          <DropdownLink href="/userinterface/order" icon={<Package size={20} />} label="My Orders" />
                          <div className="h-[1px] bg-slate-50 my-3 mx-6" />
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-4 px-6 py-3 text-sm font-black text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={20} /> Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </nav>

            {/* Mobile Icons */}
            <div className="lg:hidden flex items-center gap-4">
              {!isAuthenticated ? (
                <button onClick={() => setIsAuthModalOpen(true)} className="p-3 bg-orange-600 text-white rounded-xl">
                  <User size={24} />
                </button>
              ) : (
                <Link href="/userinterface/cart" className="relative p-2 text-slate-600">
                  <ShoppingCart size={26} />
                  {cartCount > 0 && <span className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">{cartCount}</span>}
                </Link>
              )}
              <button className="p-3 bg-slate-50 rounded-xl text-slate-600">
                <Grid size={26} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal Component */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}

// Sub-components NavLink and DropdownLink remain the same as your code...
function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center lg:flex-row gap-2 text-[15px] font-black text-slate-700 hover:text-orange-600 transition-all group tracking-tight">
      <span className="text-slate-300 group-hover:text-orange-600 group-hover:scale-110 transition-all duration-300">{icon}</span>
      {label}
    </Link>
  );
}

function DropdownLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 px-6 py-3.5 text-sm font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-all">
      {icon} <span>{label}</span>
    </Link>
  );
}
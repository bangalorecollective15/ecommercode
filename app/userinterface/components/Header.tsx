"use client";

import { ShoppingCart, User, Heart, ChevronDown, LogOut, Package, ChevronRight, Menu, X, Search, Sun, Moon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import AuthModal from "../components/AuthModal";
import { useRouter, usePathname } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SubSubCategory { id: number; name: string; }
interface SubCategory { id: number; name: string; sub_subcategories: SubSubCategory[]; }
interface Category { id: number; name: string; subcategories: SubCategory[]; }

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [banner, setBanner] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const [openDesktopCategory, setOpenDesktopCategory] = useState<number | null>(null);
  const [openSubCategory, setOpenSubCategory] = useState<number | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  const isVideosRoute = pathname?.includes('/userinterface/videos');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const whatsappNumber = "919060889995";
  const whatsappMessage = encodeURIComponent("Hello, I would like to enquire about your luxury fashion and accessories collection. Please connect with me to discuss further. Thank you.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
      if (!savedTheme) {
        localStorage.setItem("theme", "dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const cleanQuery = searchQuery.trim();

      if (cleanQuery.length > 1) {
        try {
          const { data, error } = await supabase
            .from("products")
            .select(`
            id, 
            name, 
            product_images (
              image_url
            )
          `)
            .ilike("name", `%${cleanQuery}%`)
            .limit(5);

          if (error) {
            console.error("Supabase Search Error:", error.message);
            return;
          }

          if (data) {
            const formattedResults = data.map((product: any) => ({
              id: product.id,
              name: product.name,
              image: product.product_images?.[0]?.image_url || "/placeholder.png",
            }));

            setSearchResults(formattedResults);
          }
        } catch (err) {
          console.error("Unexpected Search Error:", err);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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
    const fetchCartCount = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        setCartCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("cart")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Cart Count Error:", error.message);
        return;
      }

      setCartCount(count || 0);
    };

    fetchCartCount();

    const handleLocalCartUpdate = () => {
      fetchCartCount();
    };
    window.addEventListener("cartUpdated", handleLocalCartUpdate);

    const channel = supabase
      .channel("cart-count-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart",
        },
        () => {
          fetchCartCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("cartUpdated", handleLocalCartUpdate);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileCategoryOpen(null);
    setOpenDesktopCategory(null);
    setOpenSubCategory(null);
  }, [pathname]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: bData } = await supabase.from("banner").select("*").eq("active", true).limit(1).single();
      if (bData) setBanner(bData);

      const { data: catData } = await supabase.from("categories").select(`
          id, name, 
          subcategories (id, name, sub_subcategories (id, name))
        `).order('priority', { ascending: true });
      if (catData) setCategories(catData as any);
    };

    fetchData();

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      setIsAuthenticated(!!data.session);

      if (data.session?.user?.email) {
        setUserEmail(data.session.user.email);
      }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);

        if (session?.user?.email) {
          setUserEmail(session.user.email);
        } else {
          setUserEmail("");
        }
      }
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setDropdownOpen(false);
      setMobileMenuOpen(false);
      router.push("/userinterface/home");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleMobileCategory = (categoryId: number) => {
    setMobileCategoryOpen(mobileCategoryOpen === categoryId ? null : categoryId);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50">
        {banner && banner.active && (
          <div
            className="w-full py-2.5 overflow-hidden backdrop-blur-lg border-b border-white/15 shadow-sm relative z-50"
            style={{ backgroundColor: "#2b2652", color: banner.text_color || "#c4a174" }}
          >
            <div className="flex whitespace-nowrap overflow-hidden">
              <div className="flex animate-marquee gap-12 items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">{banner.title}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">{banner.title}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">{banner.title}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">{banner.title}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">{banner.title}</p>
              </div>
            </div>
            <style jsx>{`
      @keyframes marquee {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
      }
      .animate-marquee {
        display: flex;
        width: max-content;
        animation: marquee 25s linear infinite;
      }
      .animate-marquee:hover {
        animation-play-state: paused;
      }
    `}</style>
          </div>
        )}

        {/* MOBILE HEADER */}
        <div className="lg:hidden w-full px-4 transition-all duration-300 border-b border-white/10 dark:border-slate-800/50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 shadow-sm">
          <div className="flex items-center justify-between h-16">
            {/* LOGO */}
            <Link href="/userinterface/home" className="flex-shrink-0 transition-transform hover:scale-105 active:scale-95">
              <Image
                src="/removebglogo.png"
                alt="Logo"
                width={140}
                height={50}
                className="h-12 w-auto object-contain dark:invert transition-all"
                priority
              />
            </Link>

            {/* RIGHT SIDE ACTIONS — kept minimal so the hamburger never gets squeezed off-screen */}
            <div className="flex items-center gap-1">

              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="p-2 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all"
                >
                  {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-900" />}
                </button>
              )}

              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all"
              >
                <Search size={20} />
              </button>

              {!isAuthenticated && (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-1.5 ml-1 bg-white dark:bg-slate-800 text-[#8A7763] dark:text-white rounded-full text-[10px] font-black tracking-[0.1em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  LOGIN
                </button>
              )}

              {/* Hamburger — this is now always visible. Wishlist, Cart, and Account
                  moved into the slide-out menu below instead of living out here. */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all ml-1 relative"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                {isAuthenticated && cartCount > 0 && !mobileMenuOpen && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-950" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* DESKTOP HEADER (unchanged) */}
        <div
          className={`hidden lg:flex items-center justify-between transition-all duration-500 border-b px-8 h-16 ${isScrolled
            ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl shadow-md border-slate-200/50 dark:border-slate-800/50"
            : "bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-white/20 dark:border-slate-800/50"
            }`}
        >
          <Link href="/userinterface/home" className="flex-shrink-0 transition-opacity hover:opacity-80">
            <Image src="/logowhite.png" alt="Logo" width={160} height={50} className="h-12 w-auto object-contain brightness-0 dark:invert transition-all" />
          </Link>

          <nav className="flex items-center gap-0.5">
            <Link
              href="/userinterface/home"
              className="px-4 py-2 rounded-full tracking-[0.15em] font-bold text-[11px] uppercase text-slate-800 dark:text-slate-200 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-all duration-300 whitespace-nowrap"
            >
              HOME
            </Link>

            {categories.map((category) => {
              const hasSubcategories = category.subcategories && category.subcategories.length > 0;

              if (!hasSubcategories) {
                return (
                  <Link
                    key={category.id}
                    href={`/userinterface/Gproducts/category/${category.id}`}
                    className="px-4 py-2 rounded-full flex items-center tracking-[0.15em] font-bold text-[11px] uppercase text-slate-800 dark:text-slate-200 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-all duration-300 whitespace-nowrap"
                  >
                    {category.name.toUpperCase()}
                  </Link>
                );
              }

              const isOpen = openDesktopCategory === category.id;

              return (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => setOpenDesktopCategory(category.id)}
                  onMouseLeave={() => {
                    setOpenDesktopCategory(null);
                    setOpenSubCategory(null);
                  }}
                >
                  <button className="px-4 py-2 rounded-full flex items-center gap-1.5 tracking-[0.15em] font-bold text-[11px] uppercase text-slate-800 dark:text-slate-200 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-all duration-300 whitespace-nowrap">
                    {category.name.toUpperCase()}
                    <ChevronDown size={12} className="text-slate-600 dark:text-slate-400 transition-colors duration-300" />
                  </button>

                  <div
                    className={`absolute top-full left-0 w-64 pt-2 transition-all duration-300 z-50 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"
                      }`}
                  >
                    <div className="backdrop-blur-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-visible py-2">
                      <Link
                        href={`/userinterface/Gproducts/category/${category.id}`}
                        onClick={() => {
                          setOpenDesktopCategory(null);
                          setOpenSubCategory(null);
                        }}
                        className="block px-5 py-3 text-[11px] font-black text-brand-gold dark:text-amber-500 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all uppercase tracking-wider"
                      >
                        All {category.name}
                      </Link>

                      {category.subcategories.map((sub) => {
                        const hasDeep = sub.sub_subcategories && sub.sub_subcategories.length > 0;
                        const isSubOpen = openSubCategory === sub.id;

                        return (
                          <div
                            key={sub.id}
                            className="relative"
                            onMouseEnter={() => hasDeep && setOpenSubCategory(sub.id)}
                            onMouseLeave={() => hasDeep && setOpenSubCategory(null)}
                          >
                            <Link
                              href={`/userinterface/Gproducts/subcategory/${sub.id}`}
                              onClick={(e) => {
                                if (hasDeep && !isSubOpen) {
                                  e.preventDefault();
                                  setOpenSubCategory(sub.id);
                                  return;
                                }
                                setOpenDesktopCategory(null);
                                setOpenSubCategory(null);
                              }}
                              className="flex items-center justify-between px-5 py-3 text-[13px] font-bold text-slate-700 dark:text-slate-300 hover:bg-black hover:text-white dark:hover:bg-black dark:hover:text-white transition-all"
                            >
                              {sub.name}
                              {hasDeep && (
                                <ChevronRight
                                  size={14}
                                  className={`opacity-50 transition-transform duration-200 ${isSubOpen ? "rotate-90" : ""}`}
                                />
                              )}
                            </Link>

                            {hasDeep && (
                              <div
                                className={`absolute left-full top-0 w-56 pl-1 transition-all duration-200 z-[70] ${isSubOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                                  }`}
                              >
                                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-xl py-2">
                                  {sub.sub_subcategories.map((ssub) => (
                                    <Link
                                      key={ssub.id}
                                      href={`/userinterface/Gproducts/subsubcategory/${ssub.id}`}
                                      onClick={() => {
                                        setOpenDesktopCategory(null);
                                        setOpenSubCategory(null);
                                      }}
                                      className="block px-4 py-2 text-[12px] text-slate-600 dark:text-slate-400 hover:text-white hover:bg-black dark:hover:bg-black dark:hover:text-white font-medium transition-colors"
                                    >
                                      {ssub.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-slate-300/60 dark:border-slate-700">
              <Link
                href="/userinterface/Gproducts"
                className="px-4 py-2 rounded-full tracking-[0.15em] font-bold text-[11px] uppercase text-slate-800 dark:text-slate-200 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-all duration-300 whitespace-nowrap"
              >
                Fashion Studio
              </Link>
              <Link
                href="/userinterface/videos"
                className="px-4 py-2 rounded-full tracking-[0.15em] font-bold text-[11px] uppercase text-slate-800 dark:text-slate-200 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-all duration-300 whitespace-nowrap"
              >
                Videos
              </Link>
              <Link
                href="/userinterface/about"
                className="px-4 py-2 rounded-full tracking-[0.15em] font-bold text-[11px] uppercase text-slate-800 dark:text-slate-200 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-all duration-300 whitespace-nowrap"
              >
                About Us
              </Link>
            </div>
          </nav>

          <div className="flex items-center gap-1">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2.5 text-slate-800 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-full transition-all"
                aria-label="Toggle Theme"
              >
                {isDarkMode ? <Sun size={19} className="text-yellow-500" /> : <Moon size={19} className="text-slate-900" />}
              </button>
            )}

            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 text-slate-800 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-full transition-all"
            >
              <Search size={19} />
            </button>

            {isAuthenticated && (
              <div className="flex items-center gap-1 border-r border-slate-300/60 dark:border-slate-700 pr-2 mr-1">
                <Link href="/userinterface/wishlist" className="p-2.5 text-slate-800 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-full transition-all">
                  <Heart size={19} />
                </Link>
                <Link href="/userinterface/cart" className="p-2.5 text-slate-800 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-full transition-all relative">
                  <ShoppingCart size={19} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            )}

            {!isAuthenticated ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[11px] font-bold tracking-[0.1em] hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md transition-all ml-1"
              >
                LOGIN
              </button>
            ) : (
              <div className="relative flex items-center gap-2 pl-1" ref={dropdownRef}>
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-[9px] uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 font-bold">
                    Account
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {userEmail.split('@')[0]}
                  </span>
                </div>

                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
                >
                  <User size={18} className="text-slate-800 dark:text-slate-200" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-xl py-1.5 z-[60]">
                    <Link
                      href="/userinterface/order"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Package size={16} className="text-slate-600 dark:text-slate-400" />
                      Track Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-slate-50 dark:border-slate-800"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SEARCH OVERLAY (unchanged) */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsSearchOpen(false)}
            />

            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-700">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <Search className="text-slate-400" size={24} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search collections..."
                  className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/userinterface/product/${product.id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors group"
                    >
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                          {product.name}
                        </h4>
                      </div>

                      <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                    </Link>
                  ))
                ) : searchQuery.length > 1 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No items found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    Search for wallets, luxury bags, artisan footwear, high-end belts...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MOBILE SLIDE-OUT MENU */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden backdrop-blur-xl bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white/90 dark:bg-slate-950/90 shadow-2xl backdrop-blur-2xl border-l border-slate-100 dark:border-slate-800 overflow-y-auto animate-in slide-in-from-right-4 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-brand-gold dark:text-amber-500 tracking-wide">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                >
                  <X size={24} className="text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              <div className="p-4 space-y-1 pt-0">

                {/* WISHLIST + CART — moved here from the top bar */}
                {isAuthenticated && (
                  <div className="grid grid-cols-2 gap-3 mb-4 mt-4">
                    <Link
                      href="/userinterface/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-black transition-all"
                    >
                      <Heart size={20} />
                      Wishlist
                    </Link>
                    <Link
                      href="/userinterface/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="relative flex flex-col items-center justify-center gap-1.5 px-4 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-black transition-all"
                    >
                      <ShoppingCart size={20} />
                      Cart
                      {cartCount > 0 && (
                        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </div>
                )}

                <Link
                  href="/userinterface/home"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-4 text-lg font-bold text-slate-800 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-black rounded-xl transition-all border-b border-slate-50 dark:border-slate-800/50"
                >
                  Home
                </Link>

                <Link
                  href="/userinterface/Gproducts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-4 text-lg font-bold text-slate-800 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-black rounded-xl transition-all border-b border-slate-50 dark:border-slate-800/50"
                >
                  Fashion Studio
                </Link>

                <Link
                  href="/userinterface/videos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-4 text-lg font-bold text-slate-800 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-black rounded-xl transition-all border-b border-slate-50 dark:border-slate-800/50"
                >
                  Videos
                </Link>

                <Link
                  href="/userinterface/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-4 text-lg font-bold text-slate-800 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-black rounded-xl transition-all border-b border-slate-50 dark:border-slate-800/50"
                >
                  About Us
                </Link>

                {/* Categories Accordion */}
                <div className="border-b border-slate-50 dark:border-slate-800/50 pb-4">
                  <h3 className="text-lg font-black text-brand-gold dark:text-amber-500 px-4 py-3 mb-2 tracking-wide">Collections</h3>
                  {categories.map((category) => (
                    <div key={`cat-wrapper-${category.id}`}>
                      <button
                        onClick={() => toggleMobileCategory(category.id)}
                        className="w-full flex items-center justify-between px-4 py-4 text-left text-lg font-bold text-slate-800 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-black rounded-xl transition-all"
                      >
                        {category.name}
                        <ChevronDown
                          size={20}
                          className={`transition-transform duration-300 ${mobileCategoryOpen === category.id ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {mobileCategoryOpen === category.id && (
                        <div className="pl-8 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          <Link
                            href={`/userinterface/Gproducts/category/${category.id}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-white hover:bg-black dark:hover:bg-black rounded-lg transition-all"
                          >
                            All {category.name}
                          </Link>
                          {category.subcategories?.map((sub) => (
                            <div key={`sub-wrapper-${sub.id}`}>
                              <Link
                                href={`/userinterface/Gproducts/subcategory/${sub.id}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block pl-4 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-white hover:bg-black dark:hover:bg-black rounded-lg transition-all"
                              >
                                - {sub.name}
                              </Link>
                              {sub.sub_subcategories?.map((ssub) => (
                                <Link
                                  key={`ssub-${ssub.id}`}
                                  href={`/userinterface/Gproducts/subsubcategory/${ssub.id}`}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block pl-8 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-white hover:bg-black dark:hover:bg-black rounded-lg transition-all ml-2"
                                >
                                  ◦ {ssub.name}
                                </Link>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* MOBILE ACCOUNT SECTION */}
                <div className="border-t border-slate-100 dark:border-slate-800 mt-4 pt-4">

                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-4 mb-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-black mb-1">
                          Logged In As
                        </p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 break-all">
                          {userEmail}
                        </p>
                      </div>

                      <Link
                        href="/userinterface/order"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-4 text-lg font-bold text-slate-800 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-black rounded-xl transition-all"
                      >
                        <Package size={20} className="text-slate-500" />
                        Track Orders
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-4 text-lg font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      >
                        <LogOut size={20} />
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-4 bg-black dark:bg-brand-gold text-white dark:text-slate-900 rounded-2xl text-lg font-black tracking-[0.1em] hover:bg-slate-800 dark:hover:bg-white shadow-xl transition-all active:scale-95"
                    >
                      LOGIN / SIGNUP
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

{/* FLOATING WHATSAPP BUTTON */}
      <div
        className={`fixed bottom-6 right-6 z-[9999] group flex-col items-end ${
          isVideosRoute ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <span className="mb-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl pointer-events-none tracking-wider whitespace-nowrap">
          Enquire on WhatsApp
        </span>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transition-all duration-300 hover:scale-110 active:scale-90 relative"
          aria-label="Chat on WhatsApp"
        >
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 pointer-events-none" />
          <Image
            src="/whatsappicons.png"
            alt="WhatsApp Logo"
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
        </a>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
"use client";

import { createClient } from "@supabase/supabase-js";
import ProductCard from "../../components/ProductCard"; 
import { notFound, useRouter, useSearchParams, usePathname } from "next/navigation";
import { Sparkles, ShoppingBag, Layers, Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Ruler, X } from "lucide-react";
import { use, useState, useEffect, useMemo, useRef } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default function UnifiedShopPage({ params }: PageProps) {
  const { slug } = use(params);
  const [type, id] = slug || [];

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const productsPerPage = 20;

  const [products, setProducts] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  // ── Filters: local state for controlled inputs, kept in sync with URL ──
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("q") || "");
  const [sortOrder, setSortOrder] = useState<string>(searchParams.get("sort") || "default");
  const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.get("brand") || "all");
  const [selectedVariation, setSelectedVariation] = useState<string>(searchParams.get("size") || "all");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Re-sync local filter state whenever the URL changes (e.g. browser back/forward,
  // or the user returning here via the product page's "back" button).
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setSortOrder(searchParams.get("sort") || "default");
    setSelectedBrand(searchParams.get("brand") || "all");
    setSelectedVariation(searchParams.get("size") || "all");
  }, [searchParams]);

  // Generic helper: merge param updates into the URL. Resets pagination
  // whenever a filter changes, since the result set shifts.
  const updateFilters = (updates: Record<string, string>, resetPage = true) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === "all" || value === "default") {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    if (resetPage) current.delete("page");
    const search = current.toString();
    router.push(`${pathname}${search ? `?${search}` : ""}`, { scroll: true });
  };

  const setPage = (pageNumber: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (pageNumber === 1) {
      current.delete("page");
    } else {
      current.set("page", String(pageNumber));
    }
    const search = current.toString();
    router.push(`${pathname}${search ? `?${search}` : ""}`, { scroll: true });
  };

  const isFilterActive = useMemo(() => {
    return (
      searchQuery !== "" ||
      sortOrder !== "default" ||
      selectedBrand !== "all" ||
      selectedVariation !== "all"
    );
  }, [searchQuery, sortOrder, selectedBrand, selectedVariation]);

  const handleClearFilters = () => {
    router.push(pathname, { scroll: true });
  };

  // Debounce search text -> URL, so we're not pushing on every keystroke
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handle = setTimeout(() => {
      const urlQ = searchParams.get("q") || "";
      if (searchQuery !== urlQ) {
        updateFilters({ q: searchQuery });
      }
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    updateFilters({ sort: value });
  };

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
    updateFilters({ brand: value });
  };

  const handleVariationChange = (value: string) => {
    setSelectedVariation(value);
    updateFilters({ size: value });
  };

  useEffect(() => {
    if (!type || !id) return;

    const config: Record<string, { table: string; column: string }> = {
      category: { table: "categories", column: "category_id" },
      subcategory: { table: "subcategories", column: "subcategory_id" },
      subsubcategory: { table: "sub_subcategories", column: "sub_subcategory_id" }, 
    };

    const currentConfig = config[type];
    if (!currentConfig) {
      setError(true);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        
        const [productsResponse, titleResponse, sessionResponse] = await Promise.all([
          supabase
            .from("products")
            .select(`
              *,
              brands (id, name_en),
              categories (name),
              product_images (image_url),
              product_variations (*, attributes:size_id ( name ))
            `)
            .eq(currentConfig.column, id)
            .eq("active", true),
          
          supabase
            .from(currentConfig.table)
            .select("name")
            .eq("id", id)
            .single(),

          supabase.auth.getSession()
        ]);

        if (productsResponse.error) {
          setError(true);
          return;
        }

        const formattedProducts = productsResponse.data?.map(p => {
          const initialVariation = p.product_variations?.[0];
          const calculatedPrice = initialVariation 
            ? (initialVariation.sale_price || initialVariation.price) 
            : 0;

          return {
            ...p,
            image: p.product_images?.[0]?.image_url || "/placeholder.png",
            sortingPrice: Number(calculatedPrice)
          };
        }) || [];

        setProducts(formattedProducts);
        setDisplayName(titleResponse.data?.name || type);
        setUserId(sessionResponse.data?.session?.user?.id || null);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [type, id]);

  const availableBrands = useMemo(() => {
    const brandsMap = new Map();
    products.forEach((product) => {
      if (product.brands) {
        brandsMap.set(product.brands.id, product.brands.name_en);
      }
    });
    return Array.from(brandsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const availableVariations = useMemo(() => {
    const variationSet = new Set<string>();
    products.forEach((product) => {
      product.product_variations?.forEach((v: any) => {
        const label = v.attributes?.name;
        if (label && v.stock > 0) variationSet.add(label);
      });
    });
    return Array.from(variationSet);
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBrand = selectedBrand === "all" || String(product.brand_id) === selectedBrand;
        const matchesVariation =
          selectedVariation === "all" ||
          product.product_variations?.some(
            (v: any) => v.attributes?.name === selectedVariation && v.stock > 0
          );
        return matchesSearch && matchesBrand && matchesVariation;
      })
      .sort((a, b) => {
        if (sortOrder === "lowToHigh") return a.sortingPrice - b.sortingPrice;
        if (sortOrder === "highToLow") return b.sortingPrice - a.sortingPrice;
        if (sortOrder === "newest") {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : Number(a.id) || 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : Number(b.id) || 0;
          return dateB - dateA;
        }
        if (sortOrder === "oldest") {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : Number(a.id) || 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : Number(b.id) || 0;
          return dateA - dateB;
        }
        return 0;
      });
  }, [products, searchQuery, sortOrder, selectedBrand, selectedVariation]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredAndSortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // ── The URL the user should return to after viewing a product ──
  const returnUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  if (!type || !id || error) return notFound();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-black flex items-center justify-center transition-colors duration-300">
        <Loader2 className="animate-spin text-brand-blue dark:text-brand-gold" size={40} />
      </div>
    );
  }

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-end gap-5 w-full mb-8">
        <button
          onClick={() => setPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="group relative w-12 h-12 rounded-full bg-white dark:bg-[#111] border border-slate-200 dark:border-[#333] flex items-center justify-center text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-blue dark:hover:bg-[#222] hover:text-white dark:hover:text-white hover:border-brand-blue dark:hover:border-[#444] transition-all duration-300 ease-out shadow-sm"
        >
          <ChevronLeft size={20} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <div className="flex flex-col items-center min-w-[3.5rem]">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-0.5 transition-colors duration-300">Page</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-slate-900 dark:text-white leading-none transition-colors duration-300">{currentPage}</span>
            <span className="text-sm font-black text-slate-400 dark:text-gray-500 leading-none transition-colors duration-300">/ {totalPages}</span>
          </div>
        </div>

        <button
          onClick={() => setPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="group relative w-12 h-12 rounded-full bg-white dark:bg-[#111] border border-slate-200 dark:border-[#333] flex items-center justify-center text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-blue dark:hover:bg-[#222] hover:text-white dark:hover:text-white hover:border-brand-blue dark:hover:border-[#444] transition-all duration-300 ease-out shadow-sm"
        >
          <ChevronRight size={20} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-black pb-32 relative font-sans overflow-hidden transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-gold/5 dark:bg-brand-gold/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] left-[-5%] w-[400px] h-[400px] bg-brand-blue/5 dark:bg-[#222]/30 rounded-full blur-[100px] transition-colors duration-300" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 pt-40 relative z-10">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-6 px-5 py-2 bg-white/60 dark:bg-[#111]/60 backdrop-blur-md border border-white dark:border-[#333] rounded-full shadow-sm transition-colors duration-300">
            <Sparkles className="text-brand-gold" size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-gray-400">
              Exploring {type.replace("_", " ")}
            </span>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-brand-blue dark:text-white leading-none transition-colors duration-300">
              {displayName}<span className="text-brand-gold">.</span>
            </h1>
          </div>

          <div className="mt-10 inline-flex items-center gap-3 px-6 py-3 bg-brand-blue dark:bg-[#111] text-white rounded-full shadow-xl transition-colors duration-300">
             <ShoppingBag size={14} className="text-brand-gold" />
             <span className="text-[10px] font-black uppercase tracking-widest">
               {filteredAndSortedProducts.length} Curated Pieces Found
             </span>
          </div>
        </header>

        {/* --- FILTER CONTROL CONTROLLER PANEL --- */}
        <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row items-center gap-4">
          
          <div className="relative flex-1 w-full flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none transition-colors duration-300" size={18} />
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border border-slate-200 dark:border-[#333] focus:border-brand-gold dark:focus:border-brand-gold rounded-full shadow-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all duration-300 font-medium text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-wrap">
            {/* Brand Filter */}
            <div className="relative w-full sm:w-56">
              <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none transition-colors duration-300" size={16} />
              <select
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full pl-12 pr-10 py-4 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border border-slate-200 dark:border-[#333] focus:border-brand-gold dark:focus:border-brand-gold rounded-full shadow-sm text-slate-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all duration-300 cursor-pointer appearance-none"
              >
                <option value="all">All Brands</option>
                {availableBrands.map((brand) => (
                  <option key={brand.id} value={String(brand.id)}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0" />
            </div>

            {/* Variation (Size) Filter */}
            {availableVariations.length > 0 && (
              <div className="relative w-full sm:w-56">
                <Ruler className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none transition-colors duration-300" size={16} />
                <select
                  value={selectedVariation}
                  onChange={(e) => handleVariationChange(e.target.value)}
                  className="w-full pl-12 pr-10 py-4 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border border-slate-200 dark:border-[#333] focus:border-brand-gold dark:focus:border-brand-gold rounded-full shadow-sm text-slate-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all duration-300 cursor-pointer appearance-none"
                >
                  <option value="all">All Sizes</option>
                  {availableVariations.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0" />
              </div>
            )}

            {/* Sort */}
            <div className="relative w-full sm:w-56">
              <ArrowUpDown className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none transition-colors duration-300" size={16} />
              <select
                value={sortOrder}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full pl-12 pr-10 py-4 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border border-slate-200 dark:border-[#333] focus:border-brand-gold dark:focus:border-brand-gold rounded-full shadow-sm text-slate-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all duration-300 cursor-pointer appearance-none"
              >
                <option value="default">Sort: Featured</option>
                <option value="newest">Newest Arrivals</option>
                <option value="oldest">Oldest / Classic</option>
                <option value="lowToHigh">Price: Low to High</option>
                <option value="highToLow">Price: High to Low</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0" />
            </div>

            {isFilterActive && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-5 py-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/30 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-sm shrink-0 active:scale-95"
              >
                <X size={14} strokeWidth={2.5} />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12 mb-16">
          {currentProducts.length > 0 ? (
            currentProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                userId={userId} 
                returnUrl={returnUrl}
              />
            ))
          ) : (
            <div className="col-span-full py-48 text-center border-2 border-dashed border-white dark:border-[#333] bg-white/30 dark:bg-[#111]/30 backdrop-blur-xl rounded-[4rem] transition-colors duration-300">
              <Layers size={24} className="text-slate-300 dark:text-gray-600 mx-auto mb-6" />
              <h3 className="text-xl font-black text-brand-blue dark:text-white uppercase transition-colors duration-300">
                {products.length === 0 ? "Empty Collection" : "No Results Found"}
              </h3>
              <p className="text-sm text-slate-400 dark:text-gray-500 mt-2 transition-colors duration-300">
                {products.length === 0 ? "There are no products listed here yet." : "Try choosing alternative sort filters or terms."}
              </p>
            </div>
          )}
        </div>

        <PaginationControls />
      </div>
    </main>
  );
}
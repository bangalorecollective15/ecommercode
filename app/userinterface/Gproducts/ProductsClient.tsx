"use client";
import { useState, useEffect, useRef } from "react";
import supabase from "@/lib/supabase";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilters";
import { Loader2, Sparkles, SlidersHorizontal, LayoutGrid, X, ChevronLeft, ChevronRight } from "lucide-react";

const mapProducts = (rows: any[]) =>
  rows.map((p) => ({
    ...p,
    price: p.product_variations?.[0]?.price || 0,
    image: p.product_images?.[0]?.image_url,
  }));

interface ProductsClientProps {
  initialProducts: any[];
  initialTotalCount: number;
  initialBrands: any[];
  initialCategories: any[];
  initialLifestyleTags: any[];
  initialFilters: { category_id: number | null; brand_id: number | null; lifestyle_tag_id: number | null };
  initialPage: number;
}

export default function ProductsClient({
  initialProducts,
  initialTotalCount,
  initialBrands,
  initialCategories,
  initialLifestyleTags,
  initialFilters,
  initialPage,
}: ProductsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // --- Hydrate straight from server-fetched data. No blank state, no spinner on first paint. ---
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [brands, setBrands] = useState<any[]>(initialBrands);
  const [lifestyleTags, setLifestyleTags] = useState<any[]>(initialLifestyleTags);

  const [filtersLoading, setFiltersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const tagParam = searchParams.get("tag");

  const currentPage = Number(searchParams.get("page")) || initialPage;
  const productsPerPage = 60;

  const [filters, setFilters] = useState({
    category_id: initialFilters.category_id,
    subcategory_id: null,
    sub_subcategory_id: null,
    brand_id: initialFilters.brand_id,
    lifestyle_tag_id: initialFilters.lifestyle_tag_id,
    sort: "latest",
    search: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  const setPage = (pageNumber: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const currentPageFromUrl = Number(current.get("page")) || 1;

    if (pageNumber !== currentPageFromUrl) {
      if (pageNumber <= 1) current.delete("page");
      else current.set("page", String(pageNumber));

      const query = current.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Skip the very first run of the filter-changed effect — the server already
  // fetched page 1 with these exact filters, so re-running it here would be
  // a wasted duplicate request right after hydration.
  const isFirstFilterRun = useRef(true);
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.category_id,
    filters.subcategory_id,
    filters.sub_subcategory_id,
    filters.brand_id,
    filters.lifestyle_tag_id,
    filters.sort,
    debouncedSearch,
  ]);

  useEffect(() => {
    if (!tagParam || lifestyleTags.length === 0) return;
    const foundTag = lifestyleTags.find((t: any) => t.name.toLowerCase() === tagParam.toLowerCase());
    if (foundTag && foundTag.id !== filters.lifestyle_tag_id) {
      setFilters((prev) => ({ ...prev, lifestyle_tag_id: foundTag.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagParam, lifestyleTags]);

  // Auth session — cheap, client-only, doesn't block render.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id || null));
  }, []);

  // --- PRODUCTS: skip the first run (server already fetched it), fetch on every real change after. ---
  const isFirstProductRun = useRef(true);
  useEffect(() => {
    if (isFirstProductRun.current) {
      isFirstProductRun.current = false;
      return;
    }

    let cancelled = false;

    const fetchProducts = async () => {
      setProductsLoading(true);

      const from = (currentPage - 1) * productsPerPage;
      const to = from + productsPerPage - 1;

      const fullSelect = `
        id, name, lifestyle_tag_id, category_id, subcategory_id, sub_subcategory_id, brand_id, created_at,
        product_images(image_url),
        product_variations!inner(*, attributes:size_id(name))
      `;

      const applyCommonFilters = (q: any) => {
        let query = q.eq("active", true).gt("product_variations.stock", 0);
        if (filters.category_id) query = query.eq("category_id", filters.category_id);
        if (filters.subcategory_id) query = query.eq("subcategory_id", filters.subcategory_id);
        if (filters.sub_subcategory_id) query = query.eq("sub_subcategory_id", filters.sub_subcategory_id);
        if (filters.brand_id) query = query.eq("brand_id", filters.brand_id);
        if (filters.lifestyle_tag_id) query = query.eq("lifestyle_tag_id", filters.lifestyle_tag_id);
        if (debouncedSearch) query = query.ilike("name", `%${debouncedSearch}%`);
        return query;
      };

      try {
        if (filters.sort === "price_asc" || filters.sort === "price_desc") {
          const { data: priceRows, error: priceErr } = await applyCommonFilters(
            supabase.from("products").select("id, product_variations!inner(price, stock)")
          );
          if (priceErr) throw priceErr;

          const sorted = (priceRows || [])
            .map((p: any) => ({ id: p.id, price: p.product_variations?.[0]?.price ?? 0 }))
            .sort((a: any, b: any) => (filters.sort === "price_asc" ? a.price - b.price : b.price - a.price));

          const pageIds = sorted.slice(from, to + 1).map((p: any) => p.id);

          let fullRows: any[] = [];
          if (pageIds.length > 0) {
            const { data, error } = await applyCommonFilters(
              supabase.from("products").select(fullSelect)
            ).in("id", pageIds);
            if (error) throw error;
            fullRows = pageIds.map((id: any) => (data || []).find((r: any) => r.id === id)).filter(Boolean);
          }

          if (!cancelled) {
            setTotalCount(sorted.length);
            setProducts(mapProducts(fullRows));
          }
        } else {
          let query = applyCommonFilters(
            supabase.from("products").select(fullSelect, { count: "exact" })
          ).range(from, to);

          if (filters.sort === "alpha") query = query.order("name", { ascending: true });
          else if (filters.sort === "oldest") query = query.order("created_at", { ascending: true });
          else query = query.order("created_at", { ascending: false });

          const { data, count, error } = await query;
          if (error) throw error;

          if (!cancelled) {
            setTotalCount(count || 0);
            setProducts(mapProducts(data || []));
          }
        }
      } catch (err) {
        console.error("Failed to load products:", err);
        if (!cancelled) {
          setProducts([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [
    filters.category_id,
    filters.subcategory_id,
    filters.sub_subcategory_id,
    filters.brand_id,
    filters.lifestyle_tag_id,
    filters.sort,
    debouncedSearch,
    currentPage,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / productsPerPage));
  const activeCategoryName = categories.find((c) => Number(c.id) === Number(filters.category_id))?.name;
  const activeBrandName = brands.find((b) => Number(b.id) === Number(filters.brand_id))?.name_en;

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const clearAllFilters = () => {
    setDebouncedSearch("");
    setFilters({
      category_id: null,
      subcategory_id: null,
      sub_subcategory_id: null,
      brand_id: null,
      lifestyle_tag_id: null,
      sort: "latest",
      search: "",
    });
  };

  const PaginationControls = ({ className = "" }: { className?: string }) => {
    if (totalPages <= 1) return null;
    return (
      <div className={`flex items-center justify-end gap-5 w-full ${className}`}>
        <button
          onClick={() => {
            setPage(Math.max(currentPage - 1, 1));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          disabled={currentPage === 1}
          className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-[#111] border-2 border-slate-200 dark:border-[#333] flex items-center justify-center text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-blue dark:hover:bg-[#222] hover:text-white hover:border-brand-blue dark:hover:border-[#444] hover:shadow-[0_8px_25px_rgba(43,38,82,0.25)] dark:hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1 active:scale-75 active:translate-y-0 transition-all duration-300 ease-out"
        >
          <ChevronLeft size={24} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform duration-300 ease-out" />
        </button>
        <div className="flex flex-col items-center min-w-[3.5rem]">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-0.5 transition-colors duration-300">Page</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-white leading-none transition-colors duration-300">{currentPage}</span>
            <span className="text-lg font-black text-slate-400 dark:text-gray-500 leading-none transition-colors duration-300">/ {totalPages}</span>
          </div>
        </div>
        <button
          onClick={() => {
            setPage(Math.min(currentPage + 1, totalPages));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          disabled={currentPage === totalPages}
          className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-[#111] border-2 border-slate-200 dark:border-[#333] flex items-center justify-center text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-blue dark:hover:bg-[#222] hover:text-white hover:border-brand-blue dark:hover:border-[#444] hover:shadow-[0_8px_25px_rgba(43,38,82,0.25)] dark:hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1 active:scale-75 active:translate-y-0 transition-all duration-300 ease-out"
        >
          <ChevronRight size={24} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform duration-300 ease-out" />
        </button>
      </div>
    );
  };

  // Full-screen loader should now essentially never show — data is already there on first paint.
  const showFullScreenLoader = productsLoading && products.length === 0 && totalCount === 0;

  return (
    <div className="bg-[#f8fafc] dark:bg-black min-h-screen text-brand-blue dark:text-white pb-32 relative font-sans transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-brand-gold/5 dark:bg-brand-gold/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-brand-blue/5 dark:bg-[#222]/30 rounded-full blur-[120px] transition-colors duration-300" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12">
        <header className="pt-32 pb-12 text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/60 dark:bg-[#111]/60 backdrop-blur-md border border-white dark:border-[#333] rounded-full shadow-sm transition-colors duration-300">
            <Sparkles className="text-brand-gold" size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-gray-400">
              {activeBrandName ? "Brand Showcase" : "Curated Selection"}
            </span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-brand-blue dark:text-white uppercase transition-colors duration-300">
            {activeBrandName || activeCategoryName || "The Gallery"}
            <span className="text-brand-gold">.</span>
          </h1>
          <div className="flex items-center justify-center gap-4 text-slate-400 dark:text-gray-500 transition-colors duration-300">
            <div className="h-[1px] w-8 bg-brand-gold/30"></div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase">Bengaluru Collective</p>
            <div className="h-[1px] w-8 bg-brand-gold/30"></div>
          </div>
        </header>

        <div className="sticky top-24 z-50 mb-14">
          {/* Desktop Filter Bar */}
          <div className="hidden lg:flex items-center justify-between gap-4 bg-white/40 dark:bg-[#111]/40 backdrop-blur-xl py-3 px-6 rounded-[2rem] border border-white/60 dark:border-[#333]/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-colors duration-300">
            <div className="flex-1">
              <ProductFilters
                categories={categories}
                brands={brands}
                lifestyleTags={lifestyleTags}
                filters={filters}
                setFilters={setFilters}
                isMobile={false}
              />
            </div>
            <div className="flex items-center gap-4 pl-5 border-l border-slate-300/40 dark:border-[#444]/40 shrink-0 transition-colors duration-300">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none transition-colors duration-300">Catalog</p>
                <p className="text-xs font-black text-brand-blue dark:text-white mt-1 whitespace-nowrap transition-colors duration-300">{totalCount} Products</p>
              </div>
              <div className="w-9 h-9 bg-brand-blue dark:bg-[#222] text-white rounded-xl flex items-center justify-center shadow-md shadow-brand-blue/10 dark:shadow-none transition-colors duration-300">
                <LayoutGrid size={16} />
              </div>
            </div>
          </div>

          {/* Mobile Filter Bar */}
          <div className="flex lg:hidden w-full items-center justify-between gap-4 bg-white/40 dark:bg-[#111]/40 backdrop-blur-md p-4 rounded-[2rem] border border-white/50 dark:border-[#333]/50 shadow-sm transition-colors duration-300">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-3 px-6 py-3 bg-brand-blue dark:bg-white text-white dark:text-black rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg shadow-brand-blue/20 dark:shadow-none active:scale-95 transition-all duration-300"
            >
              <SlidersHorizontal size={14} className="text-brand-gold dark:text-brand-gold" />
              <span>Filter & Refine</span>
              <span className="ml-1 bg-white/20 dark:bg-gray-200 dark:text-black text-white text-[9px] px-2 py-0.5 rounded-full">{totalCount}</span>
            </button>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none transition-colors duration-300">Showing</p>
              <p className="text-xs font-black text-brand-blue dark:text-white mt-1 transition-colors duration-300">{totalCount} Pcs</p>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md z-[200] animate-in fade-in duration-200 flex flex-col justify-end lg:hidden transition-colors duration-300">
            <div className="bg-[#f8fafc] dark:bg-black w-full max-h-[90vh] rounded-t-[3rem] p-6 flex flex-col overflow-hidden border-t border-white dark:border-[#333] shadow-2xl animate-in slide-in-from-bottom duration-300 transition-colors">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#333] mb-4 transition-colors duration-300">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-brand-gold" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-brand-blue dark:text-white transition-colors duration-300">Filter Parameters</h2>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-[#222] text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-[#333] rounded-full transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 pb-24 no-scrollbar">
                <ProductFilters
                  categories={categories}
                  brands={brands}
                  lifestyleTags={lifestyleTags}
                  filters={filters}
                  setFilters={setFilters}
                  isMobile={true}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] dark:from-black dark:via-black to-transparent border-t border-slate-100 dark:border-[#333] transition-colors duration-300">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-4 bg-brand-blue dark:bg-brand-gold text-white dark:text-black font-black text-[12px] uppercase tracking-widest rounded-full shadow-xl active:scale-95 transition-all duration-300 text-center block"
                >
                  Apply Filter & View ({totalCount} Products)
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="relative z-10">
          {showFullScreenLoader ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-6">
              <div className="relative">
                <Loader2 className="animate-spin text-brand-gold" size={48} strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-brand-blue dark:bg-white rounded-full animate-ping transition-colors duration-300" />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 dark:text-gray-500 animate-pulse transition-colors duration-300">Syncing Collection</p>
            </div>
          ) : (
            <>
              <div
                className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10 transition-opacity duration-300 ${
                  productsLoading ? "opacity-40 pointer-events-none" : "opacity-100"
                }`}
              >
                {products.map((item, idx) => (
                  <div
                    key={item.id}
                    className="group product-reveal transition-transform duration-500 hover:-translate-y-2"
                    style={{ animationDelay: `${(idx % 8) * 60}ms` }}
                  >
                    <ProductCard product={item} userId={userId} priority={idx < 4} />
                  </div>
                ))}
              </div>

              <PaginationControls className="mt-16" />

              {!productsLoading && products.length === 0 && (
                <div className="py-40 text-center rounded-[4rem] border-2 border-dashed border-white dark:border-[#333] bg-white/30 dark:bg-[#111]/30 backdrop-blur-sm mt-8 transition-colors duration-300">
                  <div className="w-20 h-20 bg-white dark:bg-[#111] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm transition-colors duration-300">
                    <SlidersHorizontal size={24} className="text-brand-gold" />
                  </div>
                  <h3 className="text-xl font-black text-brand-blue dark:text-white uppercase tracking-tight transition-colors duration-300">No Items Match Your Filter</h3>
                  <p className="text-slate-400 dark:text-gray-500 text-sm mt-2 transition-colors duration-300">Try adjusting your selection or reset filters</p>
                  <button onClick={clearAllFilters} className="mt-8 text-[10px] font-black uppercase tracking-widest text-brand-gold hover:underline">
                    Clear All Filters
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style>{`
        @keyframes productReveal {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .product-reveal {
          opacity: 0;
          animation: productReveal 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
}
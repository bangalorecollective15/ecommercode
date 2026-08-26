"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import supabase from "@/lib/supabase";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import GalleryHeader from "../components/products/GalleryHeader";
import DesktopFilterBar from "../components/products/DesktopFilterBar";
import MobileFilterBar from "../components/products/MobileFilterBar";
import MobileFilterDrawer from "../components/products/MobileFilterDrawer";
import ProductGrid from "../components/products/ProductGrid";
import PaginationControls from "../components/products/PaginationControls";

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

// Read a filter value straight out of URLSearchParams — the single source of truth.
function filtersFromParams(sp: URLSearchParams) {
  return {
    category_id: sp.get("cat") ? Number(sp.get("cat")) : null,
    subcategory_id: sp.get("subcat") ? Number(sp.get("subcat")) : null,
    sub_subcategory_id: sp.get("subsubcat") ? Number(sp.get("subsubcat")) : null,
    brand_id: sp.get("brand") ? Number(sp.get("brand")) : null,
    lifestyle_tag_id: sp.get("lifestyle") ? Number(sp.get("lifestyle")) : null,
    sort: sp.get("sort") || "latest",
    search: sp.get("q") || "",
  };
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

  const [products, setProducts] = useState<any[]>(initialProducts);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [brands, setBrands] = useState<any[]>(initialBrands);
  const [lifestyleTags, setLifestyleTags] = useState<any[]>(initialLifestyleTags);

  const [productsLoading, setProductsLoading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const tagParam = searchParams.get("tag"); // legacy name-based deep link, e.g. /products?tag=running

  const currentPage = Number(searchParams.get("page")) || initialPage;
  const productsPerPage = 60;

  // ── Filters now hydrate from the URL first, falling back to server-provided initial values. ──
  const [filters, setFiltersState] = useState(() => {
    const fromUrl = filtersFromParams(searchParams);
    return {
      category_id: fromUrl.category_id ?? initialFilters.category_id,
      subcategory_id: fromUrl.subcategory_id,
      sub_subcategory_id: fromUrl.sub_subcategory_id,
      brand_id: fromUrl.brand_id ?? initialFilters.brand_id,
      lifestyle_tag_id: fromUrl.lifestyle_tag_id ?? initialFilters.lifestyle_tag_id,
      sort: fromUrl.sort,
      search: fromUrl.search,
    };
  });

  // Guards so URL<->state syncing doesn't loop or fight each other.
  const isSyncingFromUrl = useRef(false);
  const isFirstFilterRun = useRef(true);
  const isFirstProductRun = useRef(true);

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  // Wrapper so ProductFilters' setFilters calls keep working unchanged.
  const setFilters = useCallback((next: any) => {
    setFiltersState(typeof next === "function" ? next : next);
  }, []);

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

  // ── Push filter changes into the URL (mirrors the `page` pattern already used). ──
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    if (isSyncingFromUrl.current) {
      // This change originated from the URL itself (e.g. back navigation) — don't re-push.
      isSyncingFromUrl.current = false;
      return;
    }

    const current = new URLSearchParams(Array.from(searchParams.entries()));

    const setOrDelete = (key: string, value: any) => {
      if (value === null || value === undefined || value === "") current.delete(key);
      else current.set(key, String(value));
    };

    setOrDelete("cat", filters.category_id);
    setOrDelete("subcat", filters.subcategory_id);
    setOrDelete("subsubcat", filters.sub_subcategory_id);
    setOrDelete("brand", filters.brand_id);
    setOrDelete("lifestyle", filters.lifestyle_tag_id);
    setOrDelete("sort", filters.sort !== "latest" ? filters.sort : null);
    setOrDelete("q", debouncedSearch);
    current.delete("page"); // any real filter change resets pagination
    current.delete("tag"); // once resolved into an id, drop the legacy name param

    const query = current.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
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

  // ── Re-sync local filter state whenever the URL changes from elsewhere ──
  // (browser back/forward, or returning here via a product page's back button).
  useEffect(() => {
    const fromUrl = filtersFromParams(searchParams);
    setFiltersState((prev) => {
      const changed =
        prev.category_id !== fromUrl.category_id ||
        prev.subcategory_id !== fromUrl.subcategory_id ||
        prev.sub_subcategory_id !== fromUrl.sub_subcategory_id ||
        prev.brand_id !== fromUrl.brand_id ||
        prev.lifestyle_tag_id !== fromUrl.lifestyle_tag_id ||
        prev.sort !== fromUrl.sort ||
        prev.search !== fromUrl.search;

      if (!changed) return prev;
      isSyncingFromUrl.current = true;
      return { ...fromUrl };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Legacy support: ?tag=running (by name) resolves to an id once tags are loaded.
  useEffect(() => {
    if (!tagParam || lifestyleTags.length === 0) return;
    const foundTag = lifestyleTags.find((t: any) => t.name.toLowerCase() === tagParam.toLowerCase());
    if (foundTag && foundTag.id !== filters.lifestyle_tag_id) {
      setFilters((prev: any) => ({ ...prev, lifestyle_tag_id: foundTag.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagParam, lifestyleTags]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id || null));
  }, []);

  // --- PRODUCTS: skip the first run only if URL filters match what SSR used ---
  useEffect(() => {
    if (isFirstProductRun.current) {
      isFirstProductRun.current = false;

      const matchesServerState =
        filters.category_id === initialFilters.category_id &&
        filters.brand_id === initialFilters.brand_id &&
        filters.lifestyle_tag_id === initialFilters.lifestyle_tag_id &&
        !filters.subcategory_id &&
        !filters.sub_subcategory_id &&
        filters.sort === "latest" &&
        !filters.search &&
        currentPage === initialPage;

      if (matchesServerState) {
        return; // server already rendered the right data, skip refetch
      }
      // otherwise fall through and fetch fresh — URL filters don't match what SSR used
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

  // ── The URL the user should return to after viewing a product ──
  const returnUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const showFullScreenLoader = productsLoading && products.length === 0 && totalCount === 0;

  return (
    <div className="bg-[#f8fafc] dark:bg-black min-h-screen text-brand-blue dark:text-white pb-32 relative font-sans transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-brand-gold/5 dark:bg-brand-gold/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-brand-blue/5 dark:bg-[#222]/30 rounded-full blur-[120px] transition-colors duration-300" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12">
        <GalleryHeader activeBrandName={activeBrandName} activeCategoryName={activeCategoryName} />

        <div className="sticky top-24 z-50 mb-14">
          <DesktopFilterBar
            categories={categories}
            brands={brands}
            lifestyleTags={lifestyleTags}
            filters={filters}
            setFilters={setFilters}
            totalCount={totalCount}
          />
          <MobileFilterBar totalCount={totalCount} onOpen={() => setIsMobileMenuOpen(true)} />
        </div>

        <MobileFilterDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          categories={categories}
          brands={brands}
          lifestyleTags={lifestyleTags}
          filters={filters}
          setFilters={setFilters}
          totalCount={totalCount}
        />

        <main className="relative z-10">
          <ProductGrid
            products={products}
            productsLoading={productsLoading}
            showFullScreenLoader={showFullScreenLoader}
            userId={userId}
            returnUrl={returnUrl}
            onClearFilters={clearAllFilters}
          />
          {!showFullScreenLoader && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-16"
            />
          )}
        </main>
      </div>
    </div>
  );
}
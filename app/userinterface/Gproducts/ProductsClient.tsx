"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import supabase from "@/lib/supabase";
import { usePathname } from "next/navigation";
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

type Filters = {
  category_id: number | null;
  subcategory_id: number | null;
  sub_subcategory_id: number | null;
  brand_id: number | null;
  lifestyle_tag_id: number | null;
  sort: string;
  search: string;
};

function parseSearch(search: string) {
  const sp = new URLSearchParams(search);
  return {
    filters: {
      category_id: sp.get("cat") ? Number(sp.get("cat")) : null,
      subcategory_id: sp.get("subcat") ? Number(sp.get("subcat")) : null,
      sub_subcategory_id: sp.get("subsubcat") ? Number(sp.get("subsubcat")) : null,
      brand_id: sp.get("brand") ? Number(sp.get("brand")) : null,
      lifestyle_tag_id: sp.get("lifestyle") ? Number(sp.get("lifestyle")) : null,
      sort: sp.get("sort") || "latest",
      search: sp.get("q") || "",
    } as Filters,
    page: Number(sp.get("page")) || 1,
    tag: sp.get("tag"),
  };
}

function buildSearch(filters: Filters, page: number) {
  const params = new URLSearchParams();
  const set = (key: string, value: any) => {
    if (value !== null && value !== undefined && value !== "") params.set(key, String(value));
  };
  set("cat", filters.category_id);
  set("subcat", filters.subcategory_id);
  set("subsubcat", filters.sub_subcategory_id);
  set("brand", filters.brand_id);
  set("lifestyle", filters.lifestyle_tag_id);
  set("sort", filters.sort !== "latest" ? filters.sort : null);
  set("q", filters.search);
  set("page", page > 1 ? page : null);
  return params.toString();
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
  const pathname = usePathname();

  const [products, setProducts] = useState<any[]>(initialProducts);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [brands, setBrands] = useState<any[]>(initialBrands);
  const [lifestyleTags, setLifestyleTags] = useState<any[]>(initialLifestyleTags);

  const [productsLoading, setProductsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // --- Added wishlist and cart tracking state ---
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [cartVariationIds, setCartVariationIds] = useState<Set<string>>(new Set());

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === "undefined") return initialPage;
    return parseSearch(window.location.search).page || initialPage;
  });
  const productsPerPage = 60;

  const [filters, setFiltersState] = useState<Filters>(() => {
    if (typeof window === "undefined") {
      return {
        category_id: initialFilters.category_id,
        subcategory_id: null,
        sub_subcategory_id: null,
        brand_id: initialFilters.brand_id,
        lifestyle_tag_id: initialFilters.lifestyle_tag_id,
        sort: "latest",
        search: "",
      };
    }
    const fromUrl = parseSearch(window.location.search).filters;
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

  const [tagParam, setTagParam] = useState<string | null>(() =>
    typeof window === "undefined" ? null : parseSearch(window.location.search).tag
  );

  const isSyncingFromUrl = useRef(false);
  const isFirstFilterRun = useRef(true);
  const isFirstProductRun = useRef(true);

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  const setFilters = useCallback((next: any) => {
    setFiltersState((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);

  const pushUrl = useCallback(
    (search: string) => {
      const url = `${pathname}${search ? `?${search}` : ""}`;
      window.history.pushState(null, "", url);
    },
    [pathname]
  );

  const setPage = (pageNumber: number) => {
    if (pageNumber === currentPage) return;
    setCurrentPage(pageNumber);
    pushUrl(buildSearch(filters, pageNumber));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    if (isSyncingFromUrl.current) {
      isSyncingFromUrl.current = false;
      return;
    }

    setCurrentPage(1);
    pushUrl(buildSearch({ ...filters, search: debouncedSearch }, 1));
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
    const onPopState = () => {
      const { filters: fromUrl, page } = parseSearch(window.location.search);
      isSyncingFromUrl.current = true;
      setFiltersState(fromUrl);
      setCurrentPage(page);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!tagParam || lifestyleTags.length === 0) return;
    const foundTag = lifestyleTags.find((t: any) => t.name.toLowerCase() === tagParam.toLowerCase());
    if (foundTag && foundTag.id !== filters.lifestyle_tag_id) {
      setFilters((prev: Filters) => ({ ...prev, lifestyle_tag_id: foundTag.id }));
    }
    setTagParam(null);
  }, [tagParam, lifestyleTags, setFilters]);

  // Fetch session, wishlist, and cart references
  useEffect(() => {

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);

      if (currentUserId) {
        // Fetch user wishlists
        const { data: wishlistData } = await supabase
          .from("wishlists")
          .select("product_id")
          .eq("user_id", currentUserId);

        if (wishlistData) {
          setWishlistedIds(new Set(wishlistData.map((w: any) => w.product_id)));
        }

        // Fetch user cart variation IDs
        const { data: cartData } = await supabase
          .from("cart_items")
          .select("product_variation_id")
          .eq("user_id", currentUserId);

        if (cartData) {
          setCartVariationIds(new Set(cartData.map((c: any) => c.product_variation_id)));
        }
      }
    });
  }, []);

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
        return;
      }
    }

    let cancelled = false;

    const fetchProducts = async () => {
      setProductsLoading(true);

      const from = (currentPage - 1) * productsPerPage;
      const to = from + productsPerPage - 1;

      const fullSelect = `
        id, name, lifestyle_tag_id, category_id, subcategory_id, sub_subcategory_id, brand_id, created_at,
        product_images(image_url),
        product_variations!inner(id, price, stock, size_id, attributes:size_id(name))
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

  const returnUrl = `${pathname}${(() => {
    const q = buildSearch(filters, currentPage);
    return q ? `?${q}` : "";
  })()}`;

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
            wishlistedIds={wishlistedIds}
            cartVariationIds={cartVariationIds}
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
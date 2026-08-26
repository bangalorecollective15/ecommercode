"use client";

import { createClient } from "@supabase/supabase-js";
import { notFound, useRouter, useSearchParams, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { use, useState, useEffect, useMemo, useRef } from "react";
import ShopHeader from "../../components/shop/ShopHeader";
import ShopFilterBar from "../../components/shop/ShopFilterBar";
import ShopProductGrid from "../../components/shop/ShopProductGrid";
import ShopPagination from "../../components/shop/ShopPagination";

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
            .select(
              `
              *,
              brands (id, name_en),
              categories (name),
              product_images (image_url),
              product_variations (*, attributes:size_id ( name ))
            `
            )
            .eq(currentConfig.column, id)
            .eq("active", true),

          supabase.from(currentConfig.table).select("name").eq("id", id).single(),

          supabase.auth.getSession(),
        ]);

        if (productsResponse.error) {
          setError(true);
          return;
        }

        const formattedProducts =
          productsResponse.data?.map((p) => {
            const initialVariation = p.product_variations?.[0];
            const calculatedPrice = initialVariation
              ? initialVariation.sale_price || initialVariation.price
              : 0;

            return {
              ...p,
              image: p.product_images?.[0]?.image_url || "/placeholder.png",
              sortingPrice: Number(calculatedPrice),
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

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-black pb-32 relative font-sans overflow-hidden transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-gold/5 dark:bg-brand-gold/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] left-[-5%] w-[400px] h-[400px] bg-brand-blue/5 dark:bg-[#222]/30 rounded-full blur-[100px] transition-colors duration-300" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 pt-40 relative z-10">
        <ShopHeader type={type} displayName={displayName} resultCount={filteredAndSortedProducts.length} />

        <ShopFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedBrand={selectedBrand}
          onBrandChange={handleBrandChange}
          availableBrands={availableBrands}
          selectedVariation={selectedVariation}
          onVariationChange={handleVariationChange}
          availableVariations={availableVariations}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          isFilterActive={isFilterActive}
          onClearFilters={handleClearFilters}
        />

        <ShopProductGrid
          currentProducts={currentProducts}
          hasAnyProducts={products.length > 0}
          userId={userId}
          returnUrl={returnUrl}
        />

        <ShopPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </main>
  );
}
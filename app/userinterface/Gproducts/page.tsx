import supabase from "@/lib/supabase";
import { unstable_cache } from "next/cache";
import ProductsClient from "./ProductsClient";

const PRODUCTS_PER_PAGE = 60;

// Trimmed: only the variation fields the UI actually reads (price + stock filter + size name).
const FULL_SELECT = `
  id, name, lifestyle_tag_id, category_id, subcategory_id, sub_subcategory_id, brand_id, created_at,
  product_images(image_url),
  product_variations!inner(id, price, stock, size_id, attributes:size_id(name))
`;

// Force fresh data per request since filters/pagination come from the URL.
export const dynamic = "force-dynamic";

// --- Static filter chrome: cached independently of product data, revalidated every 5 min. ---
// These rarely change, so there's no reason to hit the DB for them on every request.
const getFilterChrome = unstable_cache(
  async () => {
    const [{ data: brands }, { data: categories }, { data: lifestyleTags }] = await Promise.all([
      supabase.from("brands").select("*").eq("status", true),
      supabase
        .from("categories")
        .select(`id, name, subcategories (id, name, sub_subcategories (id, name))`)
        .order("priority", { ascending: true }),
      supabase.from("attributes").select("id, name").eq("type", "lifestyle_tag"),
    ]);
    return {
      brands: brands || [],
      categories: categories || [],
      lifestyleTags: lifestyleTags || [],
    };
  },
  ["products-filter-chrome"],
  { revalidate: 300 } // 5 min
);

async function fetchProducts({
  categoryId,
  brandId,
  lifestyleTagId,
  page,
}: {
  categoryId: number | null;
  brandId: number | null;
  lifestyleTagId: number | null;
  page: number;
}) {
  const from = (page - 1) * PRODUCTS_PER_PAGE;
  const to = from + PRODUCTS_PER_PAGE - 1;

  let productQuery = supabase
    .from("products")
    .select(FULL_SELECT, { count: "exact" })
    .eq("active", true)
    .gt("product_variations.stock", 0)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (categoryId) productQuery = productQuery.eq("category_id", categoryId);
  if (brandId) productQuery = productQuery.eq("brand_id", brandId);
  if (lifestyleTagId) productQuery = productQuery.eq("lifestyle_tag_id", lifestyleTagId);

  const { data, count } = await productQuery;

  return {
    products: (data || []).map((p: any) => ({
      ...p,
      price: p.product_variations?.[0]?.price || 0,
      image: p.product_images?.[0]?.image_url,
    })),
    count: count || 0,
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const categoryId = params.category_id ? Number(params.category_id) : null;
  const brandId = params.brand_id ? Number(params.brand_id) : null;
  const tagParam = typeof params.tag === "string" ? params.tag : null;
  const page = params.page ? Number(params.page) : 1;

  // Chrome data is cached, so this resolves near-instantly on warm cache.
  const chromePromise = getFilterChrome();

  let brands, categories, lifestyleTags, initialProducts, count, resolvedTagId: number | null;

  if (tagParam) {
    // Tag needs to be resolved to an id before we can filter products —
    // this is the only case that has to be sequential.
    const chrome = await chromePromise;
    brands = chrome.brands;
    categories = chrome.categories;
    lifestyleTags = chrome.lifestyleTags;
    resolvedTagId =
      lifestyleTags.find((t: any) => t.name.toLowerCase() === tagParam.toLowerCase())?.id ?? null;

    const result = await fetchProducts({ categoryId, brandId, lifestyleTagId: resolvedTagId, page });
    initialProducts = result.products;
    count = result.count;
  } else {
    // No tag param: chrome and products don't depend on each other — run in parallel.
    resolvedTagId = null;
    const [chrome, result] = await Promise.all([
      chromePromise,
      fetchProducts({ categoryId, brandId, lifestyleTagId: null, page }),
    ]);
    brands = chrome.brands;
    categories = chrome.categories;
    lifestyleTags = chrome.lifestyleTags;
    initialProducts = result.products;
    count = result.count;
  }

  return (
    <ProductsClient
      initialProducts={initialProducts}
      initialTotalCount={count}
      initialBrands={brands}
      initialCategories={categories}
      initialLifestyleTags={lifestyleTags}
      initialFilters={{
        category_id: categoryId,
        brand_id: brandId,
        lifestyle_tag_id: resolvedTagId,
      }}
      initialPage={page}
    />
  );
}
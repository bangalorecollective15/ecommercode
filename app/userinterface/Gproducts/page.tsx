import supabase from "@/lib/supabase";
import ProductsClient from "./ProductsClient";

const PRODUCTS_PER_PAGE = 60;

const FULL_SELECT = `
  id, name, lifestyle_tag_id, category_id, subcategory_id, sub_subcategory_id, brand_id, created_at,
  product_images(image_url),
  product_variations!inner(*, attributes:size_id(name))
`;

// Force fresh data per request since filters/pagination come from the URL.
// (Swap to `export const revalidate = 60` later if you want cached/ISR pages
// for the no-filter default view specifically.)
export const dynamic = "force-dynamic";

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

  // --- Static filter chrome data (brands, categories, lifestyle tags) ---
  const [{ data: brands }, { data: categories }, { data: lifestyleTags }] = await Promise.all([
    supabase.from("brands").select("*").eq("status", true),
    supabase
      .from("categories")
      .select(`id, name, subcategories (id, name, sub_subcategories (id, name))`)
      .order("priority", { ascending: true }),
    supabase.from("attributes").select("id, name").eq("type", "lifestyle_tag"),
  ]);

  // Resolve ?tag= to an id server-side too, so the very first product fetch is already correct.
  const resolvedTagId =
    tagParam && lifestyleTags
      ? lifestyleTags.find((t: any) => t.name.toLowerCase() === tagParam.toLowerCase())?.id ?? null
      : null;

  // --- First page of products, matching whatever filters are in the URL ---
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
  if (resolvedTagId) productQuery = productQuery.eq("lifestyle_tag_id", resolvedTagId);

  const { data: products, count } = await productQuery;

  const initialProducts = (products || []).map((p: any) => ({
    ...p,
    price: p.product_variations?.[0]?.price || 0,
    image: p.product_images?.[0]?.image_url,
  }));

  return (
    <ProductsClient
      initialProducts={initialProducts}
      initialTotalCount={count || 0}
      initialBrands={brands || []}
      initialCategories={categories || []}
      initialLifestyleTags={lifestyleTags || []}
      initialFilters={{
        category_id: categoryId,
        brand_id: brandId,
        lifestyle_tag_id: resolvedTagId,
      }}
      initialPage={page}
    />
  );
}
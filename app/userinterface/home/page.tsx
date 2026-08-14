import supabase from "@/lib/supabase";
import HomeClient from "@/app/userinterface/home/HomeClient";

export const dynamic = "force-dynamic";
// Swap to `export const revalidate = 60;` instead of force-dynamic once you're
// ready to cache this page and regenerate it in the background every 60s.

export default async function HomePage() {
  const { data: attributesData } = await supabase
  .from("attributes")
  .select("id, type, name")
  .eq("type", "lifestyle_tag");

  const [
    { data: heroSections },
    { data: siteInfo },
    { data: categoriesData },
    { data: subcategoriesData },
    { data: brandsData },
    { data: instagramData },
    { data: productsData },
    { data: tagsData },
  ] = await Promise.all([
    supabase.from("hero_section").select("*").eq("active", true).order("created_at", { ascending: false }),
    supabase
      .from("site_info")
      .select(`
        middle_badge, middle_title, middle_description,
        cat1_title, cat1_description, cat1_image_url,
        cat2_title, cat2_description, cat2_image_url,
        cat3_title, cat3_description, cat3_image_url,
        live_badge, live_title, live_image_url, live_quote,
        stat1_value, stat1_label, stat2_value, stat2_label,
        stat3_value, stat3_label, stat4_value, stat4_label
      `)
      .eq("id", 1)
      .single(),
    supabase.from("categories").select("*").eq("home_status", true).order("priority", { ascending: true }),
    supabase.from("subcategories").select("*").order("priority", { ascending: true }),
    supabase.from("brands").select("*").eq("status", true).order("id", { ascending: false }),
    supabase.from("instagram_links").select("url").eq("published", true).order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select(`*, product_variations(*, attributes:size_id(name)), product_images(image_url)`)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("attributes").select("id, name").eq("type", "lifestyle_tag"),
  ]);

  // --- Spotlight products: in-stock only, capped at 6 ---
  const latestProducts = (productsData || [])
    .filter((p: any) => p.product_variations?.some((v: any) => v.stock > 0))
    .slice(0, 6)
    .map((p: any) => ({
      ...p,
      price: p.product_variations?.[0]?.price || 0,
      image: p.product_images?.[0]?.image_url,
      availableSizes: Array.from(
        new Set(p.product_variations?.map((v: any) => v.attributes?.name).filter(Boolean))
      ),
    }));

  // --- Lifestyle sections: ONE query for every tag's products instead of one query per tag ---
  const tagIds = (tagsData || []).map((t: any) => t.id);
  let lifestyleSections: any[] = [];

  if (tagIds.length > 0) {
    const { data: lifestyleProducts } = await supabase
      .from("products")
      .select(`*, product_variations(*, attributes:size_id(name)), product_images(image_url)`)
      .in("lifestyle_tag_id", tagIds)
      .eq("active", true);

    lifestyleSections = (tagsData || [])
      .map((tag: any) => {
        const products = (lifestyleProducts || [])
          .filter((p: any) => p.lifestyle_tag_id === tag.id)
          .slice(0, 4)
          .map((p: any) => ({
            ...p,
            price: p.product_variations?.[0]?.price || 0,
            image: p.product_images?.[0]?.image_url,
            availableSizes: Array.from(
              new Set(p.product_variations?.map((v: any) => v.attributes?.name).filter(Boolean))
            ),
          }));
        return { tagId: tag.id, tagName: tag.name, products };
      })
      .filter((s: any) => s.products.length > 0);
  }

  return (
    <HomeClient
      initialHeroSections={heroSections || []}
      initialData={siteInfo || null}
      initialCategories={categoriesData || []}
      initialSubcategories={subcategoriesData || []}
      initialBrands={brandsData || []}
      initialInstagramLinks={instagramData || []}
      initialLatestProducts={latestProducts}
      initialLifestyleSections={lifestyleSections}
        initialAttributes={attributesData || []} 
    />
  );
}
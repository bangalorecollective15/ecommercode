// app/userinterface/Gproducts/[...slug]/page.tsx
import { createClient } from "@supabase/supabase-js";
import ProductCard from "../../components/ProductCard"; 
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function UnifiedShopPage({ params }: PageProps) {
  const { slug } = await params;
  const [type, id] = slug || [];

  if (!type || !id) return notFound();

  // Mapping URL slugs to Table Names and Column Names
  const config: Record<string, { table: string; column: string }> = {
    category: { table: "categories", column: "category_id" },
    subcategory: { table: "subcategories", column: "subcategory_id" },
    products: { table: "sub_subcategories", column: "sub_subcategory_id" },
  };

  const currentConfig = config[type];
  if (!currentConfig) return notFound();

  // 1. Parallel Fetch: Products + The specific Category/Subcategory Name
  const [productsResponse, titleResponse, authResponse] = await Promise.all([
    supabase
      .from("products")
      .select(`
        *,
        brands (name_en),
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
    console.error("Supabase Error:", productsResponse.error);
    return <div className="pt-40 text-center">Error loading collection.</div>;
  }

  const userId = authResponse.data.session?.user?.id || null;
  const displayName = titleResponse.data?.name || type;

  // 2. Map products for the ProductCard
  const products = productsResponse.data?.map(p => ({
    ...p,
    price: p.product_variations?.[0]?.price || 0,
    image: p.product_images?.[0]?.image_url
  })) || [];

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-20 relative">
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-50/40 via-white to-transparent -z-10" />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-40">
        
        {/* Header Section with Dynamic Names */}
        <header className="mb-16 text-center">
           <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
              Exploring {type.replace("_", " ")}
            </span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-slate-900">
              {displayName}
            </h1>
            <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-orange-600"></span>
                <span className="text-orange-600 font-black uppercase tracking-[0.2em] text-xs">
                    Collection
                </span>
                <span className="h-px w-8 bg-orange-600"></span>
            </div>
          </div>

          <p className="text-slate-400 text-[10px] font-black tracking-[0.4em] mt-8 uppercase">
            {products.length} Curated Items Found
          </p>
        </header>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                userId={userId} 
              />
            ))
          ) : (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-white/40">
              <p className="text-slate-300 font-black uppercase tracking-widest text-xs">
                This collection is currently empty
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
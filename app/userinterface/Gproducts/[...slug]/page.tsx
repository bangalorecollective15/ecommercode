// app/userinterface/Gproducts/[...slug]/page.tsx
import { createClient } from "@supabase/supabase-js";
import ProductCard from "../../components/ProductCard"; 
import { notFound } from "next/navigation";
import { Sparkles, ShoppingBag, Layers } from "lucide-react";

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

  const config: Record<string, { table: string; column: string }> = {
    category: { table: "categories", column: "category_id" },
    subcategory: { table: "subcategories", column: "subcategory_id" },
    subsubcategory: { table: "sub_subcategories", column: "sub_subcategory_id" }, 
  };

  const currentConfig = config[type];
  if (!currentConfig) return notFound();

  // Fetch everything in parallel
  const [productsResponse, titleResponse, sessionResponse] = await Promise.all([
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

  const userId = sessionResponse.data?.session?.user?.id || null;
  const displayName = titleResponse.data?.name || type;

  if (productsResponse.error) return notFound();

  const products = productsResponse.data?.map(p => ({
    ...p,
    // Use the first image if available
    image: p.product_images?.[0]?.image_url || "/placeholder.png"
  })) || [];

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-32 relative font-sans overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] left-[-5%] w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-40 relative z-10">
        <header className="mb-20 text-center">
          <div className="inline-flex items-center gap-3 mb-6 px-5 py-2 bg-white/60 backdrop-blur-md border border-white rounded-full shadow-sm">
            <Sparkles className="text-brand-gold" size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
              Exploring {type.replace("_", " ")}
            </span>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-brand-blue leading-none">
              {displayName}<span className="text-brand-gold">.</span>
            </h1>
          </div>

          <div className="mt-10 inline-flex items-center gap-3 px-6 py-3 bg-brand-blue text-white rounded-full shadow-xl">
             <ShoppingBag size={14} className="text-brand-gold" />
             <span className="text-[10px] font-black uppercase tracking-widest">
               {products.length} Curated Pieces Found
             </span>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                userId={userId} 
              />
            ))
          ) : (
            <div className="col-span-full py-48 text-center border-2 border-dashed border-white bg-white/30 backdrop-blur-xl rounded-[4rem]">
              <Layers size={24} className="text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-black text-brand-blue uppercase">Empty Collection</h3>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
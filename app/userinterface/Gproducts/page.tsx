"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilters";
import { Loader2, ShoppingBag, Sparkles, SlidersHorizontal, LayoutGrid } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
const [lifestyleTags, setLifestyleTags] = useState<any[]>([]);
const tagParam = searchParams.get("tag");

 const [filters, setFilters] = useState({
  category_id: searchParams.get("category_id") ? Number(searchParams.get("category_id")) : null,
  subcategory_id: null,
  sub_subcategory_id: null,
  brand_id: searchParams.get("brand_id") ? Number(searchParams.get("brand_id")) : null,
  lifestyle_tag_id: null,
  sort: "latest"
});

useEffect(() => {
  if (!tagParam || lifestyleTags.length === 0) return;

  const foundTag = lifestyleTags.find(
    (t: any) => t.name.toLowerCase() === tagParam.toLowerCase()
  );

  if (foundTag) {
    setFilters(prev => ({
      ...prev,
      lifestyle_tag_id: foundTag.id
    }));
  }
}, [tagParam, lifestyleTags]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id || null));
    const fetchData = async () => {
      setLoading(true);
      const { data: bData } = await supabase.from("brands").select("*").eq("status", true);
      const { data: cData } = await supabase.from("categories")
        .select(`id, name, subcategories (id, name, sub_subcategories (id, name))`)
        .order("priority", { ascending: true });
      const { data: pData } = await supabase
  .from("products")
  .select(`
    id,
    name,
    lifestyle_tag_id,
    category_id,
    subcategory_id,
    sub_subcategory_id,
    brand_id,
    created_at,
    product_images(image_url),
    product_variations (*, attributes:size_id ( name ))
  `)
  .eq("active", true);

      setBrands(bData || []);
      setCategories(cData || []);
      setProducts(pData?.map(p => ({ 
        ...p, 
        price: p.product_variations?.[0]?.price || 0, 
        image: p.product_images?.[0]?.image_url 
      })) || []);
      setLoading(false);

      const { data: lData } = await supabase
  .from("attributes")
  .select("id, name")
  .eq("type", "lifestyle_tag");
  setLifestyleTags(lData || []);
    };

    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return products
      .filter(p => {
  if (filters.category_id && Number(p.category_id) !== Number(filters.category_id)) return false;
  if (filters.subcategory_id && Number(p.subcategory_id) !== Number(filters.subcategory_id)) return false;
  if (filters.sub_subcategory_id && Number(p.sub_subcategory_id) !== Number(filters.sub_subcategory_id)) return false;
  if (filters.brand_id && Number(p.brand_id) !== Number(filters.brand_id)) return false;

  // ✅ NEW LIFESTYLE FILTER
  if (
  filters.lifestyle_tag_id &&
  Number(p.lifestyle_tag_id ?? 0) !== Number(filters.lifestyle_tag_id)
) return false;

  return true;
})
      .sort((a, b) => {
        if (filters.sort === "alpha") return a.name.localeCompare(b.name);
        if (filters.sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [products, filters]);

  const activeCategoryName = categories.find(c => Number(c.id) === Number(filters.category_id))?.name;
  const activeBrandName = brands.find(b => Number(b.id) === Number(filters.brand_id))?.name_en;

  return (
    <div className="bg-[#f8fafc] min-h-screen text-brand-blue pb-32 relative font-sans">
      
      {/* ☁️ BACKGROUND ORBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-brand-blue/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12">
        
        {/* --- HEADER SECTION --- */}
        <header className="pt-32 pb-12 text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/60 backdrop-blur-md border border-white rounded-full shadow-sm">
            <Sparkles className="text-brand-gold" size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
              {activeBrandName ? "Brand Showcase" : "Curated Selection"}
            </span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-brand-blue uppercase">
            {activeBrandName || activeCategoryName || "The Gallery"}
            <span className="text-brand-gold">.</span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 text-slate-400">
             <div className="h-[1px] w-8 bg-brand-gold/30"></div>
             <p className="text-[10px] font-bold tracking-[0.2em] uppercase">Bengaluru Collective</p>
             <div className="h-[1px] w-8 bg-brand-gold/30"></div>
          </div>
        </header>

        {/* --- STICKY FILTER BAR (GLASSMORPHISM) --- */}
        <div className="sticky top-24 z-50 mb-16">
          <div className="bg-white/40 backdrop-blur-3xl border border-white/80 shadow-2xl shadow-slate-200/40 rounded-[2.5rem] px-8 py-5 transition-all hover:bg-white/60">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div className="flex-1 w-full no-scrollbar">
               <ProductFilters 
  categories={categories} 
  brands={brands} 
  lifestyleTags={lifestyleTags}
  filters={filters} 
  setFilters={setFilters} 
/>
              </div>

              <div className="hidden lg:flex items-center gap-6 pl-8 border-l border-slate-200/50">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Catalog</p>
                  <p className="text-sm font-black text-brand-blue mt-1">{filteredItems.length} Products</p>
                </div>
                <div className="w-12 h-12 bg-brand-blue text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-blue/20">
                  <LayoutGrid size={20} />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* --- PRODUCT GRID --- */}
        <main>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-6">
              <div className="relative">
                <Loader2 className="animate-spin text-brand-gold" size={48} strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-brand-blue rounded-full animate-ping" />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse">Syncing Collection</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                {filteredItems.map(item => (
                  <div key={item.id} className="group transition-transform duration-500 hover:-translate-y-2">
                    <ProductCard product={item} userId={userId} />
                  </div>
                ))}
              </div>

              {/* EMPTY STATE */}
              {filteredItems.length === 0 && (
                <div className="py-40 text-center rounded-[4rem] border-2 border-dashed border-white bg-white/30 backdrop-blur-sm">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <SlidersHorizontal size={24} className="text-brand-gold" />
                  </div>
                  <h3 className="text-xl font-black text-brand-blue uppercase tracking-tight">No Items Match Your Filter</h3>
                  <p className="text-slate-400 text-sm mt-2">Try adjusting your selection or reset filters</p>
                  <button 
                    onClick={() => setFilters({
  category_id: null,
  subcategory_id: null,
  sub_subcategory_id: null,
  brand_id: null,
  lifestyle_tag_id: null,
  sort: "latest"
})}
                    className="mt-8 text-[10px] font-black uppercase tracking-widest text-brand-gold hover:underline"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
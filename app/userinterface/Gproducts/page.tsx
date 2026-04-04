"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilters";
import { Loader2, ShoppingBag, Sparkles, SlidersHorizontal } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    category_id: searchParams.get("category_id") ? Number(searchParams.get("category_id")) : null,
    subcategory_id: null,
    sub_subcategory_id: null,
    brand_id: searchParams.get("brand_id") ? Number(searchParams.get("brand_id")) : null,
    sort: "latest"
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id || null));
    const fetchData = async () => {
      setLoading(true);
      const { data: bData } = await supabase.from("brands").select("*").eq("status", true);
      const { data: cData } = await supabase.from("categories")
        .select(`id, name, subcategories (id, name, sub_subcategories (id, name))`)
        .order("priority", { ascending: true });
      const { data: pData } = await supabase.from("products").select(`*, product_images(image_url), product_variations (*, attributes:size_id ( name ))`).eq("active", true);

      setBrands(bData || []);
      setCategories(cData || []);
      setProducts(pData?.map(p => ({ ...p, price: p.product_variations?.[0]?.price || 0, image: p.product_images?.[0]?.image_url })) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

const filteredItems = useMemo(() => {
  return products
    .filter(p => {
      // ... your existing category/subcategory filters ...
      if (filters.category_id && Number(p.category_id) !== Number(filters.category_id)) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "alpha") {
        return a.name.localeCompare(b.name); // Alphabetical A-Z
      }
      if (filters.sort === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Oldest first
      }
      // Default: Latest (Newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}, [products, filters]);
  const activeCategoryName = categories.find(c => Number(c.id) === Number(filters.category_id))?.name;
  const activeBrandName = brands.find(b => Number(b.id) === Number(filters.brand_id))?.name_en;

  return (
    <div className="bg-[#fcfcfc] min-h-screen text-slate-900 pb-20 relative">
      <div className="h-16 w-full" />
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-50/40 via-white to-transparent -z-10" />
      
      <header className="pt-32 pb-1 px-6 lg:px-12 max-w-[1600px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm">
          <Sparkles className="text-orange-600" size={12} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
            {activeBrandName ? "Curated Collection" : "Boutique Inventory"}
          </span>
        </div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-slate-900 mb-4">
          {activeBrandName || activeCategoryName || "The Gallery"}
        </h1>
      </header>

      <div className="sticky top-20 z-40 px-6 lg:px-12 mb-12">
        <div className="max-w-[1600px] mx-auto backdrop-blur-xl bg-white/80 border border-white/40 shadow-2xl shadow-slate-200/50 rounded-[2rem] px-8 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full"><ProductFilters categories={categories} brands={brands} filters={filters} setFilters={setFilters} /></div>
            <div className="hidden lg:flex items-center gap-4 pl-6 border-l border-slate-100">
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-slate-900 leading-none">{filteredItems.length}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Items</span>
              </div>
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white"><ShoppingBag size={16} /></div>
            </div>
          </div>
        </div>
      </div>

      <main className="px-6 lg:px-12 max-w-[1600px] mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-orange-600 mb-4" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Synchronizing Boutique</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map(item => <ProductCard key={item.id} product={item} userId={userId} />)}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-32 text-center rounded-[3rem] border-2 border-dashed border-slate-100 bg-white/40">
                <SlidersHorizontal size={24} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Items Match</h3>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-orange-600" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
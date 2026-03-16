"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilters";
import { Loader2, ShoppingBag } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function ProductsContent() {
  const searchParams = useSearchParams();
  
  // 1. Initial State from URL
  const initialCategoryId = searchParams.get("category_id");
  const initialBrandId = searchParams.get("brand_id");

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    category_id: initialCategoryId ? Number(initialCategoryId) : null,
    subcategory_id: null,
    sub_subcategory_id: null,
    brand_id: initialBrandId ? Number(initialBrandId) : null,
    sort: "latest"
  });

  // 2. Sync filters when URL parameters change (for Brand and Category links)
  useEffect(() => {
    const catId = searchParams.get("category_id");
    const brandId = searchParams.get("brand_id");

    setFilters(prev => ({
      ...prev,
      category_id: catId ? Number(catId) : prev.category_id,
      brand_id: brandId ? Number(brandId) : prev.brand_id,
      // If a new category is clicked, reset lower levels
      subcategory_id: catId ? null : prev.subcategory_id,
      sub_subcategory_id: catId ? null : prev.sub_subcategory_id,
    }));
  }, [searchParams]);

  // 3. Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 4. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: bData } = await supabase.from("brands").select("*").eq("status", true);
      setBrands(bData || []);

      const { data: cData } = await supabase
        .from("categories")
        .select(`id, name, subcategories (id, name, sub_subcategories (id, name))`)
        .order("priority", { ascending: true });
      setCategories(cData || []);

      const { data: pData } = await supabase
        .from("products")
        .select(`*, product_variations(*), product_images(image_url)`)
        .eq("active", true);

      setProducts(pData?.map(p => ({
        ...p,
        price: p.product_variations?.[0]?.price || 0,
        image: p.product_images?.[0]?.image_url
      })) || []);
      
      setLoading(false);
    };
    fetchData();
  }, []);

  // 5. Filter & Sort Logic
  const filteredItems = products
    .filter(p => {
      if (filters.brand_id && Number(p.brand_id) !== Number(filters.brand_id)) return false;
      if (filters.category_id && Number(p.category_id) !== Number(filters.category_id)) return false;
      if (filters.subcategory_id && Number(p.subcategory_id) !== Number(filters.subcategory_id)) return false;
      if (filters.sub_subcategory_id && Number(p.sub_subcategory_id) !== Number(filters.sub_subcategory_id)) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "low-high") return a.price - b.price;
      if (filters.sort === "high-low") return b.price - a.price;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Dynamic Header Text
  const activeCategoryName = categories.find(c => Number(c.id) === Number(filters.category_id))?.name;
  const activeBrandName = brands.find(b => Number(b.id) === Number(filters.brand_id))?.name_en;

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-slate-900">
      <div className="flex flex-col lg:flex-row gap-10 p-6 lg:p-12 max-w-[1500px] mx-auto pt-24">
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-80 lg:sticky lg:top-24 h-fit">
          <ProductFilters 
            categories={categories} 
            brands={brands} 
            filters={filters} 
            setFilters={setFilters} 
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b border-slate-100 pb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-[1px] w-8 bg-orange-600"></span>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-600">
                  {activeBrandName ? "Brand Spotlight" : "Explore Collection"}
                </span>
              </div>
              <h2 className="text-5xl font-black tracking-tighter">
                {activeBrandName ? `${activeBrandName} Products` : (activeCategoryName || "All Products")}
              </h2>
            </div>
            
            <div className="flex items-center gap-3 text-slate-400">
               <ShoppingBag size={18} />
               <span className="text-[10px] font-black uppercase tracking-widest">
                 {filteredItems.length} Items Found
               </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
               <Loader2 className="animate-spin text-orange-600" size={32} />
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Syncing Vault</p>
            </div>
          ) : (
            <>
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
                  {filteredItems.map(item => (
                    <ProductCard key={item.id} product={item} userId={userId} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No products found in this selection.</p>
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
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
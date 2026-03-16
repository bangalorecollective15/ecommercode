"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { 
  ArrowLeft, Package, Layers, Tag, Clock, 
  Truck, Droplets, Youtube, ScrollText, ListTree, ArrowRight 
} from "lucide-react";

// Swiper v10+
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProductViewPage({ params }: { params: Promise<{ id: string }> }) {
  // Safe unwrap for Next.js 15/16
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [variations, setVariations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!productId) return;
    setLoading(true);
    
    try {
      // 1. Fetch BASIC product first (Removes join complexity that causes 'Not Found')
      const { data: p, error: pErr } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (pErr || !p) {
        console.error("Supabase Select Error:", pErr);
        throw new Error("Product not found");
      }

      // 2. Fetch RELATIONS (Separate calls to ensure page loads even if data is missing)
   const [brandRes, catRes, subRes, subSubRes, tasteRes, imgRes, varRes] = await Promise.all([
  p.brand_id ? supabase.from("brands").select("name_en").eq("id", p.brand_id).single() : null,
        p.category_id ? supabase.from("categories").select("name").eq("id", p.category_id).single() : null,
        p.subcategory_id ? supabase.from("subcategories").select("name").eq("id", p.subcategory_id).single() : null,
        p.sub_subcategory_id ? supabase.from("sub_subcategories").select("name").eq("id", p.sub_subcategory_id).single() : null,
        p.taste_id ? supabase.from("attributes").select("name").eq("id", p.taste_id).single() : null,
        supabase.from("product_images").select("image_url").eq("product_id", productId),
        supabase.from("product_variations").select("*").eq("product_id", productId)
      ]);

      // 3. Construct the display object
      setProduct({
        ...p,
    brand_name: brandRes?.data?.name_en || "No Brand",
        category_path: [
          catRes?.data?.name,
          subRes?.data?.name,
          subSubRes?.data?.name
        ].filter(Boolean).join(" > ") || "Uncategorized",
        taste_name: tasteRes?.data?.name || "N/A",
        display_images: imgRes?.data?.map(img => img.image_url) || []
      });

      setVariations(varRes?.data || []);

    } catch (err: any) {
      console.error("Fetch Logic Error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-100 border-t-orange-600"></div>
    </div>
  );

  if (!product) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="bg-orange-50 p-6 rounded-full text-orange-600">
        <Package size={40} />
      </div>
      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Product {productId} not found</p>
      <button onClick={() => router.back()} className="px-5 py-2 bg-orange-600 text-white rounded-xl font-bold text-sm">
        Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-10">
      <Toaster position="top-right" />
      
      <div className="max-w-8xl mx-auto space-y-8">
        {/* Top Nav */}
        <div className="flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-orange-600 font-bold transition-all">
            <ArrowLeft size={18} /> BACK
          </button>
          {product.youtube_url && (
            <a href={product.youtube_url} target="_blank" className="flex items-center gap-2 text-red-600 font-black text-[10px] tracking-widest bg-red-50 px-4 py-2 rounded-full">
              <Youtube size={16} /> WATCH VIDEO
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Swiper Images */}
          <div className="lg:col-span-5">
            <div className="bg-white p-3 rounded-[2.5rem] shadow-sm border border-gray-100">
              {product.display_images.length > 0 ? (
                <Swiper modules={[Navigation, Pagination, Autoplay]} navigation pagination autoplay={{ delay: 3000 }} className="rounded-[2rem] overflow-hidden">
                  {product.display_images.map((url: string, i: number) => (
                    <SwiperSlide key={i}>
                      <img src={url} alt="Product" className="w-full aspect-square object-cover" />
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center rounded-[2rem] text-gray-300">
                  <Package size={48} />
                </div>
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                    {product.brand_name}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-full">
                    {product.category_path}
                  </span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 leading-tight uppercase tracking-tight">{product.name}</h1>
                <p className="text-gray-400 text-xs font-bold tracking-widest">SKU: {product.sku}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-50">
                <Detail icon={<Clock size={16}/>} label="Life" value={product.max_shelf_life} />
                <Detail icon={<Layers size={16}/>} label="Pack" value={product.pack_of} />
                <Detail icon={<Droplets size={16}/>} label="Taste" value={product.taste_name} />
                <Detail icon={<Truck size={16}/>} label="Ship" value={product.shipping_type} />
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600">Product Description</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
              </div>
              {product.youtube_url && (
  <a
    href={product.youtube_url}
    target="_blank"
    rel="noopener noreferrer"
    className="group relative inline-flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
  >
    {/* Decorative Pulse Dot */}
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
    </span>

    <div className="flex flex-col items-start">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-orange-600 transition-colors">
        Product Media
      </span>
      <span className="text-sm font-black text-gray-900 flex items-center gap-2">
        <Youtube size={18} className="text-red-600" />
        WATCH ON YOUTUBE
      </span>
    </div>

    {/* Hover Arrow */}
    <ArrowRight 
      size={16} 
      className="text-gray-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" 
    />
  </a>
)}

              {product.ingredients && (
                <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-700 mb-2 flex items-center gap-2">
                    <ScrollText size={14} /> Ingredients & Composition
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed font-medium">{product.ingredients}</p>
                </div>
              )}
            </div>

            {/* Variations */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Unit</th>
                    <th className="px-8 py-5">Value</th>
                    <th className="px-8 py-5 text-center">Stock</th>
                    <th className="px-8 py-5 text-right text-orange-600">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                  {variations.map((v) => (
                    <tr key={v.id} className="hover:bg-orange-50/10 transition-colors">
                      <td className="px-8 py-5 text-xs">{v.unit_type}</td>
                      <td className="px-8 py-5"><span className="bg-gray-100 px-2 py-1 rounded text-[10px]">{v.unit_value}</span></td>
                      <td className="px-8 py-5 text-center text-xs">{v.stock}</td>
                      <td className="px-8 py-5 text-right text-gray-900 font-black">₹{v.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-orange-600">
        {icon} <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <p className="text-xs font-bold text-gray-800">{value || "—"}</p>
    </div>
  );
}
"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft, Package, Layers, Tag, Clock,
  Truck, Droplets, Youtube, ScrollText, ListTree, ArrowRight,
  ShieldCheck, Info
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
      // 1. Fetch Product AND related images in ONE call
      const { data: p, error: pErr } = await supabase
        .from("products")
        .select(`
        *,
        product_images (
          image_url
        )
      `)
        .eq("id", productId)
        .single();

      if (pErr || !p) throw new Error("Product not found");

      // 2. Fetch other relations (Brands, Categories, etc.)
      const [brandRes, catRes, subRes, subSubRes, colorRes, sizeRes, varRes] = await Promise.all([
        p.brand_id ? supabase.from("brands").select("name_en").eq("id", p.brand_id).single() : null,
        p.category_id ? supabase.from("categories").select("name").eq("id", p.category_id).single() : null,
        p.subcategory_id ? supabase.from("subcategories").select("name").eq("id", p.subcategory_id).single() : null,
        p.sub_subcategory_id ? supabase.from("sub_subcategories").select("name").eq("id", p.sub_subcategory_id).single() : null,
        supabase.from("attributes").select("id, name").eq("type", "color"),
        supabase.from("attributes").select("id, name").eq("type", "size"),
        supabase.from("product_variations").select("*").eq("product_id", productId)
      ]);

      // 3. Construct the display object
      setProduct({
        ...p,
        brand_name: brandRes?.data?.name_en || "Independent",
        category_path: [
          catRes?.data?.name,
          subRes?.data?.name,
          subSubRes?.data?.name
        ].filter(Boolean).join(" / ") || "General",
        // MAP THE JOINED DATA HERE:
        display_images: p.product_images?.map((img: any) => img.image_url) || []
      });

      // Inside fetchData, update the mappedVars part:
      const mappedVars = varRes?.data?.map(v => ({
        ...v,
        color_name: colorRes?.data?.find((c: any) => c.id === v.color_id)?.name || "N/A",
        size_name: sizeRes?.data?.find((s: any) => s.id === v.size_id)?.name || "N/A",
        // Ensure numeric conversion if needed, though * handles it
        price: v.price,
        sale_price: v.sale_price
      })) || [];
      setVariations(mappedVars);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-slate-100 border-t-black"></div>
    </div>
  );

  if (!product) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="bg-slate-50 p-6 rounded-full text-slate-400">
        <Package size={40} />
      </div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Product record not found</p>
      <button onClick={() => router.back()} className="px-8 py-3 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest">
        Return to Registry
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 text-black">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center border-b pb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-black font-black text-[10px] tracking-widest transition-all">
            <ArrowLeft size={16} /> BACK TO COLLECTION
          </button>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
              Status: <span className="text-green-600 ml-1">Live</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Left: Premium Swiper Display */}
          <div className="lg:col-span-5">
            <div className="sticky top-12">
              <div className="relative group">
                {product.display_images.length > 0 ? (
                  <Swiper
                    modules={[Navigation, Pagination, Autoplay]}
                    navigation
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 4000 }}
                    className="rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50"
                  >
                    {product.display_images.map((url: string, i: number) => (
                      <SwiperSlide key={i}>
                        <img src={url} alt="Product display" className="w-full aspect-[4/5] object-cover" />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <div className="w-full aspect-[4/5] bg-slate-50 flex flex-col items-center justify-center rounded-[2.5rem] text-slate-300 border-2 border-dashed border-slate-100">
                    <Package size={64} strokeWidth={1} />
                    <span className="text-[10px] font-black uppercase mt-4 tracking-widest text-slate-400">No Assets Provided</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Modern Product Details */}
          <div className="lg:col-span-7 space-y-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                    {product.brand_name}
                  </span>
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                    {product.category_path}
                  </span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 leading-[1.1] uppercase tracking-tighter">{product.name}</h1>
                <div className="flex items-center gap-4 text-slate-400">
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase">ID: {productId}</p>
                  <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono">SKU: {product.sku}</p>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Project Narrative</h3>
                <p className="text-slate-600 text-base leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl">
                  {product.description || "No description provided for this collection item."}
                </p>
              </div>

              {/* Variations Table - Advanced Level */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Stock & Variants</h3>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-5">Color Option</th>
                        <th className="px-8 py-5">Size Spec</th>
                        <th className="px-8 py-5 text-center">In Stock</th>
                        <th className="px-8 py-5 text-right">Market Price</th>
                        <th className="px-8 py-5 text-right">Sale Price</th> {/* New Column */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-bold text-slate-800">
                      {variations.length > 0 ? variations.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5 text-xs uppercase">{v.color_name}</td>
                          <td className="px-8 py-5 text-xs uppercase">{v.size_name}</td>

                          <td className="px-8 py-5 text-center">
                            <span className={`text-[10px] px-2 py-1 rounded font-black tracking-widest ${v.stock > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                              {v.stock} UNITS
                            </span>
                          </td>

                          {/* Market Price Column */}
                          <td className="px-8 py-5 text-right">
                            <span className="text-sm text-black font-black">
                              ₹{v.price}
                            </span>
                          </td>

                          {/* Sale Price Column */}
                          <td className="px-8 py-5 text-right">
                            {v.sale_price && v.sale_price < v.price ? (
                              <span className="text-emerald-600 font-black text-sm group-hover:scale-110 transition-transform inline-block">
                                ₹{v.sale_price}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-black text-[10px] uppercase tracking-tighter">
                                No Discount
                              </span>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-10 text-center text-slate-300 text-[10px] uppercase font-black tracking-widest">
                            No Variations Registry Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CTA Section */}
              <div className="pt-8">
                <button
                  onClick={() => router.push(`/products/listproducts/edit/${product.id}`)}
                  className="w-full bg-black text-white py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                >
                  Edit Product Listing <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-black">
        {icon} <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
      </div>
      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{value || "—"}</p>
    </div>
  );
}
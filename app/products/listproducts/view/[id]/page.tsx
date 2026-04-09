"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft, Package, ArrowRight,
  ShieldCheck, Info, Tag, Layers
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

      const [brandRes, catRes, subRes, subSubRes, colorRes, sizeRes, varRes] = await Promise.all([
        p.brand_id ? supabase.from("brands").select("name_en").eq("id", p.brand_id).single() : null,
        p.category_id ? supabase.from("categories").select("name").eq("id", p.category_id).single() : null,
        p.subcategory_id ? supabase.from("subcategories").select("name").eq("id", p.subcategory_id).single() : null,
        p.sub_subcategory_id ? supabase.from("sub_subcategories").select("name").eq("id", p.sub_subcategory_id).single() : null,
        supabase.from("attributes").select("id, name").eq("type", "color"),
        supabase.from("attributes").select("id, name").eq("type", "size"),
        supabase.from("product_variations").select("*").eq("product_id", productId)
      ]);

      setProduct({
        ...p,
        brand_name: brandRes?.data?.name_en || "Independent",
        category_path: [
          catRes?.data?.name,
          subRes?.data?.name,
          subSubRes?.data?.name
        ].filter(Boolean).join(" / ") || "General",
        display_images: p.product_images?.map((img: any) => img.image_url) || []
      });

      const mappedVars = varRes?.data?.map(v => ({
        ...v,
        color_name: colorRes?.data?.find((c: any) => c.id === v.color_id)?.name || "N/A",
        size_name: sizeRes?.data?.find((s: any) => s.id === v.size_id)?.name || "N/A",
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBFBFC]">
      <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#c4a174]/20 border-t-[#2b2652]"></div>
    </div>
  );

  if (!product) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 bg-[#FBFBFC]">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl text-[#c4a174]">
        <Package size={48} />
      </div>
      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Registry entry missing</p>
      <button onClick={() => router.back()} className="px-10 py-4 bg-[#2b2652] text-[#c4a174] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-[#2b2652]/20 transition-all active:scale-95">
        Return to Fleet
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-6 md:p-12 text-[#2b2652] selection:bg-[#c4a174] selection:text-white">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-10">
          <button onClick={() => router.back()} className="flex items-center gap-3 text-slate-400 hover:text-[#c4a174] font-black text-[10px] tracking-[0.3em] uppercase transition-all group">
            <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> Back to Registry
          </button>
          <div className="flex items-center gap-4">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border ${product.active ? 'bg-[#c4a174]/10 border-[#c4a174]/20 text-[#c4a174]' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
              Status: <span className="ml-1 uppercase">{product.active ? 'Public / Live' : 'Archived'}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">

          {/* Left: Premium Swiper Display */}
          {/* Left: Premium Swiper Display */}
          <div className="lg:col-span-5">
            <div className="sticky top-12">
              <div className="relative group">
                <div className="absolute -inset-4 bg-[#c4a174]/5 rounded-[3.5rem] -z-10 blur-2xl"></div>
                {product.display_images.length > 0 ? (
                  <Swiper
                    modules={[Navigation, Pagination, Autoplay]}
                    navigation
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                    className="rounded-[3rem] overflow-hidden border border-white shadow-2xl shadow-[#2b2652]/10 product-swiper"
                  >
                    {product.display_images.map((url: string, i: number) => {
                      // Logic to detect if the URL is a video
                      const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);

                      return (
                        <SwiperSlide key={i}>
                          <div className="w-full aspect-[4/5] bg-black">
                            {isVideo ? (
                              <video
                                src={url}
                                className="w-full h-full object-cover"
                                controls
                                autoPlay
                                muted
                                loop
                                playsInline
                              />
                            ) : (
                              <img
                                src={url}
                                alt={`Product display ${i}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </SwiperSlide>
                      );
                    })}
                  </Swiper>
                ) : (
                  <div className="w-full aspect-[4/5] bg-white flex flex-col items-center justify-center rounded-[3rem] text-slate-200 border border-slate-50 shadow-inner">
                    <Package size={80} strokeWidth={1} />
                    <span className="text-[10px] font-black uppercase mt-6 tracking-[0.4em] text-slate-300">No Visual Assets</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Modern Product Details */}
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <span className="px-5 py-2 bg-[#2b2652] text-[#c4a174] text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-[#2b2652]/10">
                    {product.brand_name}
                  </span>
                  <span className="px-5 py-2 bg-white text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border border-slate-100">
                    {product.category_path}
                  </span>
                </div>

                <h1 className="text-6xl font-black text-[#2b2652] leading-[0.9] uppercase tracking-tighter">
                  {product.name}
                </h1>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#c4a174]"></div>
                    <p className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Ref: {productId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    <p className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 font-mono">SKU: {product.sku}</p>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#c4a174]">Manifest & Narrative</h3>
                <div className="relative">
                  <div className="absolute left-0 top-0 w-[2px] h-full bg-[#c4a174]/20"></div>
                  <p className="text-slate-500 text-lg leading-relaxed font-medium pl-8 py-2 italic">
                    {product.description || "No descriptive manifest provided for this asset."}
                  </p>
                </div>
              </div>

              {/* Variations Table */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#c4a174]">Configuration Matrix</h3>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{variations.length} SKUs Identified</span>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-slate-50 overflow-hidden shadow-2xl shadow-[#2b2652]/5">
                  <table className="w-full text-left">
                    <thead className="bg-[#2b2652] text-[9px] font-black text-[#c4a174]/70 uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-10 py-6">Visual Variant</th>
                        <th className="px-10 py-6">Size Spec</th>
                        <th className="px-10 py-6 text-center">Allocation</th>
                        <th className="px-10 py-6 text-right">Mkt Price</th>
                        <th className="px-10 py-6 text-right">Sale Val</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-black text-[#2b2652] text-[11px] uppercase tracking-widest">
                      {variations.length > 0 ? variations.map((v) => (
                        <tr key={v.id} className="hover:bg-[#c4a174]/5 transition-colors group">
                          <td className="px-10 py-6">{v.color_name}</td>
                          <td className="px-10 py-6 text-[#c4a174]">{v.size_name}</td>

                          <td className="px-10 py-6 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black ${v.stock > 0 ? 'text-[#c4a174] bg-[#c4a174]/10' : 'text-red-400 bg-red-50'}`}>
                              {v.stock} UNITS
                            </span>
                          </td>

                          <td className="px-10 py-6 text-right text-slate-400 line-through decoration-[#c4a174]/30">
                            ₹{v.price}
                          </td>

                          <td className="px-10 py-6 text-right">
                            {v.sale_price && v.sale_price < v.price ? (
                              <span className="text-[#2b2652] bg-[#c4a174]/10 px-3 py-1.5 rounded-xl border border-[#c4a174]/20 group-hover:scale-110 transition-transform inline-block">
                                ₹{v.sale_price}
                              </span>
                            ) : (
                              <span className="text-slate-200">Standard</span>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-10 py-16 text-center text-slate-300 text-[10px] uppercase font-black tracking-[0.5em]">
                            No Configuration Registry Found
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
                  className="w-full bg-[#2b2652] text-[#c4a174] py-7 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-[#1a1733] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-[#2b2652]/20 active:scale-[0.98]"
                >
                  Modify Product Architecture <ArrowRight size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles for Swiper pagination colors to match the brand */}
      <style jsx global>{`
        .product-swiper .swiper-pagination-bullet-active {
          background: #c4a174 !important;
        }
        .product-swiper .swiper-button-next, 
        .product-swiper .swiper-button-prev {
          color: #2b2652 !important;
          background: rgba(255,255,255,0.8);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          backdrop-filter: blur(4px);
        }
        .product-swiper .swiper-button-next:after, 
        .product-swiper .swiper-button-prev:after {
          font-size: 14px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
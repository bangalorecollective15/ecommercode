"use client";

import { useState, useEffect, useRef, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus, Save, Sparkles, Layers, Image as ImageIcon, X, Loader2, Hash, ArrowLeft, Lock
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditLifestyleProduct({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Metadata Lists
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [dbSizes, setDbSizes] = useState<any[]>([]);
  const [dbColors, setDbColors] = useState<any[]>([]);
  const [lifestyleTags, setLifestyleTags] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    sub_subcategory_id: "",
    brand_id: "",
    lifestyle_tag_id: "",
    variations: [] as any[],
    existingImages: [] as any[], // Current images in Supabase
    newImageFiles: [] as File[], // Files to be uploaded
    newImagePreviews: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Global Metadata
      const [catRes, brandRes, attrRes] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("brands").select("id, name_en").eq('status', true),
        supabase.from("attributes").select("*")
      ]);

      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
      setDbColors(attrRes.data?.filter(a => a.type === "color") || []);
      setDbSizes(attrRes.data?.filter(a => a.type === "size") || []);
      setLifestyleTags(attrRes.data?.filter(a => a.type === "lifestyle_tag") || []);

      // 2. Fetch Specific Product Data
      const { data: p, error: pErr } = await supabase
        .from("products")
        .select(`*, product_images(*), product_variations(*)`)
        .eq("id", productId)
        .single();

      if (pErr) throw pErr;

      // 3. Fetch Category Chain Dependencies
      if (p.category_id) {
        const { data: sub } = await supabase.from("subcategories").select("*").eq("category_id", p.category_id);
        setSubcategories(sub || []);
      }
      if (p.subcategory_id) {
        const { data: subSub } = await supabase.from("sub_subcategories").select("*").eq("subcategory_id", p.subcategory_id);
        setSubSubcategories(subSub || []);
      }

      // Inside the fetchData function, update the setForm call:
      setForm({
        name: p.name || "",
        sku: p.sku || "",
        description: p.description || "",
        category_id: p.category_id?.toString() || "",
        subcategory_id: p.subcategory_id?.toString() || "",
        sub_subcategory_id: p.sub_subcategory_id?.toString() || "",
        brand_id: p.brand_id?.toString() || "",
        lifestyle_tag_id: p.lifestyle_tag_id?.toString() || "",
        variations: p.product_variations || [], // Ensure your DB column is named sale_price
        existingImages: p.product_images || [],
        newImageFiles: [],
        newImagePreviews: [],
      });

    } catch (err) {
      toast.error("Failed to load product details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setForm(f => ({ ...f, category_id: categoryId, subcategory_id: "", sub_subcategory_id: "" }));
    if (!categoryId) { setSubcategories([]); return; }
    const { data } = await supabase.from("subcategories").select("*").eq("category_id", categoryId);
    setSubcategories(data || []);
  };

  const handleSubcategoryChange = async (subId: string) => {
    setForm(f => ({ ...f, subcategory_id: subId, sub_subcategory_id: "" }));
    if (!subId) { setSubSubcategories([]); return; }
    const { data } = await supabase.from("sub_subcategories").select("*").eq("subcategory_id", subId);
    setSubSubcategories(data || []);
  };

  const handleUpdate = async () => {
    if (!form.name) return toast.error("Name is required");
    setSaving(true);

    try {
      // 1. Update Core Product
      const { error: pErr } = await supabase.from("products").update({
        name: form.name,
        description: form.description,
        brand_id: form.brand_id ? parseInt(form.brand_id) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        subcategory_id: form.subcategory_id ? parseInt(form.subcategory_id) : null,
        sub_subcategory_id: form.sub_subcategory_id ? parseInt(form.sub_subcategory_id) : null,
        lifestyle_tag_id: form.lifestyle_tag_id ? parseInt(form.lifestyle_tag_id) : null,
      }).eq("id", productId);

      if (pErr) throw pErr;

      // 2. Upload New Images
      for (const file of form.newImageFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from('product-images').upload(`products/${fileName}`, file);
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(`products/${fileName}`);
        await supabase.from("product_images").insert({ product_id: productId, image_url: publicUrl });
      }

      // 3. Sync Variations (Added sale_price here)
      await supabase.from("product_variations").delete().eq("product_id", productId);

      const varRows = form.variations.map(v => ({
        product_id: productId,
        color_id: v.color_id ? parseInt(v.color_id) : null,
        size_id: v.size_id ? parseInt(v.size_id) : null,
        price: parseFloat(v.price) || 0,
        stock: parseInt(v.stock) || 0,
        sale_price: v.sale_price ? parseFloat(v.sale_price) : null // THIS WAS MISSING
      }));

      const { error: varErr } = await supabase.from("product_variations").insert(varRows);
      if (varErr) throw varErr;

      toast.success("Product updated successfully!");

      // Refresh to clear newImageFiles and fetch fresh data
      router.refresh();
      fetchData();

    } catch (err: any) {
      toast.error(err.message);
      console.error("Update Error:", err);
    } finally {
      setSaving(false);
    }
  };

  const removeExistingImage = async (imgId: number) => {
    const { error } = await supabase.from("product_images").delete().eq("id", imgId);
    if (error) return toast.error("Failed to delete image");
    setForm(f => ({ ...f, existingImages: f.existingImages.filter(img => img.id !== imgId) }));
    toast.success("Image removed");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center gap-6">
      <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#c4a174]/20 border-t-[#2b2652]"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Retrieving Collection Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-6 md:p-12 text-[#2b2652] selection:bg-[#c4a174] selection:text-white">
      <Toaster position="bottom-center" />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="flex justify-between items-center mb-16 border-b border-slate-100 pb-10">
          <div>
            <button onClick={() => router.back()} className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase mb-3 hover:text-[#c4a174] transition-all group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Registry
            </button>
            <h1 className="text-4xl font-black uppercase tracking-tighter">
              Modify <span className="text-[#c4a174] italic">Listing</span>
            </h1>
          </div>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="bg-[#2b2652] text-[#c4a174] px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-[#1a1733] shadow-2xl shadow-[#2b2652]/20 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} strokeWidth={3} />} Commit Changes
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          <div className="lg:col-span-3 space-y-16">

            {/* Core Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-[#c4a174] tracking-[0.2em]">Product Designation</label>
                <input
                  className="w-full py-4 bg-transparent border-b-2 border-slate-100 outline-none focus:border-[#2b2652] font-black text-2xl uppercase tracking-tighter transition-all"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Global SKU (Primary Key)</label>
                <div className="flex items-center gap-3 py-4 border-b-2 border-slate-50 text-slate-300">
                  <Lock size={14} />
                  <input className="w-full bg-transparent font-mono text-sm outline-none cursor-not-allowed" value={form.sku} readOnly />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-[#c4a174] tracking-[0.2em]">Asset Narrative</label>
              <textarea
                className="w-full p-8 bg-white rounded-[2rem] min-h-[180px] outline-none border border-slate-50 shadow-inner focus:border-[#c4a174]/30 text-slate-600 text-base font-medium leading-relaxed transition-all"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Enter technical or marketing specifications..."
              />
            </div>

            {/* Variations Card */}
            <div className="bg-[#2b2652] rounded-[3.5rem] p-12 text-white shadow-[0_30px_60px_-15px_rgba(43,38,82,0.3)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#c4a174] opacity-[0.03] rounded-full -mr-32 -mt-32"></div>

              <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-[#c4a174]">
                    <Layers size={22} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-[0.2em]">Variant Configuration</h2>
                </div>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Stock Keeper Unit Control</span>
              </div>

              <div className="space-y-6">
                {form.variations.map((v, i) => (
                  <div key={i} className="grid grid-cols-12 gap-6 items-center bg-white/5 p-6 rounded-[1.5rem] border border-white/5 group hover:bg-white/[0.08] transition-all">

                    {/* COLOR */}
                    <div className="col-span-2 space-y-2">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Visual</p>
                      <select
                        className="w-full bg-transparent border-b border-white/10 py-2 text-[11px] font-black uppercase outline-none focus:border-[#c4a174] transition-colors cursor-pointer"
                        value={v.color_id || ""}
                        onChange={e => {
                          const newV = [...form.variations]; newV[i].color_id = e.target.value; setForm({ ...form, variations: newV });
                        }}
                      >
                        <option className="bg-[#2b2652]" value="">N/A</option>
                        {dbColors.map(c => <option className="bg-[#2b2652]" key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* SIZE */}
                    <div className="col-span-2 space-y-2">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Dimension</p>
                      <select
                        className="w-full bg-transparent border-b border-white/10 py-2 text-[11px] font-black uppercase outline-none focus:border-[#c4a174] transition-colors cursor-pointer"
                        value={v.size_id || ""}
                        onChange={e => {
                          const newV = [...form.variations]; newV[i].size_id = e.target.value; setForm({ ...form, variations: newV });
                        }}
                      >
                        <option className="bg-[#2b2652]" value="">N/A</option>
                        {dbSizes.map(s => <option className="bg-[#2b2652]" key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    {/* REGULAR PRICE */}
                    <div className="col-span-2 space-y-2">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Retail (₹)</p>
                      <input
                        className="w-full bg-transparent border-b border-white/10 py-2 text-[12px] font-black outline-none focus:border-[#c4a174]"
                        value={v.price}
                        placeholder="0.00"
                        onChange={e => {
                          const newV = [...form.variations]; newV[i].price = e.target.value; setForm({ ...form, variations: newV });
                        }}
                      />
                    </div>

                    {/* SALE PRICE */}
                    <div className="col-span-2 space-y-2">
                      <p className="text-[8px] font-black text-[#c4a174] uppercase tracking-widest">Sale Val (₹)</p>
                      <input
                        placeholder="PROMO"
                        className="w-full bg-transparent border-b border-[#c4a174]/20 py-2 text-[12px] font-black outline-none text-[#c4a174] focus:border-[#c4a174]"
                        value={v.sale_price || ""}
                        onChange={e => {
                          const newV = [...form.variations]; newV[i].sale_price = e.target.value; setForm({ ...form, variations: newV });
                        }}
                      />
                    </div>

                    {/* STOCK */}
                    <div className="col-span-2 space-y-2">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">In Inventory</p>
                      <input
                        className="w-full bg-transparent border-b border-white/10 py-2 text-[12px] font-black outline-none focus:border-[#c4a174]"
                        value={v.stock}
                        placeholder="0"
                        onChange={e => {
                          const newV = [...form.variations]; newV[i].stock = e.target.value; setForm({ ...form, variations: newV });
                        }}
                      />
                    </div>

                    {/* REMOVE BUTTON */}
                    <div className="col-span-2 flex justify-end items-center">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, variations: form.variations.filter((_, idx) => idx !== i) })}
                        className="w-10 h-10 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setForm({ ...form, variations: [...form.variations, { color_id: "", size_id: "", price: "0", sale_price: "", stock: "0" }] })}
                  className="w-full py-5 mt-6 border-2 border-dashed border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-[#c4a174] hover:border-[#c4a174]/40 hover:bg-[#c4a174]/5 transition-all"
                >
                  + Instantiate New Variant
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-12">
            <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-xl shadow-[#2b2652]/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-[#c4a174]">
                <Hash size={14} strokeWidth={3} /> Classifications
              </h3>

              <div className="space-y-6">
                {/* LIFESTYLE TAG */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#2b2652] uppercase tracking-widest block opacity-40">Atmosphere / Section</label>
                  <select
                    className="w-full p-4 bg-[#FBFBFC] border border-slate-100 rounded-xl text-[11px] font-black uppercase tracking-tight outline-none focus:border-[#c4a174] transition-all"
                    value={form.lifestyle_tag_id}
                    onChange={e => setForm({ ...form, lifestyle_tag_id: e.target.value })}
                  >
                    <option value="">Standard Deployment</option>
                    {lifestyleTags.map(tag => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                  </select>
                </div>

                {/* BRAND */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#2b2652] uppercase tracking-widest block opacity-40">Brand Entity</label>
                  <select className="w-full p-4 bg-[#FBFBFC] border border-slate-100 rounded-xl text-[11px] font-black uppercase outline-none focus:border-[#c4a174]" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                    <option value="">Independent</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name_en}</option>)}
                  </select>
                </div>

                {/* CATEGORY HIERARCHY */}
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#2b2652] uppercase tracking-widest block opacity-40">Tier 1 Category</label>
                    <select className="w-full p-4 bg-[#FBFBFC] border border-slate-100 rounded-xl text-[11px] font-black uppercase outline-none focus:border-[#c4a174]" value={form.category_id} onChange={e => handleCategoryChange(e.target.value)}>
                      <option value="">Root</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#2b2652] uppercase tracking-widest block opacity-40">Tier 2 Sub</label>
                    <select className="w-full p-4 bg-[#FBFBFC] border border-slate-100 rounded-xl text-[11px] font-black uppercase outline-none focus:border-[#c4a174]" value={form.subcategory_id} onChange={e => handleSubcategoryChange(e.target.value)}>
                      <option value="">N/A</option>
                      {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* GALLERY SECTION */}
            <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-xl shadow-[#2b2652]/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-[#c4a174]">
                <ImageIcon size={14} strokeWidth={3} /> Visual Gallery
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Existing Assets */}
                {form.existingImages.map((img) => {
                  const isVideo = img.image_url.match(/\.(mp4|webm|ogg|mov)$/i);
                  return (
                    <div key={img.id} className="relative aspect-square rounded-[1.2rem] overflow-hidden border border-slate-50 group bg-black">
                      {isVideo ? (
                        <video src={img.image_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={img.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      )}
                      <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-2 right-2 bg-white/90 backdrop-blur shadow-md text-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10">
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}

                {/* New Assets (Previews) */}
                {form.newImagePreviews.map((src, i) => {
                  // Check the file type from the actual file object
                  const isVideo = form.newImageFiles[i]?.type.startsWith('video/');
                  return (
                    <div key={i} className="relative aspect-square rounded-[1.2rem] overflow-hidden border-2 border-[#c4a174] border-dashed bg-black">
                      {isVideo ? (
                        <video src={src} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={src} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-[#2b2652]/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                        <span className="text-[8px] text-white font-black uppercase tracking-widest">New {isVideo ? 'Video' : 'Slot'}</span>
                      </div>
                      <button type="button" onClick={() => {
                        const nF = [...form.newImageFiles]; const nP = [...form.newImagePreviews];
                        nF.splice(i, 1); nP.splice(i, 1);
                        setForm({ ...form, newImageFiles: nF, newImagePreviews: nP });
                      }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg z-10">
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}

                {/* Add Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-slate-100 rounded-[1.2rem] flex flex-col items-center justify-center text-slate-300 hover:text-[#c4a174] hover:border-[#c4a174]/30 hover:bg-[#c4a174]/5 transition-all group"
                >
                  <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                  <span className="text-[8px] font-black mt-2 tracking-widest uppercase">Add Asset</span>
                </button>
              </div>

              {/* Updated Input to accept videos */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const previews = files.map(f => URL.createObjectURL(f));
                  setForm(f => ({ ...f, newImageFiles: [...f.newImageFiles, ...files], newImagePreviews: [...f.newImagePreviews, ...previews] }));
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
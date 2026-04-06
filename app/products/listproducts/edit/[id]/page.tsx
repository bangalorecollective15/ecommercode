"use client";

import { useState, useEffect, useRef, use } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus, Save, Sparkles, Layers, Image as ImageIcon, X, Loader2, Hash, ArrowLeft
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
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-slate-400" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Retrieving Collection Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 text-black">
      <Toaster position="bottom-center" />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="flex justify-between items-center mb-12 border-b pb-8">
          <div>
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase mb-2 hover:text-black transition-colors">
              <ArrowLeft size={14} /> Back to Inventory
            </button>
            <h1 className="text-3xl font-black uppercase tracking-tighter">EDIT <span className="text-slate-400">PRODUCT</span></h1>
          </div>
          <button onClick={handleUpdate} disabled={saving} className="bg-black text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} UPDATE LISTING
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3 space-y-12">

            {/* Core Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">Product Name</label>
                <input
                  className="w-full py-3 bg-transparent border-b border-slate-200 outline-none focus:border-black font-bold text-lg"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">SKU (Immutable)</label>
                <input className="w-full py-3 bg-transparent border-b border-slate-200 font-mono text-sm text-slate-400" value={form.sku} readOnly />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500">Description</label>
              <textarea
                className="w-full p-4 bg-slate-50 rounded-2xl min-h-[150px] outline-none border border-transparent focus:border-slate-200 text-sm font-medium"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Variations */}
            <div className="bg-black rounded-[2.5rem] p-10 text-white shadow-2xl">
              <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
                <Layers size={24} />
                <h2 className="text-lg font-black uppercase tracking-widest">STOCK VARIANTS</h2>
              </div>

              <div className="space-y-4">
  {form.variations.map((v, i) => (
    <div key={i} className="grid grid-cols-12 gap-4 items-center border-b border-white/10 pb-4 group">
      
      {/* 1. COLOR */}
      <div className="col-span-2 space-y-1">
        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Color</p>
        <select 
          className="w-full bg-transparent border-b border-white/10 py-1 text-[11px] font-bold outline-none focus:border-white transition-colors" 
          value={v.color_id || ""} 
          onChange={e => {
            const newV = [...form.variations]; newV[i].color_id = e.target.value; setForm({ ...form, variations: newV });
          }}
        >
          <option className="bg-black" value="">NONE</option>
          {dbColors.map(c => <option className="bg-black" key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* 2. SIZE */}
      <div className="col-span-2 space-y-1">
        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Size</p>
        <select 
          className="w-full bg-transparent border-b border-white/10 py-1 text-[11px] font-bold outline-none focus:border-white transition-colors" 
          value={v.size_id || ""} 
          onChange={e => {
            const newV = [...form.variations]; newV[i].size_id = e.target.value; setForm({ ...form, variations: newV });
          }}
        >
          <option className="bg-black" value="">NONE</option>
          {dbSizes.map(s => <option className="bg-black" key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* 3. REGULAR PRICE */}
      <div className="col-span-2 space-y-1">
        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Retail (₹)</p>
        <input
          className="w-full bg-transparent border-b border-white/10 py-1 text-[11px] font-bold outline-none focus:border-white"
          value={v.price}
          placeholder="0"
          onChange={e => {
    const newV = [...form.variations];
    newV[i].price = e.target.value; // Store as string while typing
    setForm({ ...form, variations: newV });
  }}
        />
      </div>

      {/* 4. SALE PRICE */}
      <div className="col-span-2 space-y-1">
        <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Sale (₹)</p>
        <input
          placeholder="Optional"
          className="w-full bg-transparent border-b border-white/10 py-1 text-[11px] font-bold outline-none text-emerald-400 focus:border-emerald-400"
          value={v.sale_price || ""}
         onChange={e => {
    const newV = [...form.variations];
    newV[i].sale_price = e.target.value; // Correctly maps to the state
    setForm({ ...form, variations: newV });
  }}
        />
      </div>

      {/* 5. STOCK */}
      <div className="col-span-2 space-y-1">
        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Stock</p>
        <input
          className="w-full bg-transparent border-b border-white/10 py-1 text-[11px] font-bold outline-none focus:border-white"
          value={v.stock}
          placeholder="0"
          onChange={e => {
            const newV = [...form.variations]; newV[i].stock = e.target.value; setForm({ ...form, variations: newV });
          }}
        />
      </div>

      {/* 6. REMOVE BUTTON */}
      <div className="col-span-2 flex justify-end items-end pb-1">
        <button 
          type="button" 
          onClick={() => setForm({ ...form, variations: form.variations.filter((_, idx) => idx !== i) })} 
          className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
        >
          <X size={14} />
        </button>
      </div>

    </div>
  ))}

  <button 
    type="button" 
    onClick={() => setForm({ ...form, variations: [...form.variations, { color_id: "", size_id: "", price: "0", sale_price: "", stock: "0" }] })} 
    className="w-full py-3 mt-4 border border-dashed border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
  >
    + Add New Variation
  </button>
</div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-10">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                <Hash size={14} /> CATEGORIZATION
              </h3>
              <div className="space-y-4">
                {/* --- LIFESTYLE TAG (NEW) --- */}
                <div>
                  <label className="text-[9px] font-bold text-orange-600 uppercase block mb-1 flex items-center gap-1">
                    <Sparkles size={10} /> Lifestyle Section
                  </label>
                  <select
                    className="w-full p-3 bg-white border border-orange-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.lifestyle_tag_id}
                    onChange={e => setForm({ ...form, lifestyle_tag_id: e.target.value })}
                  >
                    <option value="">No Lifestyle Tag (Standard)</option>
                    {/* Use the attributes you fetched with type 'lifestyle_tag' */}
                    {lifestyleTags.map(tag => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                  </select>
                  <p className="text-[8px] text-slate-400 mt-1 italic">Determines which "Atmosphere" section this appears in on the Home Page.</p>
                </div>

                {/* --- BRAND --- */}
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Brand</label>
                  <select className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name_en}</option>)}
                  </select>
                </div>

                {/* --- CATEGORY HIERARCHY --- */}
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                  <select className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={form.category_id} onChange={e => handleCategoryChange(e.target.value)}>
                    <option value="">None</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Sub Category</label>
                  <select className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={form.subcategory_id} onChange={e => handleSubcategoryChange(e.target.value)}>
                    <option value="">None</option>
                    {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Deep Sub</label>
                  <select className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={form.sub_subcategory_id} onChange={e => setForm({ ...form, sub_subcategory_id: e.target.value })}>
                    <option value="">None</option>
                    {subSubcategories.map(ss => <option key={ss.id} value={ss.id}>{ss.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-b pb-2"><ImageIcon size={14} /> ASSET GALLERY</h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Existing Images */}
                {form.existingImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border group">
                    <img src={img.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-1 right-1 bg-black text-white p-1 rounded-full"><X size={10} /></button>
                  </div>
                ))}
                {/* New Upload Previews */}
                {form.newImagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-900 border-dashed">
                    <img src={src} className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 bg-black text-[6px] text-white px-1 font-bold">NEW</div>
                    <button type="button" onClick={() => {
                      const nF = [...form.newImageFiles]; const nP = [...form.newImagePreviews];
                      nF.splice(i, 1); nP.splice(i, 1);
                      setForm({ ...form, newImageFiles: nF, newImagePreviews: nP });
                    }} className="absolute top-1 right-1 bg-black text-white p-1 rounded-full"><X size={10} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-black hover:border-black transition-colors">
                  <Plus size={20} />
                  <span className="text-[8px] font-black mt-1">UPLOAD</span>
                </button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const previews = files.map(f => URL.createObjectURL(f));
                setForm(f => ({ ...f, newImageFiles: [...f.newImageFiles, ...files], newImagePreviews: [...f.newImagePreviews, ...previews] }));
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
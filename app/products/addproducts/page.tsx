"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { Plus, Save, Layers, Image as ImageIcon, X, Loader2, Hash } from "lucide-react";

// Initialize outside component to prevent "Multiple GoTrueClient instances" warning
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Replace your INITIAL_FORM_STATE with this:
const INITIAL_FORM_STATE = {
  name: "",
  sku: "",
  description: "",
  category_id: "",
  subcategory_id: "",
  sub_subcategory_id: "",
  brand_id: "",
  lifestyle_tag_id: "",
  // Added sale_price here
  variations: [{ color_id: "", size_id: "", price: "", sale_price: "", stock: "" }], 
  images: [] as File[],
  imagePreviews: [] as string[],
};

export default function AddLifestyleProduct() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [dbSizes, setDbSizes] = useState<any[]>([]);
  const [dbColors, setDbColors] = useState<any[]>([]);
  const [lifestyleTags, setLifestyleTags] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(INITIAL_FORM_STATE);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      const { data: catData } = await supabase.from("categories").select("*");
      const { data: brandData } = await supabase.from("brands").select("id, name_en").eq('status', true);
      const { data: attrData } = await supabase.from("attributes").select("*");
      setCategories(catData || []);
      setBrands(brandData || []);
      setDbColors(attrData?.filter((a) => a.type === "color") || []);
      setDbSizes(attrData?.filter((a) => a.type === "size") || []);
      setLifestyleTags(attrData?.filter((a) => a.type === "lifestyle_tag") || []);
    } catch (err) { toast.error("Error loading initial data"); }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setForm({ ...form, category_id: categoryId, subcategory_id: "", sub_subcategory_id: "" });
    setSubSubcategories([]);
    if (!categoryId) { setSubcategories([]); return; }
    const { data } = await supabase.from("subcategories").select("*").eq("category_id", categoryId);
    setSubcategories(data || []);
  };

  const handleSubcategoryChange = async (subcategoryId: string) => {
    setForm({ ...form, subcategory_id: subcategoryId, sub_subcategory_id: "" });
    if (!subcategoryId) { setSubSubcategories([]); return; }
    const { data } = await supabase.from("sub_subcategories").select("*").eq("subcategory_id", subcategoryId);
    setSubSubcategories(data || []);
  };

  const handleVariationChange = (index: number, field: string, value: string) => {
    const newVariations = [...form.variations];
    (newVariations[index] as any)[field] = value;
    setForm({ ...form, variations: newVariations });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesArray = Array.from(e.target.files || []);
    const previews = filesArray.map((file) => URL.createObjectURL(file));
    setForm({ ...form, images: [...form.images, ...filesArray], imagePreviews: [...form.imagePreviews, ...previews] });
  };

  const generateSKU = () => {
    const sku = "BC-" + Math.random().toString(36).substr(2, 7).toUpperCase();
    setForm({ ...form, sku });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku) return toast.error("Name and SKU are required");
    setLoading(true);

    try {
      // 1. Upload Images to Storage
      const uploadedUrls = [];
      for (const file of form.images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(`products/${fileName}`, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(`products/${fileName}`);
        uploadedUrls.push(publicUrl);
      }

      // 2. Insert Main Product
      const { data: productData, error: pError } = await supabase.from("products").insert([{
        name: form.name,
        sku: form.sku,
        description: form.description,
        brand_id: form.brand_id ? parseInt(form.brand_id) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        subcategory_id: form.subcategory_id ? parseInt(form.subcategory_id) : null,
        sub_subcategory_id: form.sub_subcategory_id ? parseInt(form.sub_subcategory_id) : null,
        lifestyle_tag_id: form.lifestyle_tag_id ? parseInt(form.lifestyle_tag_id) : null,
      }]).select().single();

      if (pError) {
        // Handle unique constraint violation (SKU taken)
        if (pError.code === '23505') throw new Error("This SKU is already in use. Please generate a new one.");
        throw pError;
      }

      // 3. Insert Product Images (Linking table)
      if (uploadedUrls.length > 0) {
        const { error: imgError } = await supabase.from("product_images").insert(
          uploadedUrls.map(url => ({ product_id: productData.id, image_url: url }))
        );
        if (imgError) throw imgError;
      }

      // 4. Insert Variations
    // Find "4. Insert Variations" inside handleSubmit and replace the payload:
const variationPayload = form.variations.map(v => ({
  product_id: productData.id,
  color_id: v.color_id ? parseInt(v.color_id) : null,
  size_id: v.size_id ? parseInt(v.size_id) : null,
  price: parseFloat(v.price) || 0,
  sale_price: v.sale_price ? parseFloat(v.sale_price) : null, // Added this line
  stock: parseInt(v.stock) || 0
}));

      const { error: vError } = await supabase.from("product_variations").insert(variationPayload);
      if (vError) throw vError;

      toast.success("Product saved successfully!");
setForm(prev => ({ ...prev, variations: [] }));
      // Cleanup and Reset
      form.imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setForm(INITIAL_FORM_STATE);
      setSubcategories([]);
      setSubSubcategories([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 text-black">
      <Toaster position="bottom-center" />
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b pb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">NEW <span className="text-slate-400">COLLECTION</span> ITEM</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inventory Management System</p>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="bg-black text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18}/> SAVE LISTING</>}
          </button>
        </header>
      
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3 space-y-12">
            {/* Name & SKU Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">Product Name</label>
                <input 
                  className="w-full px-0 py-3 bg-transparent border-b border-slate-200 outline-none focus:border-black font-bold text-lg" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  placeholder="Enter Item Name..." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">SKU</label>
                <div className="flex gap-4 items-center">
                  <input 
                    className="flex-1 py-3 bg-transparent border-b border-slate-200 font-mono text-sm text-slate-400" 
                    value={form.sku} 
                    readOnly 
                  />
                  <button type="button" onClick={generateSKU} className="text-[9px] font-black uppercase border border-black px-3 py-1 rounded">Generate</button>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500">Description</label>
              <textarea 
                className="w-full p-4 bg-slate-50 rounded-2xl min-h-[150px] outline-none border border-transparent focus:border-slate-200 text-sm font-medium" 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                placeholder="Product details, material, and care..."
              />
            </div>

            {/* Variations Registry */}
            <div className="bg-black rounded-[2.5rem] p-10 text-white shadow-2xl">
              <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
                <Layers size={24} />
                <h2 className="text-lg font-black uppercase tracking-widest">SIZE & INVENTORY REGISTRY</h2>
              </div>

            <div className="space-y-4">
  {form.variations.map((v, i) => (
    <div key={i} className="grid grid-cols-12 gap-4 items-center border-b border-white/10 pb-4 group">
      
      {/* 1. COLOR (Span 2) */}
      <div className="col-span-2 space-y-1">
        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Color</p>
        <select 
          className="w-full bg-transparent border-b border-white/10 py-1 text-[11px] font-bold outline-none focus:border-white transition-colors" 
          value={v.color_id} 
          onChange={e => handleVariationChange(i, "color_id", e.target.value)}
        >
          <option className="bg-black" value="">SELECT</option>
          {dbColors.map(c => <option className="bg-black" key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* 2. SIZE (Span 2) */}
      <div className="col-span-2 space-y-1">
        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Size</p>
        <select 
          className="w-full bg-transparent border-b border-white/10 py-1 text-[11px] font-bold outline-none focus:border-white transition-colors" 
          value={v.size_id} 
          onChange={e => handleVariationChange(i, "size_id", e.target.value)}
        >
          <option className="bg-black" value="">SELECT</option>
          {dbSizes.map(s => <option className="bg-black" key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* 3. REGULAR PRICE (Span 2) */}
      <div className="col-span-2 space-y-1">
        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Retail (₹)</p>
        <input
          className="w-full bg-transparent border-b border-white/10 py-1 text-[11px] font-bold outline-none focus:border-white transition-colors"
          value={v.price}
          placeholder="0.00"
          onChange={e => handleVariationChange(i, "price", e.target.value)}
        />
      </div>

      {/* 4. SALE PRICE (Span 2) */}
      <div className="col-span-2 space-y-1">
        <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Sale (₹)</p>
        <input
          placeholder="0.00"
          className="w-full bg-transparent border-b border-white/10 py-1 text-[11px] font-bold outline-none text-emerald-400 focus:border-emerald-400 transition-colors"
          value={v.sale_price}
          onChange={e => handleVariationChange(i, "sale_price", e.target.value)}
        />
      </div>

      {/* 5. STOCK (Span 1) */}
      <div className="col-span-1 space-y-1">
        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Qty</p>
        <input
          className="w-full bg-transparent border-b border-white/10 py-1 text-[11px] font-bold outline-none focus:border-white transition-colors text-center"
          value={v.stock}
          placeholder="0"
          onChange={e => handleVariationChange(i, "stock", e.target.value)}
        />
      </div>

      {/* 6. REMOVE BUTTON (Remaining Space) */}
      <div className="col-span-3 flex justify-end items-center pt-3">
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

  {/* Updated Add Button to match the single-line theme */}
  <button 
    type="button" 
    onClick={() => setForm({ ...form, variations: [...form.variations, { color_id: "", size_id: "", price: "", sale_price: "", stock: "" }] })} 
    className="w-full py-3 mt-4 border border-dashed border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
  >
    + Add New Variation
  </button>
</div>
            </div>
          </div>
          <div className="space-y-10">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-b pb-2"><Hash size={14}/> METADATA</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Brand Name</label>
                  <select className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black appearance-none" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                    <option value="" className="text-slate-400">Select Brand</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id} className="text-black">{b.name_en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Lifestyle Tag</label>
                  <select className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={form.lifestyle_tag_id} onChange={e => setForm({ ...form, lifestyle_tag_id: e.target.value })}>
                    <option value="">No Tag</option>
                    {lifestyleTags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Main Category</label>
                  <select className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={form.category_id} onChange={e => handleCategoryChange(e.target.value)}>
                    <option value="">Optional</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Sub Category</label>
                  <select className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={form.subcategory_id} onChange={e => handleSubcategoryChange(e.target.value)}>
                    <option value="">Optional</option>
                    {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Deep Sub Category</label>
                  <select className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={form.sub_subcategory_id} onChange={e => setForm({ ...form, sub_subcategory_id: e.target.value })}>
                    <option value="">Optional</option>
                    {subSubcategories.map(ss => <option key={ss.id} value={ss.id}>{ss.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-b pb-2"><ImageIcon size={14}/> ASSETS</h3>
              <div className="grid grid-cols-2 gap-2">
                {form.imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-slate-50">
                    <img src={src} className="w-full h-full object-cover" alt="preview" />
                    <button type="button" onClick={() => {
                      const nI = [...form.images]; const nP = [...form.imagePreviews];
                      nI.splice(i, 1); nP.splice(i, 1);
                      setForm({ ...form, images: nI, imagePreviews: nP });
                    }} className="absolute top-1 right-1 bg-black text-white p-1 rounded-full"><X size={10} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-black hover:border-black transition-colors">
                  <Plus size={20} />
                  <span className="text-[8px] font-black mt-1">ADD PHOTO</span>
                </button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleImageChange} accept="image/*" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
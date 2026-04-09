"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { Plus, Save, Layers,ChevronDown, Image as ImageIcon, X, Loader2, Hash } from "lucide-react";

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
// This will correctly name it .mp4, .mov, .jpg, etc.
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
    <div className="min-h-screen bg-[#FBFBFC] p-6 md:p-12 text-[#2b2652] font-sans selection:bg-[#c4a174] selection:text-white">
      <Toaster position="bottom-center" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-slate-100 pb-10 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-[1.5px] bg-[#c4a174]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Inventory Management System</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-[#2b2652]">
              NEW <span className="text-[#c4a174] italic">COLLECTION</span> ITEM
            </h1>
          </div>
          
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="group relative bg-[#2b2652] text-[#c4a174] px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#2b2652]/20 hover:bg-[#1a1733] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <Save size={16} className="group-hover:scale-110 transition-transform" /> 
                SAVE LISTING
              </>
            )}
          </button>
        </header>
      
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-14">
            
            {/* Name & SKU Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Name</label>
                <input 
                  className="w-full px-0 py-3 bg-transparent border-b-2 border-slate-100 outline-none focus:border-[#c4a174] font-bold text-xl placeholder:text-slate-200 transition-colors uppercase tracking-tight" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  placeholder="Enter Item Name..." 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">SKU</label>
                <div className="flex gap-4 items-center">
                  <input 
                    className="flex-1 py-3 bg-transparent border-b-2 border-slate-100 font-mono text-sm text-[#c4a174] outline-none" 
                    value={form.sku} 
                    readOnly 
                  />
                  <button 
                    type="button" 
                    onClick={generateSKU} 
                    className="text-[9px] font-black uppercase border-2 border-[#2b2652] px-4 py-1.5 rounded-lg hover:bg-[#2b2652] hover:text-[#c4a174] transition-all"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
              <textarea 
                className="w-full p-6 bg-white rounded-[2rem] min-h-[180px] outline-none border-2 border-slate-50 focus:border-[#c4a174]/20 shadow-sm text-sm font-medium text-slate-600 leading-relaxed" 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                placeholder="Describe material, craftsmanship, and care details..."
              />
            </div>

            {/* Variations Registry Card */}
            <div className="bg-[#2b2652] rounded-[3rem] p-10 text-white shadow-2xl shadow-[#2b2652]/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#c4a174]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
                <div className="p-2 bg-[#c4a174]/10 rounded-xl">
                    <Layers size={20} className="text-[#c4a174]" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-[0.3em]">Size & Inventory Registry</h2>
              </div>

              <div className="space-y-6">
                {form.variations.map((v, i) => (
                  <div key={i} className="grid grid-cols-12 gap-6 items-end border-b border-white/5 pb-6 group">
                    
                    <div className="col-span-2 space-y-2">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Color</p>
                      <select 
                        className="w-full bg-transparent border-b border-white/10 py-2 text-[11px] font-bold outline-none focus:border-[#c4a174] transition-colors appearance-none" 
                        value={v.color_id} 
                        onChange={e => handleVariationChange(i, "color_id", e.target.value)}
                      >
                        <option className="bg-[#2b2652]" value="">SELECT</option>
                        {dbColors.map(c => <option className="bg-[#2b2652]" key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                      </select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Size</p>
                      <select 
                        className="w-full bg-transparent border-b border-white/10 py-2 text-[11px] font-bold outline-none focus:border-[#c4a174] transition-colors appearance-none" 
                        value={v.size_id} 
                        onChange={e => handleVariationChange(i, "size_id", e.target.value)}
                      >
                        <option className="bg-[#2b2652]" value="">SELECT</option>
                        {dbSizes.map(s => <option className="bg-[#2b2652]" key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                      </select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Retail (₹)</p>
                      <input
                        className="w-full bg-transparent border-b border-white/10 py-2 text-[11px] font-bold outline-none focus:border-[#c4a174] transition-colors"
                        value={v.price}
                        placeholder="0.00"
                        onChange={e => handleVariationChange(i, "price", e.target.value)}
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <p className="text-[8px] font-black text-[#c4a174] uppercase tracking-widest ml-1 text-opacity-80">Sale (₹)</p>
                      <input
                        placeholder="0.00"
                        className="w-full bg-transparent border-b border-[#c4a174]/20 py-2 text-[11px] font-bold outline-none text-[#c4a174] focus:border-[#c4a174] transition-colors"
                        value={v.sale_price}
                        onChange={e => handleVariationChange(i, "sale_price", e.target.value)}
                      />
                    </div>

                    <div className="col-span-1 space-y-2">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Qty</p>
                      <input
                        className="w-full bg-transparent border-b border-white/10 py-2 text-[11px] font-bold outline-none focus:border-white transition-colors text-center"
                        value={v.stock}
                        placeholder="0"
                        onChange={e => handleVariationChange(i, "stock", e.target.value)}
                      />
                    </div>

                    <div className="col-span-3 flex justify-end pb-1">
                      <button 
                        type="button" 
                        onClick={() => setForm({ ...form, variations: form.variations.filter((_, idx) => idx !== i) })} 
                        className="p-3 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={() => setForm({ ...form, variations: [...form.variations, { color_id: "", size_id: "", price: "", sale_price: "", stock: "" }] })} 
                  className="w-full py-4 mt-6 border-2 border-dashed border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-[#c4a174] hover:bg-[#c4a174]/5 hover:border-[#c4a174]/30 transition-all active:scale-[0.99]"
                >
                  + Add New Variation
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-12">
            <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-slate-400 border-b border-slate-100 pb-4">
                <Hash size={14} className="text-[#c4a174]"/> METADATA
              </h3>
              
              <div className="space-y-6">
                {[
                  { label: "Brand Name", value: form.brand_id, key: "brand_id", options: brands, display: 'name_en' },
                  { label: "Lifestyle Tag", value: form.lifestyle_tag_id, key: "lifestyle_tag_id", options: lifestyleTags, display: 'name' },
                  { label: "Main Category", value: form.category_id, key: "category_id", options: categories, display: 'name', change: handleCategoryChange },
                  { label: "Sub Category", value: form.subcategory_id, key: "subcategory_id", options: subcategories, display: 'name', change: handleSubcategoryChange },
                  { label: "Deep Sub Category", value: form.sub_subcategory_id, key: "sub_subcategory_id", options: subSubcategories, display: 'name' }
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">{field.label}</label>
                    <div className="relative">
                      <select 
                        className="w-full p-4 bg-white border-2 border-slate-50 rounded-2xl text-[11px] font-bold text-[#2b2652] appearance-none focus:border-[#c4a174] outline-none transition-all shadow-sm" 
                        value={field.value} 
                        onChange={e => field.change ? field.change(e.target.value) : setForm({ ...form, [field.key]: e.target.value })}
                      >
                        <option value="">{field.label === "Brand Name" ? "SELECT BRAND" : "OPTIONAL"}</option>
                        {field.options.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt[field.display].toUpperCase()}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c4a174] pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

           <div className="space-y-8">
  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-slate-400 border-b border-slate-100 pb-4">
    <ImageIcon size={14} className="text-[#c4a174]"/> ASSETS
  </h3>
  
  <div className="grid grid-cols-2 gap-4">
    {form.imagePreviews.map((src, i) => {
      // Check if the file is a video based on the file object or URL
      const isVideo = form.images[i]?.type.startsWith('video');

      return (
        <div key={i} className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden border-2 border-white shadow-md group bg-black">
          {isVideo ? (
            <video 
              src={src} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              muted 
              loop 
              onMouseOver={(e) => e.currentTarget.play()}
              onMouseOut={(e) => e.currentTarget.pause()}
            />
          ) : (
            <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="preview" />
          )}
          
          <div className="absolute inset-0 bg-[#2b2652]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              type="button" 
              onClick={() => {
                const nI = [...form.images]; const nP = [...form.imagePreviews];
                nI.splice(i, 1); nP.splice(i, 1);
                setForm({ ...form, images: nI, imagePreviews: nP });
              }} 
              className="bg-white text-red-600 p-2 rounded-xl shadow-xl hover:scale-110 transition-transform"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      );
    })}
    
    <button 
      type="button" 
      onClick={() => fileInputRef.current?.click()} 
      className="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center text-slate-300 hover:text-[#c4a174] hover:border-[#c4a174] hover:bg-[#c4a174]/5 transition-all group"
    >
      <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      <span className="text-[8px] font-black mt-2 tracking-[0.2em]">ADD MEDIA</span>
    </button>
  </div>

  {/* IMPORTANT: Update accept to include video/* */}
  <input 
    type="file" 
    ref={fileInputRef} 
    className="hidden" 
    multiple 
    onChange={handleImageChange} 
    accept="image/*,video/*" 
  />
</div>
          </div>
        </div>
      </div>
    </div>
);
}
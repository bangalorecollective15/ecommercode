"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus, Trash2, Youtube, Package, Save, Layers, Info,
  ChevronRight, ShoppingCart, Image as ImageIcon, X,
  Beaker, ClipboardList, Truck, Tag
} from "lucide-react";
type Brand = {
  id: string;
  name: string;
};
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Interfaces ---
interface Category { id: number; name: string; }
interface Subcategory { id: number; name: string; category_id: number; }
interface SubSubcategory { id: number; name: string; subcategory_id: number; }
interface Brand { id: number; name: string; }

export default function AddProduct() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<SubSubcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tastes, setTastes] = useState<any[]>([]);
  const [unitTypes, setUnitTypes] = useState<any[]>([]);
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    sub_subcategory_id: "",
    brand_id: "",
    ingredients: "",
    taste_id: "",
    pack_of: "",
    max_shelf_life: "",
    has_variation: false,
    variations: [{ unit_type: "", unit_value: "", price: "", stock: "" }],
    shipping_type: "free",
    shipping_charge: 0,
    youtube_url: "",
    images: [] as File[],
    imagePreviews: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: catData } = await supabase.from("categories").select("*");
      setCategories(catData || []);

      const { data: brandData, error: brandError } = await supabase.from("brands").select("*");
      if (brandError) {
        console.error("Brand Fetch Error:", brandError); // This will tell you if it's RLS
        toast.error(brandError.message);
      } else {
        setBrands(brandData || []);
      }
      const { data: attrData } = await supabase.from("attributes").select("*");
      setTastes(attrData?.filter((a) => a.type === "taste") || []);
      setUnitTypes(attrData?.filter((a) => a.type === "unit_type") || []);
    } catch (err) {
      toast.error("Failed to fetch initial data");
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setForm({ ...form, category_id: categoryId, subcategory_id: "", sub_subcategory_id: "" });
    const { data } = await supabase.from("subcategories").select("*").eq("category_id", categoryId);
    setSubcategories(data || []);
    setSubSubcategories([]);
  };

  const handleSubcategoryChange = async (subcategoryId: string) => {
    setForm({ ...form, subcategory_id: subcategoryId, sub_subcategory_id: "" });
    // Fetch Sub-Subcategories based on selected Subcategory
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
    const sku = "SKU-" + Math.random().toString(36).substr(2, 8).toUpperCase();
    setForm({ ...form, sku });
  };

  const validateForm = () => {
    const errors: any = {};
    if (!form.name.trim()) errors.name = "Name required";
    if (!form.category_id) errors.category_id = "Category required";
    if (!form.brand_id) errors.brand_id = "Brand required";
    if (!form.ingredients.trim()) errors.ingredients = "Ingredients required";
    if (form.images.length === 0) errors.images = "Image required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadImages = async (productId: string) => {
    const uploadedUrls = [];
    for (const file of form.images) {
      const fileName = `${productId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(data.path);
      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      // 1. Insert Main Product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert([{
          name: form.name,
          sku: form.sku,
          description: form.description,
          category_id: form.category_id,
          subcategory_id: form.subcategory_id || null,
          sub_subcategory_id: form.sub_subcategory_id || null,
          brand_id: form.brand_id,
          ingredients: form.ingredients,
          taste_id: form.taste_id || null,
          pack_of: form.pack_of,
          max_shelf_life: form.max_shelf_life,
          has_variation: form.has_variation,
          shipping_type: form.shipping_type,
          shipping_charge: form.shipping_type === "free" ? 0 : Number(form.shipping_charge),
          youtube_url: form.youtube_url,
        }]).select().single();

      if (productError) throw productError;

      // 2. Handle Images (Upload to Storage AND Insert to product_images table)
      if (form.images.length > 0) {
        const imageUrls = await uploadImages(productData.id);

        const imageRows = imageUrls.map(url => ({
          product_id: productData.id,
          image_url: url
        }));

        const { error: imgError } = await supabase.from("product_images").insert(imageRows);
        if (imgError) throw imgError;
      }

      // 3. Handle Variations
      if (form.has_variation && form.variations.length > 0) {
        const variationsToInsert = form.variations.map((v) => ({
          product_id: productData.id,
          unit_type: v.unit_type,
          unit_value: v.unit_value,
          price: Number(v.price),
          stock: Number(v.stock)
        }));

        const { error: varError } = await supabase.from("product_variations").insert(variationsToInsert);
        if (varError) throw varError;
      }

      toast.success("Product Published Successfully!");
      // Optional: Reset form or redirect here
    } catch (err: any) {
      console.error("Full Error Object:", err);
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 text-slate-900">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Package className="text-orange-500" size={32} /> ADD NEW PRODUCT
          </h1>
          <button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 font-bold tracking-widest uppercase">
            {loading ? "Processing..." : <><Save size={20} /> Publish Listing</>}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-8">
            {/* General Info */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Info size={20} /></div>
                <h2 className="text-xl font-bold">General Details</h2>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Product Title</label>
                    <input className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl outline-none focus:border-orange-500 transition-all ${fieldErrors.name ? 'border-red-500' : 'border-slate-200'}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premium Basmati Rice" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">SKU Code</label>
                    <div className="flex gap-2">
                      <input className="flex-1 px-5 py-4 bg-slate-100 rounded-2xl font-mono text-sm border-none" value={form.sku} readOnly />
                      <button type="button" onClick={generateSKU} className="bg-slate-900 text-white px-5 rounded-2xl text-xs font-bold hover:bg-orange-500 transition-colors">GENERATE</button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Description</label>
                  <textarea className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[120px] outline-none focus:border-orange-500" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe your product in detail..." />
                </div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Beaker size={20} /></div>
                <h2 className="text-xl font-bold">Ingredients & Composition</h2>
              </div>
              <textarea
                className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl min-h-[100px] outline-none focus:border-blue-500 transition-all ${fieldErrors.ingredients ? 'border-red-500' : 'border-slate-200'}`}
                value={form.ingredients}
                onChange={e => setForm({ ...form, ingredients: e.target.value })}
                placeholder="List ingredients separated by commas..."
              />
            </div>

            {/* Variations Card */}
            <div className="bg-slate-900 rounded-[2rem] p-8 shadow-xl text-white">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-2 rounded-lg text-white"><Layers size={20} /></div>
                  <h2 className="text-xl font-bold">Pricing & Stock</h2>
                </div>
                <label className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl cursor-pointer">
                  <span className="text-xs font-bold uppercase tracking-widest">Multi-Variant</span>
                  <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={form.has_variation} onChange={e => setForm({ ...form, has_variation: e.target.checked })} />
                </label>
              </div>

              <div className="space-y-4">
                {form.variations.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 md:grid-cols-12 gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 items-end">
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Unit Type</label>
                      <select className="w-full bg-slate-800 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-orange-500" value={v.unit_type} onChange={e => handleVariationChange(i, "unit_type", e.target.value)}>
                        <option value="">Select</option>
                        {unitTypes.map(ut => <option key={ut.id} value={ut.name}>{ut.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Value</label>
                      <input className="w-full bg-slate-800 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-orange-500" placeholder="500" value={v.unit_value} onChange={e => handleVariationChange(i, "unit_value", e.target.value)} />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Price</label>
                      <input className="w-full bg-slate-800 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-orange-500" placeholder="₹" value={v.price} onChange={e => handleVariationChange(i, "price", e.target.value)} />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Stock</label>
                      <input className="w-full bg-slate-800 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-orange-500" placeholder="Qty" value={v.stock} onChange={e => handleVariationChange(i, "stock", e.target.value)} />
                    </div>
                    {form.has_variation && (
                      <button type="button" onClick={() => setForm({ ...form, variations: form.variations.filter((_, idx) => idx !== i) })} className="p-3 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
                {form.has_variation && (
                  <button type="button" onClick={() => setForm({ ...form, variations: [...form.variations, { unit_type: "", unit_value: "", price: "", stock: "" }] })} className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 font-bold text-sm hover:border-orange-500 hover:text-orange-500 transition-all">+ Add Another Variation</button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Classification Sidebar */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
              <h3 className="font-bold mb-6 flex items-center gap-2"><ClipboardList className="text-orange-500" size={20} /> Classification</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Brand</label>
                  <select className={`w-full p-4 bg-slate-50 rounded-2xl border-none text-sm ${fieldErrors.brand_id ? 'ring-2 ring-red-500' : ''}`} value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                    <option value="">Select Brand</option>
                    {/* Change b.name to b.name_en */}
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Category</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm" value={form.category_id} onChange={e => handleCategoryChange(e.target.value)}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Sub Category</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm" value={form.subcategory_id} onChange={e => handleSubcategoryChange(e.target.value)}>
                    <option value="">Select Sub</option>
                    {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Sub-Sub Category</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm" value={form.sub_subcategory_id} onChange={e => setForm({ ...form, sub_subcategory_id: e.target.value })}>
                    <option value="">Select Sub-Sub</option>
                    {subSubcategories.map(ss => <option key={ss.id} value={ss.id}>{ss.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Shipping Sidebar */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
              <h3 className="font-bold mb-6 flex items-center gap-2"><Truck className="text-orange-500" size={20} /> Shipping</h3>
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
                <button type="button" onClick={() => setForm({ ...form, shipping_type: 'free' })} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${form.shipping_type === 'free' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}>FREE</button>
                <button type="button" onClick={() => setForm({ ...form, shipping_type: 'paid' })} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${form.shipping_type === 'paid' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}>PAID</button>
              </div>
              {form.shipping_type === 'paid' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Delivery Charge</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm" placeholder="₹ Amount" value={form.shipping_charge} onChange={e => setForm({ ...form, shipping_charge: Number(e.target.value) })} />
                </div>
              )}
            </div>

            {/* Quick Specs */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
              <h3 className="font-bold mb-6 flex items-center gap-2"><ShoppingCart className="text-orange-500" size={20} /> Quick Specs</h3>
              <div className="space-y-4">
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm" value={form.taste_id} onChange={e => setForm({ ...form, taste_id: e.target.value })}>
                  <option value="">Taste Type</option>
                  {tastes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm" placeholder="Pack Size (e.g. 4)" value={form.pack_of} onChange={e => setForm({ ...form, pack_of: e.target.value })} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm" placeholder="Shelf Life" value={form.max_shelf_life} onChange={e => setForm({ ...form, max_shelf_life: e.target.value })} />
              </div>
            </div>

            {/* Media Upload */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
              <h3 className="font-bold mb-6 flex items-center gap-2"><ImageIcon className="text-orange-500" size={20} /> Product Media</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {form.imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={src} alt="preview" className="w-full h-full object-cover rounded-xl border" />
                    <button type="button" onClick={() => {
                      const newImgs = [...form.images];
                      const newPrevs = [...form.imagePreviews];
                      newImgs.splice(i, 1); newPrevs.splice(i, 1);
                      setForm({ ...form, images: newImgs, imagePreviews: newPrevs });
                    }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"><X size={12} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all"><Plus /></button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleImageChange} accept="image/*" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
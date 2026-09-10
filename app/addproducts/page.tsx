"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { Plus, Save, Layers, ChevronDown, Image as ImageIcon, X, Loader2, Hash, Package } from "lucide-react";

// Initialize outside component to prevent "Multiple GoTrueClient instances" warning
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type VariationRow = {
  id?: number; // present only for variations that already exist in the DB
  color_id: string;
  size_id: string;
  price: string;
  sale_price: string;
  stock: string;
  carry_bag_box: boolean;
};

type ExistingImage = { id: number; image_url: string };

const INITIAL_FORM_STATE = {
  name: "",
  sku: "",
  description: "",
  category_id: "",
  subcategory_id: "",
  sub_subcategory_id: "",
  brand_id: "",
  lifestyle_tag_id: "",
  active: true,
  variations: [{ color_id: "", size_id: "", price: "", sale_price: "", stock: "", carry_bag_box: false }] as VariationRow[],
  images: [] as File[],
  imagePreviews: [] as string[],
};

export default function AddLifestyleProduct() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [dbSizes, setDbSizes] = useState<any[]>([]);
  const [dbColors, setDbColors] = useState<any[]>([]);
  const [lifestyleTags, setLifestyleTags] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(INITIAL_FORM_STATE);

  // Existing images already saved in the DB (edit mode only)
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  // Variation IDs the product had when it was first loaded — used to figure out
  // which variations were removed by the user and need deleting on save.
  const [originalVariationIds, setOriginalVariationIds] = useState<number[]>([]);

  useEffect(() => { fetchInitialData(); }, []);

  // Load the product for editing once we know the id (and after categories exist)
  useEffect(() => {
    if (editId) loadProductForEdit(editId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

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

  const loadProductForEdit = async (id: string) => {
    setInitialLoading(true);
    try {
      const { data: product, error: pErr } = await supabase.from("products").select("*").eq("id", id).single();
      if (pErr) throw pErr;
      if (!product) throw new Error("Product not found");

      const [{ data: images, error: imgErr }, { data: variations, error: varErr }] = await Promise.all([
        supabase.from("product_images").select("id, image_url").eq("product_id", id),
        supabase.from("product_variations").select("*").eq("product_id", id),
      ]);
      if (imgErr) throw imgErr;
      if (varErr) throw varErr;

      // Pre-load the subcategory / sub-subcategory chain so the selects show correctly
      if (product.category_id) {
        const { data: subs } = await supabase.from("subcategories").select("*").eq("category_id", product.category_id);
        setSubcategories(subs || []);
      }
      if (product.subcategory_id) {
        const { data: subSubs } = await supabase.from("sub_subcategories").select("*").eq("subcategory_id", product.subcategory_id);
        setSubSubcategories(subSubs || []);
      }

      const loadedVariations: VariationRow[] = (variations && variations.length > 0)
        ? variations.map((v: any) => ({
            id: v.id,
            color_id: v.color_id ? String(v.color_id) : "",
            size_id: v.size_id ? String(v.size_id) : "",
            price: v.price != null ? String(v.price) : "",
            sale_price: v.sale_price != null ? String(v.sale_price) : "",
            stock: v.stock != null ? String(v.stock) : "",
            carry_bag_box: !!v.carry_bag_box,
          }))
        : [{ color_id: "", size_id: "", price: "", sale_price: "", stock: "", carry_bag_box: false }];

      setForm({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        category_id: product.category_id ? String(product.category_id) : "",
        subcategory_id: product.subcategory_id ? String(product.subcategory_id) : "",
        sub_subcategory_id: product.sub_subcategory_id ? String(product.sub_subcategory_id) : "",
        brand_id: product.brand_id ? String(product.brand_id) : "",
        lifestyle_tag_id: product.lifestyle_tag_id ? String(product.lifestyle_tag_id) : "",
        active: !!product.active,
        variations: loadedVariations,
        images: [],
        imagePreviews: [],
      });

      setExistingImages(images || []);
      setOriginalVariationIds((variations || []).map((v: any) => v.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to load product for editing");
      console.error("Load product error:", err);
    } finally {
      setInitialLoading(false);
    }
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

  // Handles text/select fields on a variation row
  const handleVariationChange = (index: number, field: string, value: string) => {
    const newVariations = [...form.variations];
    (newVariations[index] as any)[field] = value;
    setForm({ ...form, variations: newVariations });
  };

  // Handles the "Bag & Box" checkbox toggle on a variation row
  const handleVariationCheckbox = (index: number, field: string, checked: boolean) => {
    const newVariations = [...form.variations];
    (newVariations[index] as any)[field] = checked;
    setForm({ ...form, variations: newVariations });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesArray = Array.from(e.target.files || []);
    const previews = filesArray.map((file) => URL.createObjectURL(file));
    setForm({ ...form, images: [...form.images, ...filesArray], imagePreviews: [...form.imagePreviews, ...previews] });
  };

  // Permanently removes an already-saved image (storage + DB row) — edit mode only
  const handleRemoveExistingImage = async (img: ExistingImage) => {
    try {
      const path = img.image_url.split('/product-images/')[1];
      if (path) await supabase.storage.from('product-images').remove([path]);
      const { error } = await supabase.from("product_images").delete().eq("id", img.id);
      if (error) throw error;
      setExistingImages(prev => prev.filter(i => i.id !== img.id));
      toast.success("Image removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove image");
    }
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
      // 1. Upload any newly-added images to Storage
      const uploadedUrls: string[] = [];
      for (const file of form.images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(`products/${fileName}`, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(`products/${fileName}`);
        uploadedUrls.push(publicUrl);
      }

      let productId: number;

      if (isEditMode && editId) {
        // 2a. Update the existing product
        const { error: pError } = await supabase.from("products").update({
          name: form.name,
          sku: form.sku,
          description: form.description,
          brand_id: form.brand_id ? parseInt(form.brand_id) : null,
          category_id: form.category_id ? parseInt(form.category_id) : null,
          subcategory_id: form.subcategory_id ? parseInt(form.subcategory_id) : null,
          sub_subcategory_id: form.sub_subcategory_id ? parseInt(form.sub_subcategory_id) : null,
          lifestyle_tag_id: form.lifestyle_tag_id ? parseInt(form.lifestyle_tag_id) : null,
          active: form.active,
        }).eq("id", editId);

        if (pError) {
          if (pError.code === '23505') throw new Error("This SKU is already in use. Please choose another.");
          throw pError;
        }
        productId = parseInt(editId);
      } else {
        // 2b. Insert a brand new product
        const { data: productData, error: pError } = await supabase.from("products").insert([{
          name: form.name,
          sku: form.sku,
          description: form.description,
          brand_id: form.brand_id ? parseInt(form.brand_id) : null,
          category_id: form.category_id ? parseInt(form.category_id) : null,
          subcategory_id: form.subcategory_id ? parseInt(form.subcategory_id) : null,
          sub_subcategory_id: form.sub_subcategory_id ? parseInt(form.sub_subcategory_id) : null,
          lifestyle_tag_id: form.lifestyle_tag_id ? parseInt(form.lifestyle_tag_id) : null,
          active: form.active,
        }]).select().single();

        if (pError) {
          if (pError.code === '23505') throw new Error("This SKU is already in use. Please generate a new one.");
          throw pError;
        }
        productId = productData.id;
      }

      // 3. Insert any newly uploaded images (linking table)
      if (uploadedUrls.length > 0) {
        const { error: imgError } = await supabase.from("product_images").insert(
          uploadedUrls.map(url => ({ product_id: productId, image_url: url }))
        );
        if (imgError) throw imgError;
      }

      // 4. Variations — figure out what to delete / update / insert
      const currentIds = form.variations.filter(v => v.id).map(v => v.id as number);
      const idsToDelete = originalVariationIds.filter(id => !currentIds.includes(id));

      if (idsToDelete.length > 0) {
        const { error: delErr } = await supabase.from("product_variations").delete().in("id", idsToDelete);
        if (delErr) throw delErr;
      }

      const toUpdate = form.variations.filter(v => v.id);
      const toInsert = form.variations.filter(v => !v.id);

      for (const v of toUpdate) {
        const { error: updErr } = await supabase.from("product_variations").update({
          color_id: v.color_id ? parseInt(v.color_id) : null,
          size_id: v.size_id ? parseInt(v.size_id) : null,
          price: parseFloat(v.price) || 0,
          sale_price: v.sale_price ? parseFloat(v.sale_price) : null,
          stock: parseInt(v.stock) || 0,
          carry_bag_box: !!v.carry_bag_box,
        }).eq("id", v.id);
        if (updErr) throw updErr;
      }

      if (toInsert.length > 0) {
        const insertPayload = toInsert.map(v => ({
          product_id: productId,
          color_id: v.color_id ? parseInt(v.color_id) : null,
          size_id: v.size_id ? parseInt(v.size_id) : null,
          price: parseFloat(v.price) || 0,
          sale_price: v.sale_price ? parseFloat(v.sale_price) : null,
          stock: parseInt(v.stock) || 0,
          carry_bag_box: !!v.carry_bag_box,
        }));
        const { error: insErr } = await supabase.from("product_variations").insert(insertPayload);
        if (insErr) throw insErr;
      }

      toast.success(isEditMode ? "Product updated successfully!" : "Product saved successfully!");

      if (isEditMode) {
        // Send them back to the registry so they can see the change reflected
        router.push("/listproducts");
      } else {
        form.imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setForm(INITIAL_FORM_STATE);
        setSubcategories([]);
        setSubSubcategories([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }

    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#c4a174]" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Product...</span>
      </div>
    );
  }

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
              {isEditMode ? (
                <>EDIT <span className="text-[#c4a174] italic">COLLECTION</span> ITEM</>
              ) : (
                <>NEW <span className="text-[#c4a174] italic">COLLECTION</span> ITEM</>
              )}
            </h1>
          </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 shadow-sm">
              <span className={`text-[10px] font-black uppercase tracking-widest ${form.active ? 'text-[#c4a174]' : 'text-slate-300'}`}>
                {form.active ? 'Public' : 'Archived'}
              </span>
              <button
                type="button"
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-500 outline-none ${form.active ? 'bg-[#c4a174] shadow-lg shadow-[#c4a174]/20' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${form.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
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
                  {isEditMode ? "UPDATE LISTING" : "SAVE LISTING"}
                </>
              )}
            </button>
          </div>
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
                    className="flex-1 py-3 bg-transparent border-b-2 border-slate-100 font-mono text-sm text-[#2b2652] outline-none focus:border-[#c4a174] uppercase placeholder:text-slate-300"
                    value={form.sku}
                    onChange={e => setForm({ ...form, sku: e.target.value })}
                    placeholder="ENTER SKU MANUALLY..."
                  />
                  <button
                    type="button"
                    onClick={generateSKU}
                    className="text-[9px] font-black uppercase border-2 border-[#2b2652] px-4 py-1.5 rounded-lg hover:bg-[#2b2652] hover:text-[#c4a174] transition-all whitespace-nowrap"
                  >
                    Auto-Gen
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
                  <div key={v.id ?? `new-${i}`} className="grid grid-cols-12 gap-6 items-end border-b border-white/5 pb-6 group">

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

                    {/* Carry Bag & Box checkbox column */}
                    <div className="col-span-2 space-y-2">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                        <Package size={10} className="text-[#c4a174]" /> Bag & Box
                      </p>
                      <label className="flex items-center gap-2 py-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!v.carry_bag_box}
                          onChange={e => handleVariationCheckbox(i, "carry_bag_box", e.target.checked)}
                          className="peer sr-only"
                        />
                        <span className="w-5 h-5 flex items-center justify-center rounded-md border-2 border-white/20 bg-transparent peer-checked:bg-[#c4a174] peer-checked:border-[#c4a174] transition-all">
                          {v.carry_bag_box && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2b2652" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 peer-checked:text-[#c4a174]">
                          {v.carry_bag_box ? "Included" : "Not Included"}
                        </span>
                      </label>
                    </div>

                    <div className="col-span-1 flex justify-end pb-1">
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
                  onClick={() => setForm({ ...form, variations: [...form.variations, { color_id: "", size_id: "", price: "", sale_price: "", stock: "", carry_bag_box: false }] })}
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
                <Hash size={14} className="text-[#c4a174]" /> METADATA
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
                <ImageIcon size={14} className="text-[#c4a174]" /> ASSETS
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Already-saved images (edit mode) */}
                {existingImages.map((img) => {
                  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(img.image_url);
                  return (
                    <div key={`existing-${img.id}`} className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden border-2 border-white shadow-md group bg-black">
                      {isVideo ? (
                        <video
                          src={img.image_url}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          muted
                          loop
                          onMouseOver={(e) => e.currentTarget.play()}
                          onMouseOut={(e) => e.currentTarget.pause()}
                        />
                      ) : (
                        <img src={img.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="existing" />
                      )}
                      <div className="absolute inset-0 bg-[#2b2652]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(img)}
                          className="bg-white text-red-600 p-2 rounded-xl shadow-xl hover:scale-110 transition-transform"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Newly added (not-yet-uploaded) images */}
                {form.imagePreviews.map((src, i) => {
                  const isVideo = form.images[i]?.type.startsWith('video');

                  return (
                    <div key={`new-${i}`} className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden border-2 border-white shadow-md group bg-black">
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
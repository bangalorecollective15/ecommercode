"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft, Save, Plus, Trash2, Image as ImageIcon,
  Youtube, Info, Layers, Tag, Beaker, Truck, Clock, Package, Hash
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types matching your SQL Schema
interface Brand {
  id: number;
  name_en: string;
}
interface Category { id: number; name: string; }
interface SubCategory { id: number; name: string; }
interface SubSubCategory { id: number; name: string; }
interface Taste { id: number; name: string; }

interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  ingredients?: string;
  category_id?: number;
  subcategory_id?: number;
  sub_subcategory_id?: number;
  brand_id?: number;
  pack_of?: string;
  max_shelf_life?: string;
  taste_id?: number;
  has_variation?: boolean;
  shipping_charge?: number;
  shipping_type: string;
  youtube_url?: string;
}

interface ProductVariation {
  id?: number;
  product_id?: number;
  unit_type: string;
  unit_value: string;
  price: number;
  stock: number;
}

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<SubSubCategory[]>([]);
  const [tastes, setTastes] = useState<Taste[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [images, setImages] = useState<{ id: number, image_url: string }[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initFetch = async () => {
      await Promise.all([
        fetchProduct(),
        fetchBrands(),
        fetchCategories(),
        fetchTastes(),
        fetchVariations(),
        fetchImages()
      ]);
      setLoading(false);
    };
    initFetch();
  }, [productId]);

  const fetchProduct = async () => {
    const { data, error } = await supabase.from("products").select("*").eq("id", productId).single();
    if (!error && data) setProduct(data);
  };

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from("brands")
      .select("id, name_en")
      .order("name_en", { ascending: true });

    if (error) {
      console.error("Brand fetch error:", error);
      return;
    }

    if (data) setBrands(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    if (data) setCategories(data);
  };

  const fetchTastes = async () => {
    const { data } = await supabase.from("attributes").select("*");
    if (data) setTastes(data);
  };

  const fetchVariations = async () => {
    const { data } = await supabase.from("product_variations").select("*").eq("product_id", productId);
    if (data) setVariations(data);
  };

  const fetchImages = async () => {
    const { data } = await supabase.from("product_images").select("*").eq("product_id", productId);
    if (data) setImages(data || []);
  };

  useEffect(() => {
    if (!product?.category_id) {
      setSubCategories([]);
      return;
    }
    supabase.from("subcategories").select("*").eq("category_id", product.category_id)
      .then(({ data }) => setSubCategories(data || []));
  }, [product?.category_id]);

  useEffect(() => {
    if (!product?.subcategory_id) {
      setSubSubCategories([]);
      return;
    }
    supabase.from("sub_subcategories").select("*").eq("subcategory_id", product.subcategory_id)
      .then(({ data }) => setSubSubCategories(data || []));
  }, [product?.subcategory_id]);

  // UPDATED HANDLER: Auto-sets charge to 0 if shipping_type is 'free'
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (!product) return;

    let updates: any = {
      ...product,
      [name]: name.includes("_id") ? Number(value) : type === "number" ? Number(value) : value
    };

    if (name === "shipping_type" && value === "free") {
      updates.shipping_charge = 0;
    }

    setProduct(updates);
  };

  const handleVariationChange = (index: number, field: keyof ProductVariation, value: any) => {
    const updated = [...variations];
    (updated[index] as any)[field] = (field === "price" || field === "stock") ? Number(value) : value;
    setVariations(updated);
  };

  const addVariation = () => {
    setVariations([...variations, { unit_type: "Grams", unit_value: "", price: 0, stock: 0 }]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;
    const loadId = toast.loading("Updating product...");

    try {
      const { id, ...productData } = product;
      const { error: prodError } = await supabase.from("products").update(productData).eq("id", productId);
      if (prodError) throw prodError;

      await supabase.from("product_variations").delete().eq("product_id", productId);
      const variationsToInsert = variations.map(v => ({
        product_id: productId,
        unit_type: v.unit_type,
        unit_value: v.unit_value,
        price: v.price,
        stock: v.stock
      }));
      await supabase.from("product_variations").insert(variationsToInsert);

      for (let file of imageFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error: upError } = await supabase.storage.from("product-images").upload(fileName, file);
        if (upError) throw upError;
        const { publicUrl } = supabase.storage.from("product-images").getPublicUrl(fileName).data;
        await supabase.from("product_images").insert({ product_id: productId, image_url: publicUrl });
      }

      toast.success("Product updated successfully!", { id: loadId });
      router.push("/products/listproducts");
    } catch (err: any) {
      toast.error(err.message, { id: loadId });
    }
  };

  if (loading || !product) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-600"></div>
      <p className="mt-4 text-orange-600 font-bold animate-pulse">LOADING PRODUCT...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <Toaster position="top-right" />

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 p-4 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Edit Product</h1>
          </div>
          <button
            form="product-form"
            type="submit"
            className="flex items-center gap-2 bg-orange-600 text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-700 hover:scale-105 transition-all active:scale-95"
          >
            <Save size={18} /> SAVE CHANGES
          </button>
        </div>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">

          {/* Section 1: Basic Info */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Info size={18} /> <span className="text-xs font-black uppercase tracking-widest">Core Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Product Name</label>
                <input type="text" name="name" value={product.name || ""} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 flex items-center gap-1">
                  <Hash size={12} /> SKU Code
                </label>
                <input
                  type="text"
                  name="sku"
                  value={product.sku || ""}
                  readOnly // This prevents typing
                  className="w-full p-4 bg-gray-100 border-none rounded-2xl font-bold text-gray-500 cursor-not-allowed outline-none"
                  placeholder="No SKU Assigned"
                />
                <p className="text-[9px] text-gray-400 ml-2 ">* SKU is unique and cannot be changed.</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Description</label>
              <textarea name="description" value={product.description || ""} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 min-h-[120px]" />
            </div>
          </div>

          {/* Section 2: Variations */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-600">
                <Layers size={18} /> <span className="text-xs font-black uppercase tracking-widest">Variations</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={product.has_variation} onChange={e => setProduct({ ...product, has_variation: e.target.checked })} className="hidden" />
                <div className={`w-10 h-5 rounded-full transition-colors relative ${product.has_variation ? 'bg-orange-600' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${product.has_variation ? 'left-6' : 'left-1'}`} />
                </div>
              </label>
            </div>

            {product.has_variation && (
              <div className="space-y-4">
                {variations.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 bg-gray-50 p-3 rounded-2xl items-center">
                    <div className="col-span-3">
                      <select value={v.unit_type} onChange={e => handleVariationChange(idx, "unit_type", e.target.value)} className="w-full bg-transparent border-none font-bold text-sm">
                        <option>Grams</option><option>Kg</option><option>Liter</option><option>Ml</option><option>Pcs</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input type="text" placeholder="Value" value={v.unit_value || ""} onChange={e => handleVariationChange(idx, "unit_value", e.target.value)} className="w-full bg-white border-none rounded-xl text-sm font-bold py-2 px-3 shadow-sm" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={v.price} onChange={e => handleVariationChange(idx, "price", e.target.value)} className="w-full bg-white border-none rounded-xl text-sm font-bold py-2 px-3 shadow-sm" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={v.stock} onChange={e => handleVariationChange(idx, "stock", e.target.value)} className="w-full bg-white border-none rounded-xl text-sm font-bold py-2 px-3 shadow-sm" />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button type="button" onClick={() => setVariations(variations.filter((_, i) => i !== idx))} className="text-red-400 p-2"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addVariation} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold text-xs hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
                  <Plus size={14} /> ADD NEW VARIATION
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Ingredients & Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-orange-600">
                <Beaker size={18} /> <span className="text-xs font-black uppercase tracking-widest">Ingredients</span>
              </div>
              <textarea name="ingredients" value={product.ingredients || ""} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl min-h-[100px] text-sm font-medium" />
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-orange-600">
                <Truck size={18} /> <span className="text-xs font-black uppercase tracking-widest">Shipping</span>
              </div>
              <div className="space-y-4">
                <select name="shipping_type" value={product.shipping_type} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm">
                  <option value="free">Free Delivery</option>
                  <option value="paid">Paid Delivery</option>
                </select>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    name="shipping_charge"
                    value={product.shipping_charge || 0}
                    onChange={handleChange}
                    disabled={product.shipping_type === "free"} // Disables if free
                    className={`w-full p-4 pl-8 border-none rounded-2xl font-bold text-sm ${product.shipping_type === "free" ? 'bg-gray-100 text-gray-400' : 'bg-gray-50'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Taxonomy & Media */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Tag size={18} /> <span className="text-xs font-black uppercase tracking-widest">Product Taxonomy</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1 p-3 bg-gray-50 rounded-2xl">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Brand</label>
                <select name="brand_id" value={product.brand_id || ""} onChange={handleChange} className="w-full bg-transparent border-none font-bold text-sm outline-none">
                  <option value="">Select Brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 p-3 bg-gray-50 rounded-2xl border border-orange-100">
                <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Main Category</label>
                <select name="category_id" value={product.category_id || ""} onChange={handleChange} className="w-full bg-transparent border-none font-bold text-sm outline-none">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1 p-3 bg-gray-50 rounded-2xl">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Sub Category</label>
                <select name="subcategory_id" value={product.subcategory_id || ""} onChange={handleChange} className="w-full bg-transparent border-none font-bold text-sm outline-none">
                  <option value="">Select Sub</option>
                  {subCategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                </select>
              </div>

              <div className="space-y-1 p-3 bg-gray-50 rounded-2xl">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Sub-Sub Category</label>
                <select name="sub_subcategory_id" value={product.sub_subcategory_id || ""} onChange={handleChange} className="w-full bg-transparent border-none font-bold text-sm outline-none">
                  <option value="">Select Sub-Sub</option>
                  {subSubCategories.map(ssc => <option key={ssc.id} value={ssc.id}>{ssc.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1"><Package size={10} /> Pack</label>
                <input type="text" name="pack_of" value={product.pack_of || ""} onChange={handleChange} className="w-full bg-transparent border-none font-bold text-xs" />
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1"><Clock size={10} /> Shelf Life</label>
                <input type="text" name="max_shelf_life" value={product.max_shelf_life || ""} onChange={handleChange} className="w-full bg-transparent border-none font-bold text-xs" />
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase">Taste Profile</label>
              <select name="taste_id" value={product.taste_id || ""} onChange={handleChange} className="w-full bg-transparent border-none font-bold text-xs">
                <option value="">Select Taste</option>
                {tastes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-orange-600">
              <ImageIcon size={18} /> <span className="text-xs font-black uppercase tracking-widest">Media</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {images.map(img => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-2xl border border-gray-100">
                  <img src={img.image_url} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => {
                    supabase.from("product_images").delete().eq("id", img.id).then(() => fetchImages());
                  }} className="absolute top-1 right-1 bg-white text-red-600 p-1 rounded-lg">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <label className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl cursor-pointer hover:bg-orange-50">
                <Plus size={24} className="text-gray-300" />
                <input type="file" multiple className="hidden" onChange={(e) => e.target.files && setImageFiles([...imageFiles, ...Array.from(e.target.files)])} />
              </label>
            </div>

            <div className="pt-4 border-t border-gray-50">
              <Youtube size={16} className="text-red-600 mb-2" />
              <input type="text" name="youtube_url" value={product.youtube_url || ""} onChange={handleChange} placeholder="YouTube link" className="w-full p-4 bg-red-50/50 border-none rounded-2xl text-xs font-bold" />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
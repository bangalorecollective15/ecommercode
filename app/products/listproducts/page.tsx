"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  Eye, Plus,
  Pencil, 
  Trash2, 
  QrCode, 
  Search, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Package
} from "lucide-react";
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  id: number;
  name: string;
  active: boolean;
}

export default function ProductList() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState("");
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* --- Data Fetching Logic (Same as your core logic) --- */
  useEffect(() => {
    supabase.from("categories").select("*").order("priority").then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    if (!selectedCategory) { setSubCategories([]); return; }
    supabase.from("subcategories").select("*").eq("category_id", selectedCategory).order("priority").then(({ data }) => setSubCategories(data || []));
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedSubCategory) { setSubSubCategories([]); return; }
    supabase.from("sub_subcategories").select("*").eq("subcategory_id", selectedSubCategory).order("priority").then(({ data }) => setSubSubCategories(data || []));
  }, [selectedSubCategory]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedSubCategory, selectedSubSubCategory, search, page]);

  const fetchProducts = async () => {
    let query = supabase.from("products").select("*", { count: "exact" });
    if (selectedCategory) query = query.eq("category_id", selectedCategory);
    if (selectedSubCategory) query = query.eq("subcategory_id", selectedSubCategory);
    if (selectedSubSubCategory) query = query.eq("sub_subcategory_id", selectedSubSubCategory);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, count, error } = await query
      .order("id", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (!error) {
      setProducts(data || []);
      setTotalCount(count || 0);
    }
  };

const deleteProduct = async () => {
  if (!deleteId) return;

  try {
    // 1. Fetch images associated with the product first
    const { data: images } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", deleteId);

    // 2. Delete files from Storage bucket if they exist
    if (images && images.length > 0) {
      const paths = images.map(img => {
        // Extracts the path after /product-images/
        return img.image_url.split('/product-images/')[1];
      });
      
      await supabase.storage.from('product-images').remove(paths);
    }

    // 3. Delete the product (Cascade will handle product_images and product_variations rows)
    const { error } = await supabase.from("products").delete().eq("id", deleteId);

    if (error) throw error;

    toast.success("Product and all associated data deleted");
    setProducts(prev => prev.filter(p => p.id !== deleteId));
  } catch (error: any) {
    toast.error(error.message || "Failed to delete product");
    console.error(error);
  } finally {
    setShowDeleteModal(false);
  }
};
  const totalPages = Math.ceil(totalCount / pageSize);

return (
  <div className="min-h-screen bg-[#F9FAFB] p-6 md:p-12 antialiased">
    <Toaster position="top-right" />
    <div className="max-w-8xl mx-auto space-y-10">
      
      {/* Header Section - Modern & Bold */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-1 bg-black rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Logistics Portal</span>
          </div>
          <h1 className="text-4xl font-black text-black tracking-tighter  flex items-center gap-3">
            Products Management
          </h1>
          <p className="text-slate-500 font-medium mt-2">Precision control over your global product catalog.</p>
        </div>
        
        <button 
           onClick={() => router.push('/products/addproducts')}
           className="px-8 py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-black/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={3} />
          Add New Product
        </button>
      </div>

      {/* Filters Panel - Clean & Floating */}
      <div className="bg-white p-2 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-transparent border-none rounded-[2rem] focus:ring-0 outline-none transition font-bold text-sm placeholder:text-slate-300"
            />
          </div>

          {/* Styled Select Containers */}
          {[
            { value: selectedCategory, setter: setSelectedCategory, options: categories, label: "Category" },
            { value: selectedSubCategory, setter: setSelectedSubCategory, options: subCategories, label: "Sub-Category", disabled: !subCategories.length },
            { value: selectedSubSubCategory, setter: setSelectedSubSubCategory, options: subSubCategories, label: "Deep Category", disabled: !subSubCategories.length }
          ].map((select, idx) => (
            <div key={idx} className="relative">
              <select
                value={select.value}
                disabled={select.disabled}
                onChange={(e) => select.setter(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50/50 border-none rounded-[1.8rem] outline-none font-black text-[11px] uppercase tracking-widest text-slate-500 appearance-none cursor-pointer disabled:opacity-30 transition-all hover:bg-slate-50"
              >
                <option value="">{select.label}</option>
                {select.options.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Table Content - Minimalist Tech Style */}
      <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white border-b border-slate-50">
            <tr>
              <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">ID Reference</th>
              <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">Product Nomenclature</th>
              <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">Visibility Status</th>
              <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 text-right">Operational Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map((product) => (
              <tr key={product.id} className="group hover:bg-slate-50/40 transition-all duration-300">
                <td className="px-10 py-6">
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-400 px-2 py-1 rounded-md">
                    REF-{product.id}
                  </span>
                </td>
                <td className="px-10 py-6">
                  <div className="font-bold text-slate-900 text-lg tracking-tight group-hover:text-black transition-colors">
                    {product.name}
                  </div>
                </td>
                <td className="px-10 py-6">
                  <button
                    onClick={async () => {
                      const { error } = await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
                      if (!error) {
                         setProducts(prev => prev.map(p => p.id === product.id ? {...p, active: !p.active} : p));
                         toast.success(`Product ${!product.active ? 'Activated' : 'Deactivated'}`);
                      }
                    }}
                    className={`
                      relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-500 outline-none
                      ${product.active ? 'bg-black shadow-[0_0_15px_rgba(0,0,0,0.1)]' : 'bg-slate-200'}
                    `}
                  >
                    <span className={`
                      inline-block h-3 w-3 transform rounded-full bg-white transition-all duration-300
                      ${product.active ? 'translate-x-6' : 'translate-x-1'}
                    `} />
                  </button>
                  <span className={`ml-3 text-[10px] font-black uppercase tracking-widest ${product.active ? 'text-black' : 'text-slate-300'}`}>
                    {product.active ? 'Active' : 'Hidden'}
                  </span>
                </td>
               <td className="px-10 py-6">
  <div className="flex justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
    <ActionButton 
      icon={<QrCode size={16}/>} 
      color="gray" 
      onClick={() => router.push(`/products/listproducts/barcode/${product.id}`)} 
    />
    <ActionButton 
      icon={<Eye size={16}/>} 
      color="gray" 
      onClick={() => router.push(`/products/listproducts/view/${product.id}`)} 
    />
    <ActionButton 
      icon={<Pencil size={16}/>} 
      color="gray" 
      onClick={() => router.push(`/products/listproducts/edit/${product.id}`)} 
    />
    <ActionButton 
      icon={<Trash2 size={16}/>} 
      color="red" 
      onClick={() => { setDeleteId(product.id); setShowDeleteModal(true); }} 
    />
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - Number Centered */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-4 bg-white border border-slate-100 rounded-2xl disabled:opacity-20 hover:bg-slate-50 transition shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 mx-4">Page</span>
            <span className="text-lg font-black text-black">{page}</span>
            <span className="mx-2 text-slate-200">/</span>
            <span className="text-sm font-bold text-slate-400">{totalPages}</span>
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-4 bg-white border border-slate-100 rounded-2xl disabled:opacity-20 hover:bg-slate-50 transition shadow-sm">
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>

    {/* Delete Modal - High Intensity Monochrome */}
    {showDeleteModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-[3rem] p-12 w-full max-w-md text-center shadow-2xl space-y-8">
          <div className="w-20 h-20 bg-slate-50 text-black rounded-[2rem] flex items-center justify-center mx-auto border border-slate-100">
            <Trash2 size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">Confirm Erasure</h2>
            <p className="text-slate-500 font-medium mt-3 leading-relaxed">This record will be permanently removed from the master database. This cannot be reversed.</p>
          </div>
          <div className="flex flex-col gap-3">
             <button
              className="w-full py-5 bg-black text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition shadow-xl shadow-black/20"
              onClick={deleteProduct}
            >
              Confirm Delete
            </button>
            <button
              className="w-full py-5 bg-transparent text-slate-400 font-bold uppercase text-xs tracking-widest rounded-2xl hover:text-black transition"
              onClick={() => setShowDeleteModal(false)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

/* --- Reusable Components --- */

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  color: 'gray' | 'blue' | 'orange' | 'red'; // Keep the keys but change the design
  title?: string;
}

function ActionButton({ icon, onClick, color, title }: ActionButtonProps) {
  const styles: Record<string, string> = {
    // Standard actions (View, Edit, Barcode)
    gray: "bg-white text-slate-400 border-slate-100 hover:text-black hover:border-black hover:shadow-lg hover:shadow-black/5",
    blue: "bg-white text-slate-400 border-slate-100 hover:text-blue-600 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/10",
    orange: "bg-white text-slate-400 border-slate-100 hover:text-orange-600 hover:border-orange-600 hover:shadow-lg hover:shadow-orange-500/10",
    
    // Danger action (Delete) - remains subtle until hovered
    red: "bg-white text-slate-300 border-slate-100 hover:text-red-600 hover:border-red-600 hover:bg-red-50/30 hover:shadow-lg hover:shadow-red-500/10",
  };

  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation(); // Prevents row click events if any
        onClick();
      }}
      className={`
        /* Layout */
        group relative flex items-center justify-center
        p-2.5 rounded-xl border transition-all duration-300
        
        /* Interaction */
        active:scale-90
        
        /* Dynamic Style */
        ${styles[color] || styles.gray}
      `}
    >
      <div className="transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
    </button>
  );
}
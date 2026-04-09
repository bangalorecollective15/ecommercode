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
  ChevronLeft, 
  ChevronRight,
  ChevronDown
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
      const { data: images } = await supabase.from("product_images").select("image_url").eq("product_id", deleteId);
      if (images && images.length > 0) {
        const paths = images.map(img => img.image_url.split('/product-images/')[1]);
        await supabase.storage.from('product-images').remove(paths);
      }
      const { error } = await supabase.from("products").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Product Purged from Registry");
      setProducts(prev => prev.filter(p => p.id !== deleteId));
    } catch (error: any) {
      toast.error(error.message || "Deletion Failed");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-6 md:p-12 text-[#2b2652] selection:bg-[#c4a174] selection:text-white">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-[2px] bg-[#c4a174]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Inventory Nexus</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
              Products <span className="text-[#c4a174] italic">Registry</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm">Centralized orchestration of global asset variations.</p>
          </div>
          
          <button 
             onClick={() => router.push('/products/addproducts')}
             className="px-10 py-5 bg-[#2b2652] text-[#c4a174] text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-[#2b2652]/20 hover:bg-[#1a1733] transition-all active:scale-95 flex items-center gap-3"
          >
            <Plus size={16} strokeWidth={3} />
            Initialize Product
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-3 rounded-[3rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search nomenclature..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-transparent border-none rounded-[2rem] outline-none font-bold text-sm text-[#2b2652] placeholder:text-slate-200"
              />
            </div>

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
                  className="w-full px-8 py-5 bg-slate-50/50 border-none rounded-[2rem] outline-none font-black text-[10px] uppercase tracking-widest text-[#2b2652]/60 appearance-none cursor-pointer disabled:opacity-30 transition-all hover:bg-slate-50"
                >
                  <option value="">{select.label}</option>
                  {select.options.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#c4a174] pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-50 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#2b2652]">
              <tr>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70">Reference ID</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70">Product Name</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70">Visibility</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((product) => (
                <tr key={product.id} className="group hover:bg-[#c4a174]/5 transition-all duration-300">
                  <td className="px-10 py-7">
                    <span className="text-[10px] font-mono font-black bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-[#c4a174]/30 transition-all">
                      #IDX-{product.id.toString().padStart(4, '0')}
                    </span>
                  </td>
                  <td className="px-10 py-7">
                    <div className="font-black text-[#2b2652] text-lg tracking-tight uppercase group-hover:text-[#c4a174] transition-colors">
                      {product.name}
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={async () => {
                          const { error } = await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
                          if (!error) {
                             setProducts(prev => prev.map(p => p.id === product.id ? {...p, active: !p.active} : p));
                             toast.success(`Visibility: ${!product.active ? 'Public' : 'Hidden'}`);
                          }
                        }}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-500 outline-none
                          ${product.active ? 'bg-[#c4a174] shadow-lg shadow-[#c4a174]/20' : 'bg-slate-200'}
                        `}
                      >
                        <span className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300
                          ${product.active ? 'translate-x-6' : 'translate-x-1'}
                        `} />
                      </button>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${product.active ? 'text-[#c4a174]' : 'text-slate-300'}`}>
                        {product.active ? 'Public' : 'Archived'}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-all duration-500">
                      <ActionButton icon={<QrCode size={16}/>} onClick={() => router.push(`/products/listproducts/barcode/${product.id}`)} />
                      <ActionButton icon={<Eye size={16}/>} onClick={() => router.push(`/products/listproducts/view/${product.id}`)} />
                      <ActionButton icon={<Pencil size={16}/>} onClick={() => router.push(`/products/listproducts/edit/${product.id}`)} />
                      <ActionButton icon={<Trash2 size={16}/>} color="red" onClick={() => { setDeleteId(product.id); setShowDeleteModal(true); }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 mt-16">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] disabled:opacity-20 hover:border-[#c4a174] transition shadow-sm active:scale-90">
              <ChevronLeft size={20} className="text-[#c4a174]" />
            </button>
            <div className="flex items-center bg-[#2b2652] px-6 py-3 rounded-[1.5rem] shadow-xl shadow-[#2b2652]/10">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#c4a174] opacity-60 mr-4">Protocol</span>
              <span className="text-xl font-black text-white">{page}</span>
              <span className="mx-3 text-[#c4a174]/30 font-light">/</span>
              <span className="text-sm font-bold text-[#c4a174]">{totalPages}</span>
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] disabled:opacity-20 hover:border-[#c4a174] transition shadow-sm active:scale-90">
              <ChevronRight size={20} className="text-[#c4a174]" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#2b2652]/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[4rem] p-12 w-full max-w-md text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
              <Trash2 size={40} />
            </div>
            <h2 className="text-3xl font-black text-[#2b2652] tracking-tighter uppercase mb-4">Registry Purge</h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-10">This action will permanently erase this entity and all linked variations from the live database. <span className="text-red-500 font-black">This cannot be undone.</span></p>
            <div className="flex flex-col gap-4">
               <button
                className="w-full py-5 bg-[#2b2652] text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-[#2b2652]/20"
                onClick={deleteProduct}
              >
                Confirm Deletion
              </button>
              <button
                className="w-full py-5 bg-transparent text-slate-300 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:text-[#2b2652] transition-all"
                onClick={() => setShowDeleteModal(false)}
              >
                Retain Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Styled Components --- */

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'gold' | 'red';
}

function ActionButton({ icon, onClick, color = 'gold' }: ActionButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        group relative flex items-center justify-center
        p-3 rounded-[1.2rem] border transition-all duration-300 active:scale-90
        ${color === 'red' 
          ? "bg-white text-slate-300 border-slate-100 hover:text-red-500 hover:border-red-200 hover:bg-red-50" 
          : "bg-white text-[#c4a174] border-slate-100 hover:text-white hover:border-[#2b2652] hover:bg-[#2b2652] hover:shadow-lg"}
      `}
    >
      <div className="transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
    </button>
  );
}
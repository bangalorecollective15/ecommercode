"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { 
  Eye, 
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
    const { error } = await supabase.from("products").delete().eq("id", deleteId);
    if (error) toast.error("Failed to delete product");
    else {
      toast.success("Product deleted");
      setProducts(prev => prev.filter(p => p.id !== deleteId));
    }
    setShowDeleteModal(false);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <Toaster position="top-right" />
      <div className="max-w-8xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Package className="text-orange-600 w-9 h-9" />
              Inventory Management
            </h1>
            <p className="text-gray-500 font-medium mt-1">Browse, filter, and manage your product catalog.</p>
          </div>
          <button 
             onClick={() => router.push('/products/addproducts')}
             className="px-6 py-3 bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-700 transition active:scale-95"
          >
            + Add New Product
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500/20 outline-none transition font-medium"
              />
            </div>

            <div className="relative">
              <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-600 appearance-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              className="px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-600 disabled:opacity-50"
              disabled={!subCategories.length}
            >
              <option value="">Sub-Category</option>
              {subCategories.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
            </select>

            <select
              value={selectedSubSubCategory}
              onChange={(e) => setSelectedSubSubCategory(e.target.value)}
              className="px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-600 disabled:opacity-50"
              disabled={!subSubCategories.length}
            >
              <option value="">Sub-Sub-Category</option>
              {subSubCategories.map((ssc) => <option key={ssc.id} value={ssc.id}>{ssc.name}</option>)}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">ID</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Product Name</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product.id} className="group hover:bg-orange-50/20 transition-colors">
                  <td className="px-8 py-6 text-sm font-bold text-gray-400">#{product.id}</td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{product.name}</div>
                  </td>
                  <td className="px-8 py-6">
                    <button
                      onClick={async () => {
                        const { error } = await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
                        if (!error) {
                           setProducts(prev => prev.map(p => p.id === product.id ? {...p, active: !p.active} : p));
                           toast.success(`Product is now ${!product.active ? 'Active' : 'Inactive'}`);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.active ? 'bg-orange-600' : 'bg-gray-200'}`}
                    >
                      <span className={`${product.active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-2">
                      <ActionButton icon={<QrCode size={18}/>} onClick={() => router.push(`/products/listproducts/barcode/${product.id}`)} color="gray" />
                      <ActionButton icon={<Eye size={18}/>} onClick={() => router.push(`/products/listproducts/view/${product.id}`)} color="blue" />
                      <ActionButton icon={<Pencil size={18}/>} onClick={() => router.push(`/products/listproducts/edit/${product.id}`)} color="orange" />
                      <ActionButton icon={<Trash2 size={18}/>} onClick={() => { setDeleteId(product.id); setShowDeleteModal(true); }} color="red" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {products.length === 0 && (
            <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
              No products found matching your criteria
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-3 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-orange-50 transition"
            >
              <ChevronLeft size={18} className="text-orange-600" />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                    page === i + 1 
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-100" 
                    : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-3 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-orange-50 transition"
            >
              <ChevronRight size={18} className="text-orange-600" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-sm text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Are you sure?</h2>
              <p className="text-gray-500 font-medium mt-2">This action is permanent and cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition shadow-lg shadow-red-100"
                onClick={deleteProduct}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Reusable Components --- */

function ActionButton({ icon, onClick, color, title }: { icon: any; onClick: () => void; color: string; title?: string }) {
  const colors: any = {
    gray: "bg-gray-50 text-gray-500 hover:bg-gray-100",
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
  };
  
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all active:scale-90 ${colors[color]}`}
    >
      {icon}
    </button>
  );
}
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { ChevronDown} from "lucide-react";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RestockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("name");
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [newStock, setNewStock] = useState<number>(0);

const loadProducts = async () => {
  setLoading(true);
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, 
      name, 
      sku, 
      product_variations (
        id, 
        price, 
        stock,
        color:attributes!product_variations_color_id_fkey ( name ),
        size:attributes!product_variations_size_id_fkey ( name )
      )
    `);

  if (error) {
    console.error("Supabase Error:", error);
    toast.error("Failed to load inventory");
  } else {
    setProducts(data || []);
  }
  setLoading(false);
};
  useEffect(() => {
    loadProducts();
  }, []);

  const updateStock = async () => {
    if (!editingProduct) return;
    try {
      const { error } = await supabase
        .from("product_variations")
        .update({ stock: newStock })
        .eq("id", editingProduct.variationId);

      if (error) throw error;
      toast.success("Stock updated!");
      setEditingProduct(null);
      await loadProducts();
    } catch (err: any) {
      toast.error("Update failed");
    }
  };

const filteredProducts = products.flatMap((p) => {
  if (!p.product_variations) return [];

  return p.product_variations.map((v: any) => {
    // Helper to extract name regardless of if Supabase returns an array or object
    const getName = (val: any) => {
      if (!val) return null;
      return Array.isArray(val) ? val[0]?.name : val.name;
    };

    return {
      productId: p.id,
      name: p.name,
      sku: p.sku || "N/A",
      variationId: v.id,
      colorName: getName(v.color) || "Standard", 
      sizeName: getName(v.size) || "OS",
      price: v.price || 0,
      stock: v.stock || 0,
    };
  });
});
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

return (
    <div className="p-8 md:p-12 bg-[#FBFBFC] min-h-screen font-sans text-[#2b2652] selection:bg-[#c4a174] selection:text-white">
      <Toaster position="top-right" />

      {/* HEADER */}
      <header className="mb-12 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[2px] bg-[#c4a174]"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Warehouse Protocol</span>
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tighter text-[#2b2652]">
          Inventory <span className="text-[#c4a174] italic">Control</span>
        </h1>
        <p className="text-slate-400 font-medium text-sm">Real-time stock adjustment for global product variations.</p>
      </header>

      {/* CONTROLS */}
      <div className="flex flex-col md:flex-row gap-6 mb-10">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name or SKU..."
            className="w-full p-5 pl-6 rounded-[2rem] border-2 border-slate-50 bg-white shadow-sm outline-none focus:border-[#c4a174]/50 transition-all font-bold text-sm placeholder:text-slate-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="appearance-none p-5 pr-12 rounded-[2rem] border-2 border-slate-50 bg-white shadow-sm font-black text-[10px] uppercase tracking-widest outline-none focus:border-[#c4a174]/50 cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="name">Sort by Name</option>
            <option value="stock">Sort by Stock</option>
            <option value="price">Sort by Price</option>
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#c4a174]">
             <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-[#2b2652]/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#2b2652]">
            <tr>
              <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70">Product Entity</th>
              <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70">Variation Profile</th>
              <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70">Retail Value</th>
              <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70">On-Hand Stock</th>
              <th className="px-10 py-6 text-center text-[9px] font-black uppercase tracking-[0.2em] text-[#c4a174]/70">Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.map((p) => (
              <tr key={p.variationId} className="hover:bg-[#c4a174]/5 transition-colors group">
                <td className="px-10 py-6">
                  <span className="font-black text-[#2b2652] uppercase tracking-tight group-hover:text-[#c4a174] transition-colors">{p.name}</span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-1 tracking-tighter">{p.sku}</span>
                </td>
                <td className="px-10 py-6">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-[#2b2652]">{p.colorName}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Size {p.sizeName}</span>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <span className="font-black text-sm">₹{p.price}</span>
                </td>
                <td className="px-10 py-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${p.stock < 10 ? 'bg-red-500 animate-pulse' : 'bg-[#c4a174]'}`} />
                    <span className={`font-black text-lg ${p.stock < 10 ? 'text-red-500' : 'text-[#2b2652]'}`}>{p.stock}</span>
                  </div>
                </td>
                <td className="px-10 py-6 text-center">
                  <button
                    onClick={() => { setEditingProduct(p); setNewStock(p.stock); }}
                    className="bg-[#2b2652] text-[#c4a174] px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#1a1733] hover:shadow-lg transition-all active:scale-95"
                  >
                    Adjust
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-[#2b2652]/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white p-10 rounded-[4rem] shadow-2xl w-full max-w-md text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c4a174]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <h2 className="text-2xl font-black uppercase tracking-tighter text-[#2b2652] mb-1">Update Stock</h2>
            <p className="text-[#c4a174] text-[10px] font-black uppercase tracking-[0.2em] mb-10">{editingProduct.name} // {editingProduct.colorName}</p>
            
            <div className="relative inline-block mb-10 group">
                <input
                type="number"
                className="w-full text-7xl font-black text-center focus:outline-none text-[#2b2652] bg-transparent selection:bg-transparent"
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                autoFocus
                />
                <div className="w-12 h-1 bg-[#c4a174] mx-auto mt-2 rounded-full group-hover:w-full transition-all duration-500"></div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setEditingProduct(null)} 
                className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Discard
              </button>
              <button 
                onClick={updateStock} 
                className="flex-1 py-5 bg-[#2b2652] text-[#c4a174] rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#2b2652]/20 hover:bg-[#1a1733] transition-all"
              >
                Commit Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
);
}
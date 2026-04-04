"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";

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
    <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">
      <Toaster position="top-right" />

      <header className="mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Inventory Control</h1>
        <p className="text-slate-500 font-medium italic">Update stock levels for all product variations.</p>
      </header>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          className="flex-1 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-black"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="p-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs uppercase"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="name">Sort by Name</option>
          <option value="stock">Sort by Stock</option>
          <option value="price">Sort by Price</option>
        </select>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Variant</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Price</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Current Stock</th>
              <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.map((p) => (
              <tr key={p.variationId} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-900">{p.name} <span className="block text-[10px] text-slate-400 font-mono">{p.sku}</span></td>
                <td className="px-8 py-5">
                  <span className="text-[11px] font-black uppercase text-blue-600 block">{p.colorName}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Size {p.sizeName}</span>
                </td>
                <td className="px-8 py-5 font-black">₹{p.price}</td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${p.stock < 10 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <span className="font-black">{p.stock}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <button
                    onClick={() => { setEditingProduct(p); setNewStock(p.stock); }}
                    className="bg-black text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:scale-105 transition"
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-sm text-center">
            <h2 className="text-xl font-black uppercase">Edit Stock</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase mb-6">{editingProduct.name} - {editingProduct.colorName}</p>
            <input
              type="number"
              className="w-full text-5xl font-black text-center mb-8 focus:outline-none"
              value={newStock}
              onChange={(e) => setNewStock(Number(e.target.value))}
            />
            <div className="flex gap-4">
              <button onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">Cancel</button>
              <button onClick={updateStock} className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-black/20">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
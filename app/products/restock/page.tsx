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

  // Fetch products with unit_value included
  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, 
        name, 
        sku, 
        product_variations(id, unit_type, unit_value, price, stock)
      `);
    
    if (error) {
      toast.error("Failed to load products");
      console.error(error);
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

      toast.success("Stock updated successfully!");
      setEditingProduct(null);
      await loadProducts();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  };

  // Flatten and Filter data
  const filteredProducts = products
    .flatMap((p) =>
      p.product_variations.map((v: any) => ({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        variationId: v.id,
        unit: v.unit_type,
        unitValue: v.unit_value, // Added unit_value
        price: v.price,
        stock: v.stock,
      }))
    )
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "stock") return a.stock - b.stock;
      return 0;
    });

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-orange-600">Inventory Re-stock</h1>
        <p className="text-gray-500">Manage your product variations and stock levels.</p>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 outline-none transition"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border border-gray-300 p-3 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-orange-500 outline-none transition w-full md:w-64"
        >
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
          <option value="stock">Sort by Stock Level</option>
        </select>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Unit / Size</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr key={p.variationId} className="hover:bg-orange-50/30 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{p.name}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-sm">{p.sku}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">
                      {p.unitValue} {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">₹{p.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${p.stock < 20 ? "text-red-500" : "text-gray-700"}`}>
                        {p.stock}
                      </span>
                      {p.stock < 20 && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                          Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setNewStock(p.stock);
                      }}
                      className="px-5 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 shadow-sm transition active:scale-95"
                    >
                      Re-stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Update Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-xl font-bold text-gray-800">Update Stock</h3>
              <p className="text-gray-500 text-sm">
                {editingProduct.name} ({editingProduct.unitValue} {editingProduct.unit})
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Inventory Count</label>
              <input
                type="number"
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(Math.max(0, Number(e.target.value)))}
                className="border-2 border-gray-200 p-3 w-full rounded-xl focus:border-orange-500 focus:ring-0 outline-none text-xl font-bold text-center transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={updateStock}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 shadow-md shadow-orange-200 transition active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
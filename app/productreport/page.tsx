"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { 
  Search, 
  Download, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  Filter,
  Tag
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  id: number;
  name: string;
  sku: string;
  display_price: number | null; // sale_price if exists, else price
  stock: number | null;
  active: boolean;
  shipping_charge: number | null;
  total_orders: number;
  total_revenue: number;
  created_at: string;
}

export default function ProductReport() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "created_at" | "display_price" | "stock" | "total_orders" | "total_revenue"
  >("created_at");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // 1. Fetch Products with price, sale_price, and stock from variations
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          id, name, sku, active, shipping_charge, created_at,
          product_variations(price, sale_price, stock)
        `)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      // 2. Fetch Orders for performance metrics
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, cart_items");

      if (ordersError) throw ordersError;

      const orderCountMap: Record<string, Set<string>> = {};
      const revenueMap: Record<string, number> = {};

      ordersData?.forEach((order: any) => {
        try {
          const items = typeof order.cart_items === 'string' 
            ? JSON.parse(order.cart_items) 
            : order.cart_items;

          items?.forEach((item: any) => {
            const pid = String(item.productId); 
            const oid = String(order.id);
            const qty = Number(item.quantity || 0);
            const price = Number(item.price || 0);

            if (!orderCountMap[pid]) orderCountMap[pid] = new Set();
            orderCountMap[pid].add(oid);
            revenueMap[pid] = (revenueMap[pid] || 0) + (price * qty);
          });
        } catch (e) {
          console.error("Error parsing cart_items:", e);
        }
      });

      // 3. Map final data with fallback logic: sale_price ?? price
      const mapped: Product[] = (productsData as any[]).map((p) => {
        const variation = p.product_variations?.[0];
        const productIdStr = String(p.id);

        // Fallback: If sale_price exists and is not null, use it. Otherwise use price.
        const finalPrice = (variation?.sale_price !== null && variation?.sale_price !== undefined) 
          ? variation.sale_price 
          : variation?.price;

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          active: p.active,
          display_price: finalPrice ?? null,
          stock: variation?.stock ?? null,
          shipping_charge: p.shipping_charge ?? 0,
          total_orders: orderCountMap[productIdStr]?.size ?? 0,
          total_revenue: revenueMap[productIdStr] ?? 0,
          created_at: p.created_at,
        };
      });

      setProducts(mapped);
      setFilteredProducts(mapped);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAndSort = () => {
    let temp = [...products];
    if (search.trim()) {
      const s = search.toLowerCase();
      temp = temp.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }
    temp.sort((a, b) => {
      if (sortBy === "created_at") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return (b[sortBy] as number || 0) - (a[sortBy] as number || 0);
    });
    setFilteredProducts(temp);
    setCurrentPage(1);
  };

  useEffect(() => { handleSearchAndSort(); }, [search, sortBy, products]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredProducts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ProductReport");
    XLSX.writeFile(workbook, "product_report.xlsx");
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedItems = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-100 border-t-black"></div>
      <p className="text-black font-bold uppercase tracking-widest text-xs">Analyzing Inventory...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen text-slate-900">
      <div className="max-w-8xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Package className="text-black w-10 h-10" />
              Product Insights
            </h1>
            <p className="text-gray-500 font-medium mt-1">Real-time tracking with dynamic pricing fallback.</p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={18} className="text-black" />
            Download CSV
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Skus" value={products.length} icon={<Package size={20}/>} color="orange" />
          <StatCard title="Active Items" value={products.filter(p => p.active).length} icon={<CheckCircle2 size={20}/>} color="green" />
          <StatCard title="Out of Stock" value={products.filter(p => (p.stock || 0) <= 0).length} icon={<XCircle size={20}/>} color="red" />
          <StatCard title="Total Revenue" value={`₹${products.reduce((acc, curr) => acc + curr.total_revenue, 0).toLocaleString()}`} icon={<TrendingUp size={20}/>} color="orange" />
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black/20 outline-none transition font-medium"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-10 pr-8 py-3 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm text-gray-600 appearance-none cursor-pointer hover:bg-gray-100 transition"
              >
                <option value="created_at">Sort: Newest</option>
                <option value="display_price">Sort: Price</option>
                <option value="stock">Sort: Stock</option>
                <option value="total_orders">Sort: Popularity</option>
                <option value="total_revenue">Sort: Revenue</option>
              </select>
            </div>
            <button
              onClick={() => { setSearch(""); setSortBy("created_at"); }}
              className="p-3 bg-gray-100 text-gray-500 rounded-2xl hover:bg-orange-100 hover:text-black transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Product Info</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Current Price</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Performance</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedItems.map((p) => (
                  <tr key={p.id} className="group hover:bg-orange-50/20 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-bold text-gray-900 group-hover:text-black transition-colors">{p.name}</div>
                      <div className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-tighter">SKU: {p.sku}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1.5 text-sm font-black text-slate-800">
                        <Tag size={12} className="text-orange-500" />
                        ₹{p.display_price?.toLocaleString() || "-"}
                      </div>
                      <div className={`text-[10px] font-bold mt-1 ${ (p.stock || 0) < 5 ? 'text-red-500' : 'text-gray-400'}`}>
                        STOCK: {p.stock ?? "0"}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs font-bold text-gray-800">{p.total_orders} Orders</div>
                      <div className="text-[10px] font-bold text-green-600 mt-1 uppercase tracking-tighter">
                        Rev: ₹{p.total_revenue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                        p.active ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                      }`}>
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="text-xs font-bold text-gray-400">{new Date(p.created_at).toLocaleDateString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-3 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-orange-50 transition shadow-sm"
            >
              <ChevronLeft size={18} className="text-black" />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                    currentPage === i + 1 
                    ? "bg-black text-white shadow-lg shadow-orange-100" 
                    : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-3 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-orange-50 transition shadow-sm"
            >
              <ChevronRight size={18} className="text-black" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  const themes: Record<string, string> = {
    orange: "bg-orange-50 text-black border-orange-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${themes[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-xl font-black text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
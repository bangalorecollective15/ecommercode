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
  Tag,
  Loader2,
  Box
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  id: number;
  name: string;
  sku: string;
  display_price: number | null;
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
  const itemsPerPage = 12;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          id, name, sku, active, shipping_charge, created_at,
          product_variations(price, sale_price, stock)
        `)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

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

      const mapped: Product[] = (productsData as any[]).map((p) => {
        const variation = p.product_variations?.[0];
        const productIdStr = String(p.id);
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "InventoryArchive");
    XLSX.writeFile(workbook, `Swaadha_Products_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedItems = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBFBFC] gap-4">
       <Loader2 className="w-12 h-12 text-[#c4a174] animate-spin" />
       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2b2652]">Accessing Secure Vault...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] font-sans p-6 md:p-10 selection:bg-[#c4a174] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg shadow-[#2b2652]/20">
                <Box className="text-[#c4a174] w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Inventory Management</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
              Stock <span className="text-[#c4a174] italic">Intelligence</span>
            </h1>
          </div>
          
          <button
            onClick={exportToExcel}
            className="h-14 px-8 bg-white text-[#2b2652] border border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:border-[#c4a174] transition-all flex items-center gap-3 shadow-sm active:scale-95 group"
          >
            <Download size={18} className="text-[#c4a174] group-hover:-translate-y-0.5 transition-transform" />
            Download Catalog
          </button>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Skus" value={products.length} icon={<Package size={22}/>} variant="brand" />
          <StatCard title="Live Items" value={products.filter(p => p.active).length} icon={<CheckCircle2 size={22}/>} variant="brand" />
          <StatCard title="Stock Alerts" value={products.filter(p => (p.stock || 0) <= 0).length} icon={<XCircle size={22}/>} variant="gold" />
          <StatCard title="Value Flow" value={products.reduce((acc, curr) => acc + curr.total_revenue, 0)} icon={<TrendingUp size={22}/>} variant="gold" isCurrency />
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-white p-4 rounded-[1.8rem] border border-slate-100 shadow-sm">
          <div className="lg:col-span-7 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={18} />
            <input
              type="text"
              placeholder="SEARCH BY SKU OR PRODUCT NAME..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#c4a174]/20 text-[10px] font-black uppercase tracking-widest outline-none transition-all"
            />
          </div>
          
          <div className="lg:col-span-4 flex gap-3">
            <div className="relative flex-1">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c4a174]" size={16} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-14 pl-12 pr-6 bg-slate-50 border-none rounded-xl outline-none font-black text-[10px] uppercase tracking-widest text-[#2b2652] cursor-pointer appearance-none"
              >
                <option value="created_at">Registry Date</option>
                <option value="display_price">Market Value</option>
                <option value="stock">Inventory Level</option>
                <option value="total_orders">Popularity</option>
                <option value="total_revenue">Financial Performance</option>
              </select>
            </div>
            
            <button
              onClick={() => { setSearch(""); setSortBy("created_at"); }}
              className="w-14 h-14 flex items-center justify-center bg-slate-100 text-[#2b2652] rounded-xl hover:bg-[#c4a174] transition-all group"
            >
              <RotateCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <Th>Master Item</Th>
                  <Th>Valuation & Stock</Th>
                  <Th>Performance</Th>
                  <Th>Market Status</Th>
                  <Th className="text-right">Logged</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedItems.map((p) => (
                  <tr key={p.id} className="group hover:bg-[#c4a174]/5 transition-colors">
                    <td className="px-10 py-7">
                      <div className="flex flex-col">
                        <span className="font-black text-sm text-[#2b2652] uppercase tracking-tight group-hover:text-[#c4a174] transition-colors">{p.name}</span>
                        <span className="text-[9px] font-black text-white bg-[#2b2652] w-fit px-2 py-0.5 rounded mt-1 tracking-widest">SKU: {p.sku}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-1.5 font-black text-[#2b2652]">
                        <Tag size={12} className="text-[#c4a174]" />
                        ₹{p.display_price?.toLocaleString() || "0"}
                      </div>
                      <div className={`text-[9px] font-black mt-1 uppercase tracking-widest ${ (p.stock || 0) < 5 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                        QTY: {p.stock ?? "0"}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="text-[10px] font-black text-[#2b2652] uppercase">{p.total_orders} Shipments</div>
                      <div className="text-[9px] font-black text-[#c4a174] mt-1 uppercase tracking-widest">
                        Rev: ₹{p.total_revenue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        p.active ? "bg-[#c4a174]/10 text-[#c4a174] border-[#c4a174]/20" : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}>
                        {p.active ? "Market Ready" : "Archived"}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase">{new Date(p.created_at).toLocaleDateString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-10 py-8 bg-slate-50/50 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                Registry {currentPage} <span className="text-[#c4a174]">/</span> {totalPages}
              </p>
              
              <div className="flex items-center gap-3">
                <PaginationBtn onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={18} />
                </PaginationBtn>

                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${
                        currentPage === i + 1 
                        ? "bg-[#2b2652] text-[#c4a174] shadow-lg shadow-[#2b2652]/20 scale-110" 
                        : "text-slate-400 hover:text-[#2b2652]"
                      }`}
                    >
                      {(i + 1).toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>

                <PaginationBtn onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                  <ChevronRight size={18} />
                </PaginationBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ${className}`}>
      {children}
    </th>
  );
}

function StatCard({ title, value, icon, variant, isCurrency }: any) {
  const styles: any = {
    brand: "bg-[#2b2652] text-[#c4a174]",
    gold: "bg-[#c4a174] text-[#2b2652]",
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className={`w-14 h-14 ${styles[variant]} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">{title}</p>
      <h2 className="text-3xl font-black text-[#2b2652] tracking-tighter">
        {isCurrency ? "₹" : ""}{value.toLocaleString()}
      </h2>
    </div>
  );
}

function PaginationBtn({ children, disabled, onClick }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-[#2b2652] disabled:opacity-20 hover:border-[#c4a174] transition-all"
    >
      {children}
    </button>
  );
}
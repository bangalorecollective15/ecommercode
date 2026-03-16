"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { 
  Download, 
  Search, 
  FilterX, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Package,
  Calendar
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Order {
  id: number;
  full_name: string;
  phone_number: string;
  total_price: number;
  grand_total: number;
  status: string;
  order_date: string;
}

export default function OrderReport() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"order_date" | "total_price" | "grand_total">("order_date");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, sortBy, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, full_name, phone_number, total_price, grand_total, status, order_date")
      .order("order_date", { ascending: false })
      .limit(200);

    if (error) {
      setOrders([]);
    } else {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let temp = [...orders];
    if (search.trim() !== "") {
      const s = search.toLowerCase();
      temp = temp.filter(
        (o) => o.full_name.toLowerCase().includes(s) || o.phone_number.includes(s)
      );
    }

    temp.sort((a, b) => {
      if (sortBy === "order_date") return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
      if (sortBy === "total_price") return b.total_price - a.total_price;
      if (sortBy === "grand_total") return b.grand_total - a.grand_total;
      return 0;
    });

    setFilteredOrders(temp);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSortBy("order_date");
  };

  // Stats Calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.grand_total), 0);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders Report");
    XLSX.writeFile(workbook, `Swaadha_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#F9FAFB] min-h-screen text-slate-900">
      <div className="max-w-8xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">ORDER REPORTS</h1>
            <p className="text-slate-500 font-medium">Monitor your sales performance and order statuses.</p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
          >
            <Download size={20} /> Export Excel
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Orders" value={totalOrders} icon={<Package size={24}/>} variant="blue" />
          <StatCard title="Pending" value={pendingOrders} icon={<Clock size={24}/>} variant="yellow" />
          <StatCard title="Delivered" value={deliveredOrders} icon={<CheckCircle2 size={24}/>} variant="green" />
          <StatCard title="Net Revenue" value={totalRevenue} icon={<TrendingUp size={24}/>} variant="orange" isCurrency />
        </div>

        {/* Filters & Search Section */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name or phone..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 font-medium text-slate-700 transition-all"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-600 focus:ring-2 focus:ring-orange-500"
              >
                <option value="order_date">Newest First</option>
                <option value="total_price">Total Price</option>
                <option value="grand_total">Grand Total</option>
              </select>

              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-colors"
              >
                <FilterX size={18} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <Th>ID</Th>
                  <Th>Customer Details</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Order Date</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <Td>
                      <span className="font-mono text-xs text-slate-400 font-bold">#{order.id}</span>
                    </Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{order.full_name}</span>
                        <span className="text-xs text-slate-500">{order.phone_number}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900">₹{order.grand_total.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sub: ₹{order.total_price}</span>
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge status={order.status} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={14} />
                        <span className="text-sm font-medium">
                          {new Date(order.order_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredOrders.length === 0 && (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Search className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No orders found</h3>
              <p className="text-slate-500">Try adjusting your filters or search term.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-8 py-6 bg-slate-50/50 border-t border-slate-50">
              <p className="text-sm text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-900">{paginatedOrders.length}</span> of {filteredOrders.length}
              </p>
              
              <div className="flex items-center gap-2">
                <PaginationButton 
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </PaginationButton>

                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, idx) => {
                    const p = idx + 1;
                    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-10 h-10 rounded-xl font-bold transition-all ${
                            p === currentPage 
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-100" 
                            : "text-slate-500 hover:bg-white"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>

                <PaginationButton 
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={18} />
                </PaginationButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Custom Components
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.15em]">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-8 py-5 text-sm ${className}`}>
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-indigo-100 text-indigo-700",
    "out of delivery": "bg-orange-100 text-orange-700",
    delivered: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${configs[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

function StatCard({ title, value, icon, variant, isCurrency }: any) {
  const styles: any = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${styles[variant]} rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{title}</p>
      <h2 className="text-3xl font-black text-slate-900 mt-1">
        {isCurrency ? "₹" : ""}{value.toLocaleString()}
      </h2>
    </div>
  );
}

function PaginationButton({ children, disabled, onClick }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
    >
      {children}
    </button>
  );
}
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
  Calendar,
  Loader2,
  FileText
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
  const itemsPerPage = 12;

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
      .limit(500);

    if (!error) setOrders(data as Order[]);
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

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.grand_total), 0);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Swaadha_Master_Log");
    XLSX.writeFile(workbook, `Swaadha_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBFBFC] gap-4">
       <Loader2 className="w-12 h-12 text-[#c4a174] animate-spin" />
       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2b2652]">Generating Intelligence...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] font-sans selection:bg-[#c4a174] selection:text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg shadow-[#2b2652]/20">
                <FileText className="text-[#c4a174] w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Financial Ledger</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
              Order <span className="text-[#c4a174] italic">Analytics</span>
            </h1>
          </div>
          
          <button
            onClick={exportToExcel}
            className="h-14 px-8 bg-white text-[#2b2652] border border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:border-[#c4a174] transition-all flex items-center gap-3 shadow-sm active:scale-95 group"
          >
            <Download size={18} className="text-[#c4a174] group-hover:-translate-y-0.5 transition-transform" />
            Export Archive
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Volume" value={totalOrders} icon={<Package size={22}/>} variant="brand" />
          <StatCard title="Active Queues" value={pendingOrders} icon={<Clock size={22}/>} variant="gold" />
          <StatCard title="Fulfilled" value={deliveredOrders} icon={<CheckCircle2 size={22}/>} variant="brand" />
          <StatCard title="Gross Revenue" value={totalRevenue} icon={<TrendingUp size={22}/>} variant="gold" isCurrency />
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-white p-4 rounded-[1.8rem] border border-slate-100 shadow-sm">
          <div className="lg:col-span-7 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#c4a174] transition-colors" size={18} />
            <input
              type="text"
              placeholder="SEARCH BY CLIENT OR CONTACT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#c4a174]/20 text-xs font-black uppercase tracking-widest transition-all"
            />
          </div>
          
          <div className="lg:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full h-14 px-6 bg-slate-50 border-none rounded-xl outline-none font-black text-[10px] uppercase tracking-widest text-[#2b2652] cursor-pointer"
            >
              <option value="order_date">Newest Entries</option>
              <option value="total_price">Subtotal Value</option>
              <option value="grand_total">Gross Value</option>
            </select>
          </div>

          <button
            onClick={clearFilters}
            className="lg:col-span-2 h-14 flex items-center justify-center gap-2 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#c4a174] hover:text-[#2b2652] transition-all"
          >
            <FilterX size={16} /> Reset Filters
          </button>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <Th>Registry ID</Th>
                  <Th>Client Credentials</Th>
                  <Th>Financials</Th>
                  <Th>Log Status</Th>
                  <Th>Timestamp</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-[#c4a174]/5 transition-colors">
                    <Td>
                      <span className="font-black text-[10px] text-[#c4a174] bg-[#c4a174]/10 px-3 py-1 rounded-lg">#{order.id}</span>
                    </Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-black text-sm text-[#2b2652] uppercase tracking-tight group-hover:text-[#c4a174] transition-colors">{order.full_name}</span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5">{order.phone_number}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-black text-[#2b2652]">₹{order.grand_total.toLocaleString()}</span>
                        <span className="text-[9px] text-[#c4a174] font-black uppercase tracking-tighter">Sub: ₹{order.total_price}</span>
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge status={order.status} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 text-[#2b2652] font-black text-[10px] uppercase">
                        <Calendar size={12} className="text-[#c4a174]" />
                        {new Date(order.order_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-32 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.5em] italic">
              No matching records found in archive
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-10 py-8 bg-slate-50/50 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                Page {currentPage} <span className="text-[#c4a174]">/</span> {totalPages}
              </p>
              
              <div className="flex items-center gap-3">
                <PaginationBtn onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={18} />
                </PaginationBtn>

                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, idx) => {
                    const p = idx + 1;
                    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${
                            p === currentPage 
                            ? "bg-[#2b2652] text-[#c4a174] shadow-lg shadow-[#2b2652]/20 scale-110" 
                            : "text-slate-400 hover:text-[#2b2652]"
                          }`}
                        >
                          {p.toString().padStart(2, '0')}
                        </button>
                      );
                    }
                    if (p === 2 || p === totalPages - 1) return <span key={p} className="text-slate-300 text-xs">...</span>;
                    return null;
                  })}
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

// Reusable UI components
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-10 py-7 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-10 py-6 text-sm">{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    pending: "bg-slate-100 text-[#2b2652]",
    delivered: "bg-[#c4a174]/10 text-[#c4a174] border-[#c4a174]/20",
    "out of delivery": "bg-[#2b2652] text-white",
  };

  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent ${configs[status] || "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
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
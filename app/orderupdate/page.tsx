"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { 
  Search, 
  FilterX, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  LayoutDashboard,
  Calendar,
  Eye,
  ArrowUpRight
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Order {
  id: number;
  full_name: string;
  grand_total: number;
  order_date: string;
  status: string;
}

interface OrderCounts {
  pending: number;
  confirmed: number;
  processing: number;
  out_for_delivery: number;
  delivered: number;
}

export default function OrdersDashboard() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<OrderCounts>({
    pending: 0,
    confirmed: 0,
    processing: 0,
    out_for_delivery: 0,
    delivered: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("orders").select("*", { count: "exact" });
    if (search) query = query.ilike("full_name", `%${search}%`);
    if (statusFilter) query = query.eq("status", statusFilter);
    query = query.order("order_date", { ascending: sortOrder === "asc" }).range(from, to);

    const { data, count, error } = await query;
    if (!error) {
      setOrders(data as Order[]);
      setTotalOrders(count || 0);
    }
    setLoading(false);
  };

  const fetchCounts = async () => {
    const { data } = await supabase.from("orders").select("status");
    const newCounts: OrderCounts = {
      pending: 0, confirmed: 0, processing: 0, out_for_delivery: 0, delivered: 0,
    };

    data?.forEach((item: any) => {
      const s = item.status?.toLowerCase();
      if (s === "pending") newCounts.pending++;
      else if (s === "confirmed") newCounts.confirmed++;
      else if (s === "processing") newCounts.processing++;
      else if (s === "out_for_delivery" || s === "out of delivery") newCounts.out_for_delivery++;
      else if (s === "delivered") newCounts.delivered++;
    });
    setCounts(newCounts);
  };

  useEffect(() => {
    fetchOrders();
    fetchCounts();
  }, [search, statusFilter, sortOrder, page]);

  const totalPages = Math.ceil(totalOrders / pageSize);

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-4 md:p-10 selection:bg-brand-gold selection:text-white">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-[2px] bg-brand-gold" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gold">Studio Registry</span>
            </div>
            <h1 className="text-5xl font-black text-brand-blue tracking-tighter uppercase leading-none">
              Order <span className="text-brand-gold italic">Ledger</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-brand-blue/5">
            <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-brand-gold shadow-lg">
              <Package size={20} />
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Managed</p>
               <p className="text-2xl font-black text-brand-blue leading-none tracking-tight">{totalOrders}</p>
            </div>
          </div>
        </div>

        {/* Status Analytics - Redesigned Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatusCard label="In Queue" value={counts.pending} icon={<Clock size={18}/>} color="gold" />
          <StatusCard label="Confirmed" value={counts.confirmed} icon={<CheckCircle2 size={18}/>} color="blue" />
          <StatusCard label="Workplace" value={counts.processing} icon={<LayoutDashboard size={18}/>} color="blue" />
          <StatusCard label="Transit" value={counts.out_for_delivery} icon={<Truck size={18}/>} color="gold" />
          <StatusCard label="Archived" value={counts.delivered} icon={<Package size={18}/>} color="green" />
        </div>

        {/* Filter Controls */}
        <div className="bg-brand-blue p-6 rounded-[2.5rem] shadow-2xl shadow-brand-blue/20">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="FIND CLIENT BY NAME OR ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-14 pr-6 py-5 bg-white/5 border-none rounded-[1.5rem] focus:ring-2 focus:ring-brand-gold text-[11px] font-bold text-white uppercase tracking-widest transition-all placeholder:text-slate-500"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-white/5 border-none rounded-2xl px-8 py-5 text-[10px] font-black text-white uppercase tracking-widest focus:ring-2 focus:ring-brand-gold outline-none cursor-pointer"
              >
                <option className="text-black" value="">Status: All</option>
                <option className="text-black" value="placed">Placed</option>
                <option className="text-black" value="confirmed">Confirmed</option>
                <option className="text-black" value="processing">Processing</option>
                <option className="text-black" value="out_for_delivery">Transit</option>
                <option className="text-black" value="delivered">Delivered</option>
              </select>

              <button
                onClick={() => { setSearch(""); setStatusFilter(""); setSortOrder("desc"); setPage(1); }}
                className="p-5 bg-brand-gold text-brand-blue rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-brand-gold/20"
                title="Reset Workspace"
              >
                <FilterX size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-brand-blue/5 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Creation Date</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Client Identity</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Settlement</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                       <div className="inline-flex items-center gap-3 text-brand-gold animate-pulse">
                         <div className="w-2 h-2 rounded-full bg-brand-gold" />
                         <span className="text-[11px] font-black uppercase tracking-[0.3em]">Synchronizing Registry...</span>
                       </div>
                    </td>
                  </tr>
                ) : orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-brand-blue group-hover:text-brand-gold transition-colors">
                          <Calendar size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-brand-blue">
                            {new Date(order.order_date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(order.order_date).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-xs font-black text-brand-blue uppercase tracking-wider">{order.full_name}</span>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-sm font-black text-brand-blue tracking-tighter">₹{order.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={() => router.push(`/orderupdate/vieworder/${order.id}`)}
                        className="p-3 bg-brand-blue text-white rounded-xl hover:bg-brand-gold transition-all shadow-lg hover:shadow-brand-gold/20"
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="px-10 py-8 bg-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-50">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page</span>
              <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                 <span className="text-xs font-black text-brand-blue">{page}</span>
                 <span className="text-slate-300">/</span>
                 <span className="text-xs font-black text-slate-400">{totalPages}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-brand-blue hover:bg-brand-blue hover:text-white disabled:opacity-30 transition-all shadow-sm"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-brand-blue hover:bg-brand-blue hover:text-white disabled:opacity-30 transition-all shadow-sm"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Redesigned Components
function StatusCard({ label, value, icon, color }: any) {
  const themes: Record<string, string> = {
    gold: "bg-brand-gold/5 text-brand-gold border-brand-gold/10",
    blue: "bg-brand-blue/5 text-brand-blue border-brand-blue/10",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className={`${themes[color]} border p-6 rounded-[2rem] flex flex-col gap-4 shadow-sm group hover:scale-[1.02] transition-transform`}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-inherit">{icon}</div>
        <span className="text-2xl font-black tracking-tighter">{value}</span>
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-brand-gold/10 text-brand-gold",
    confirmed: "bg-brand-blue text-white",
    processing: "bg-slate-100 text-brand-blue border-slate-200",
    out_for_delivery: "bg-brand-gold text-brand-blue", 
    delivered: "bg-emerald-50 text-emerald-700",
  };

  const label = status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`px-5 py-2 text-[9px] rounded-xl font-black uppercase tracking-widest border inline-block ${colors[status] || "bg-slate-50 text-slate-400 border-slate-100"}`}>
      {label}
    </span>
  );
}